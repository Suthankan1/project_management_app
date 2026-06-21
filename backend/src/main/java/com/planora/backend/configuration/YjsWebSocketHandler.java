package com.planora.backend.configuration;

import java.io.IOException;
import java.net.URI;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import jakarta.annotation.PreDestroy;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.SubProtocolCapable;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.BinaryWebSocketHandler;

import com.planora.backend.model.ProjectPage;
import com.planora.backend.model.User;
import com.planora.backend.repository.ProjectPageRepository;
import com.planora.backend.service.JWTService;
import com.planora.backend.service.ProjectMembershipService;
import com.planora.backend.service.UserCacheService;

import io.jsonwebtoken.JwtException;

@Component
public class YjsWebSocketHandler extends BinaryWebSocketHandler implements SubProtocolCapable {

    private static final String ACCESS_TOKEN_COOKIE = "planora_access_token";
    private static final String JWT_PROTOCOL_PREFIX = "planora.jwt.";
    private static final CloseStatus UNAUTHORIZED = new CloseStatus(4401, "Unauthorized");
    private static final CloseStatus TOKEN_EXPIRED = new CloseStatus(4401, "Token expired");
    private static final CloseStatus FORBIDDEN = new CloseStatus(4403, "Forbidden");
    private static final CloseStatus BAD_REQUEST = new CloseStatus(4400, "Invalid room");
    private static final CloseStatus NOT_FOUND = new CloseStatus(4404, "Page not found");

    private final ConcurrentHashMap<String, CopyOnWriteArraySet<WebSocketSession>> rooms
            = new ConcurrentHashMap<>();
    private final ScheduledExecutorService tokenExpiryScheduler
            = Executors.newSingleThreadScheduledExecutor(r -> {
                Thread thread = new Thread(r, "yjs-token-expiry-closer");
                thread.setDaemon(true);
                return thread;
            });

    private final JWTService jwtService;
    private final UserCacheService userCacheService;
    private final ProjectMembershipService projectMembershipService;
    private final ProjectPageRepository projectPageRepository;

    public YjsWebSocketHandler(
            JWTService jwtService,
            UserCacheService userCacheService,
            ProjectMembershipService projectMembershipService,
            ProjectPageRepository projectPageRepository
    ) {
        this.jwtService = jwtService;
        this.userCacheService = userCacheService;
        this.projectMembershipService = projectMembershipService;
        this.projectPageRepository = projectPageRepository;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
        try {
            String roomId = extractRoomId(session);

            Long pageId = parsePageId(roomId);
            if (pageId == null) {
                session.close(BAD_REQUEST);
                return;
            }

            User user = authenticateUser(session);
            if (user == null || user.getUserId() == null) {
                session.close(UNAUTHORIZED);
                return;
            }

            ProjectPage page = projectPageRepository.findById(pageId).orElse(null);
            if (page == null) {
                session.close(NOT_FOUND);
                return;
            }

            if (!projectMembershipService.isProjectMember(page.getProjectId(), user.getUserId())) {
                session.close(FORBIDDEN);
                return;
            }

            scheduleTokenExpiryClose(session);
            rooms.computeIfAbsent(roomId, k -> new CopyOnWriteArraySet<>()).add(session);
        } catch (Exception e) {
            try {
                session.close(FORBIDDEN);
            } catch (IOException ex) {
                // ignore
            }
        }
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        if (isTokenExpired(session)) {
            closeQuietly(session, TOKEN_EXPIRED);
            return;
        }

        String roomId = extractRoomId(session);
        Set<WebSocketSession> room = rooms.get(roomId);
        if (room == null || !room.contains(session)) {
            try {
                session.close(FORBIDDEN);
            } catch (IOException e) {
                // ignore
            }
            return;
        }
        for (WebSocketSession peer : room) {
            if (peer.isOpen() && !peer.getId().equals(session.getId())) {
                try {
                    peer.sendMessage(message);
                } catch (IOException e) {
                    // peer disconnected mid-send, ignore
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String roomId = extractRoomId(session);
        Set<WebSocketSession> room = rooms.get(roomId);
        if (room != null) {
            room.remove(session);
            if (room.isEmpty()) rooms.remove(roomId);
        }
    }

    private String extractRoomId(WebSocketSession session) {
        URI uri = session.getUri();
        String path = (uri != null && uri.getPath() != null) ? uri.getPath() : ""; // e.g. /yjs/page-42
        String[] parts = path.split("/");
        return parts.length == 0 ? "" : parts[parts.length - 1];
    }

    private User authenticateUser(WebSocketSession session) {
        String token = extractToken(session);
        if (token == null || token.isBlank()) {
            return null;
        }

        try {
            String identity = jwtService.validateAccessTokenAndGetSubject(token);
            Date expiresAt = jwtService.extractExpiration(token);
            if (expiresAt == null || !expiresAt.toInstant().isAfter(Instant.now())) {
                return null;
            }
            session.getAttributes().put("tokenExpiresAt", expiresAt.toInstant());
            return userCacheService.resolveUserByEmailOrUsername(identity);
        } catch (JwtException | IllegalArgumentException ex) {
            return null;
        }
    }

    private Long parsePageId(String roomId) {
        if (roomId == null || roomId.isBlank()) {
            return null;
        }

        String candidate = roomId;
        if (candidate.startsWith("page-")) {
            candidate = candidate.substring("page-".length());
        }

        try {
            return Long.valueOf(candidate);
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    private String extractToken(WebSocketSession session) {
        HttpHeaders headers = session.getHandshakeHeaders();
        String authHeader = headers != null ? headers.getFirst("Authorization") : null;
        if (authHeader != null && !authHeader.isBlank()) {
            if (authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
                return authHeader.substring(7).trim();
            }
            return authHeader.trim();
        }

        String protocolToken = extractTokenFromProtocols(headers);
        if (protocolToken != null) {
            return protocolToken;
        }

        return extractTokenFromCookie(headers);
    }

    private String extractTokenFromProtocols(HttpHeaders headers) {
        if (headers == null) {
            return null;
        }

        List<String> protocolHeaders = headers.get("Sec-WebSocket-Protocol");
        if (protocolHeaders == null || protocolHeaders.isEmpty()) {
            return null;
        }

        for (String header : protocolHeaders) {
            if (header == null || header.isBlank()) {
                continue;
            }
            for (String protocol : header.split(",")) {
                String trimmed = protocol.trim();
                if (trimmed.startsWith(JWT_PROTOCOL_PREFIX)) {
                    return trimmed.substring(JWT_PROTOCOL_PREFIX.length()).trim();
                }
            }
        }

        return null;
    }

    private String extractTokenFromCookie(HttpHeaders headers) {
        if (headers == null) {
            return null;
        }

        List<String> cookieHeaders = headers.get(HttpHeaders.COOKIE);
        if (cookieHeaders == null || cookieHeaders.isEmpty()) {
            return null;
        }

        for (String header : cookieHeaders) {
            if (header == null || header.isBlank()) {
                continue;
            }
            for (String cookie : header.split(";")) {
                String[] keyValue = cookie.trim().split("=", 2);
                if (keyValue.length == 2 && ACCESS_TOKEN_COOKIE.equals(keyValue[0])) {
                    return keyValue[1].trim();
                }
            }
        }

        return null;
    }

    private void scheduleTokenExpiryClose(WebSocketSession session) {
        Object expiresAt = session.getAttributes().get("tokenExpiresAt");
        if (!(expiresAt instanceof Instant expiry)) {
            closeQuietly(session, TOKEN_EXPIRED);
            return;
        }

        long delayMs = expiry.toEpochMilli() - System.currentTimeMillis();
        if (delayMs <= 0) {
            closeQuietly(session, TOKEN_EXPIRED);
            return;
        }

        tokenExpiryScheduler.schedule(() -> {
            if (session.isOpen() && isTokenExpired(session)) {
                closeQuietly(session, TOKEN_EXPIRED);
            }
        }, delayMs, TimeUnit.MILLISECONDS);
    }

    private boolean isTokenExpired(WebSocketSession session) {
        Object expiresAt = session.getAttributes().get("tokenExpiresAt");
        return !(expiresAt instanceof Instant expiry) || !expiry.isAfter(Instant.now());
    }

    private void closeQuietly(WebSocketSession session, CloseStatus status) {
        try {
            session.close(status);
        } catch (IOException ex) {
            // ignore
        }
    }

    @PreDestroy
    void shutdownTokenExpiryScheduler() {
        tokenExpiryScheduler.shutdownNow();
    }

    @Override
    public List<String> getSubProtocols() {
        return List.of("planora-yjs");
    }
}

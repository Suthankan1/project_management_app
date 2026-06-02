package com.planora.backend.configuration;

import java.io.IOException;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.BinaryMessage;
import org.springframework.web.socket.CloseStatus;
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
public class YjsWebSocketHandler extends BinaryWebSocketHandler {

    private static final CloseStatus UNAUTHORIZED = new CloseStatus(4401, "Unauthorized");
    private static final CloseStatus FORBIDDEN = new CloseStatus(4403, "Forbidden");
    private static final CloseStatus BAD_REQUEST = new CloseStatus(4400, "Invalid room");
    private static final CloseStatus NOT_FOUND = new CloseStatus(4404, "Page not found");

    private final ConcurrentHashMap<String, CopyOnWriteArraySet<WebSocketSession>> rooms
            = new ConcurrentHashMap<>();

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

        rooms.computeIfAbsent(roomId, k -> new CopyOnWriteArraySet<>()).add(session);
    }

    @Override
    protected void handleBinaryMessage(WebSocketSession session, BinaryMessage message) {
        String roomId = extractRoomId(session);
        Set<WebSocketSession> room = rooms.getOrDefault(roomId, new CopyOnWriteArraySet<>());
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
            String identity = jwtService.extractUserName(token);
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

        URI uri = session.getUri();
        if (uri == null || uri.getQuery() == null || uri.getQuery().isBlank()) {
            return null;
        }

        HashMap<String, String> queryParams = new HashMap<>();
        for (String pair : uri.getQuery().split("&")) {
            String[] keyValue = pair.split("=", 2);
            if (keyValue.length != 2) {
                continue;
            }
            String key = URLDecoder.decode(keyValue[0], StandardCharsets.UTF_8);
            String value = URLDecoder.decode(keyValue[1], StandardCharsets.UTF_8);
            queryParams.put(key, value);
        }

        String queryToken = queryParams.get("token");
        if (queryToken == null || queryToken.isBlank()) {
            queryToken = queryParams.get("access_token");
        }
        return queryToken;
    }
}

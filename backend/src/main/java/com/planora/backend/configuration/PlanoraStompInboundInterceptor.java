package com.planora.backend.configuration;

import java.security.Principal;
import java.util.HashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

import com.planora.backend.model.User;
import com.planora.backend.service.JWTService;
import com.planora.backend.service.ProjectMembershipService;
import com.planora.backend.service.UserCacheService;

import com.planora.backend.exception.StompAuthException;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

@Component
public class PlanoraStompInboundInterceptor implements ChannelInterceptor {

    private static final Logger log = LoggerFactory.getLogger(PlanoraStompInboundInterceptor.class);
    private static final Pattern PROJECT_TOPIC_PATTERN = Pattern.compile("^/topic/project/(\\d+)(?:/.*)?$");
    private static final Pattern PROJECTS_TOPIC_PATTERN = Pattern.compile("^/topic/projects/(\\d+)(?:/.*)?$");
    private static final Pattern USER_PROJECT_QUEUE_PATTERN = Pattern.compile("^/user/queue/project/(\\d+)(?:/.*)?$");
        private static final Pattern USER_NOTIFICATION_DESTINATION_PATTERN =
            Pattern.compile("^/user/([^/]+)/queue/notifications(?:-badge)?$");

    private final JWTService jwtService;
    private final UserCacheService userCacheService;
    private final ProjectMembershipService projectMembershipService;

    public PlanoraStompInboundInterceptor(
            JWTService jwtService,
            UserCacheService userCacheService,
            ProjectMembershipService projectMembershipService
    ) {
        this.jwtService = jwtService;
        this.userCacheService = userCacheService;
        this.projectMembershipService = projectMembershipService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) {
            return message;
        }

        StompCommand command = accessor.getCommand();
        if (StompCommand.CONNECT.equals(command)) {
            authenticateConnect(accessor);
        } else if (StompCommand.SUBSCRIBE.equals(command)) {
            authorizeSubscribe(accessor);
        }

        return message;
    }

    private void authenticateConnect(StompHeaderAccessor accessor) {
        try {
            String auth = accessor.getFirstNativeHeader("Authorization");
            if (auth == null || auth.isBlank()) {
                throw new StompAuthException("Missing Authorization header", "AUTH_INVALID");
            }

            String token = extractBearerToken(auth);
            String identity = jwtService.validateAccessTokenAndGetSubject(token);
            User user = userCacheService.resolveUserByEmailOrUsername(identity);
            if (user == null || user.getUsername() == null || user.getUsername().isBlank()) {
                throw new StompAuthException("User not found for provided token", "AUTH_INVALID");
            }

            String normalizedUsername = user.getUsername().toLowerCase();
            accessor.setUser(new StompPrincipal(normalizedUsername));

            Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
            if (sessionAttributes == null) {
                sessionAttributes = new HashMap<>();
                accessor.setSessionAttributes(sessionAttributes);
            }
            sessionAttributes.put("username", normalizedUsername);
        } catch (ExpiredJwtException e) {
            throw new StompAuthException("JWT expired", "AUTH_EXPIRED", e);
        } catch (JwtException | IllegalArgumentException e) {
            throw new StompAuthException("Invalid JWT", "AUTH_INVALID", e);
        }
    }

    private void authorizeSubscribe(StompHeaderAccessor accessor) {
        String destination = accessor.getDestination();
        if (destination == null || destination.isBlank()) {
            return;
        }

        Principal principal = requireAuthenticatedPrincipal(accessor);

        if (isNotificationDestination(destination)) {
            authorizeNotificationDestination(destination, principal.getName());
        }

        Long projectId = extractProjectId(destination);
        if (projectId == null) {
            return;
        }

        User user = userCacheService.resolveUserByEmailOrUsername(principal.getName());
        if (user == null || user.getUserId() == null) {
            throw new AccessDeniedException("Unknown WebSocket user");
        }

        boolean allowed = projectMembershipService.isProjectMember(projectId, user.getUserId());
        if (!allowed) {
            log.warn("[WebSocket] Blocked unauthorized subscription. user={} destination={}",
                    principal.getName(), destination);
            throw new AccessDeniedException("Forbidden project subscription");
        }
    }

    private Principal requireAuthenticatedPrincipal(StompHeaderAccessor accessor) {
        Principal principal = accessor.getUser();
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new AccessDeniedException("Unauthenticated WebSocket subscription");
        }
        return principal;
    }

    private boolean isNotificationDestination(String destination) {
        return "/user/queue/notifications".equals(destination)
                || "/user/queue/notifications-badge".equals(destination)
                || USER_NOTIFICATION_DESTINATION_PATTERN.matcher(destination).matches();
    }

    private void authorizeNotificationDestination(String destination, String principalName) {
        Matcher matcher = USER_NOTIFICATION_DESTINATION_PATTERN.matcher(destination);
        if (!matcher.matches()) {
            return;
        }

        String requestedUser = matcher.group(1).trim().toLowerCase();
        String authenticatedUser = principalName.trim().toLowerCase();
        if (!requestedUser.equals(authenticatedUser)) {
            log.warn("[WebSocket] Blocked notification subscription mismatch. principal={} destination={}",
                    principalName, destination);
            throw new AccessDeniedException("Forbidden notification subscription");
        }
    }

    private Long extractProjectId(String destination) {
        Matcher matcher = PROJECT_TOPIC_PATTERN.matcher(destination);
        if (matcher.matches()) {
            return Long.valueOf(matcher.group(1));
        }

        matcher = PROJECTS_TOPIC_PATTERN.matcher(destination);
        if (matcher.matches()) {
            return Long.valueOf(matcher.group(1));
        }

        matcher = USER_PROJECT_QUEUE_PATTERN.matcher(destination);
        if (matcher.matches()) {
            return Long.valueOf(matcher.group(1));
        }

        return null;
    }

    private String extractBearerToken(String authHeader) {
        if (authHeader.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return authHeader.substring(7).trim();
        }
        return authHeader.trim();
    }
}

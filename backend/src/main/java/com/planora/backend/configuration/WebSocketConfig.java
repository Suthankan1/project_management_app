package com.planora.backend.configuration;


import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import com.planora.backend.model.User;
import com.planora.backend.service.JWTService;
import com.planora.backend.service.UserCacheService;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);

    private final JWTService jwtService;
    private final UserCacheService userCacheService;

    public WebSocketConfig(JWTService jwtService, UserCacheService userCacheService) {
        this.jwtService = jwtService;
        this.userCacheService = userCacheService;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
                
        registry.addEndpoint("/ws-native")
                .setAllowedOriginPatterns("*");
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor == null) {
                    log.error("[WebSocket] No StompHeaderAccessor found");
                    return message;
                }

                if (StompCommand.CONNECT.equals(accessor.getCommand())) {
                    try {
                        // Read JWT token from Authorization header (Bearer token)
                        String auth = accessor.getFirstNativeHeader("Authorization");
                        
                        log.info("[WebSocket] CONNECT received with Authorization header: {}", auth != null ? "Present" : "Missing");

                        if (auth == null || auth.trim().isEmpty()) {
                            log.warn("[WebSocket] Missing Authorization header");
                            return null;
                        }

                        // Remove "Bearer " prefix if present
                        String token = auth.startsWith("Bearer ") ?
                                auth.substring("Bearer ".length()).trim() :
                                auth.trim();

                        log.info("[WebSocket] Token received, extracting username...");
                        
                        // Extract username from token
                        String email = jwtService.extractUserName(token);
                        log.info("[WebSocket] Extracted email from token: {}", email);

                        // Find user by email
                        User user = userCacheService.resolveUserByEmailOrUsername(email);
                        
                        if (user == null) {
                            log.warn("[WebSocket] User not found in database for email: {}", email);
                            return null;
                        }

                        String username = user.getUsername();
                        
                        if (username == null || username.trim().isEmpty()) {
                            log.warn("[WebSocket] Invalid username in token for user: {}", email);
                            return null;
                        }

                        String normalizedUsername = username.toLowerCase();

                        log.info("[WebSocket] Setting user principal: {}", normalizedUsername);
                        accessor.setUser(new StompPrincipal(normalizedUsername));
                        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                        if (sessionAttributes == null) {
                            sessionAttributes = new HashMap<>();
                            accessor.setSessionAttributes(sessionAttributes);
                        }
                        sessionAttributes.put("username", normalizedUsername);
                        
                        log.info("[WebSocket] Authentication successful for user: {}", normalizedUsername);
                    } catch (io.jsonwebtoken.ExpiredJwtException e) {
                        log.warn("[WebSocket] Authentication failed: JWT expired");
                        return null;
                    } catch (io.jsonwebtoken.JwtException | IllegalArgumentException e) {
                        log.warn("[WebSocket] Authentication failed: {}", e.getMessage());
                        return null;
                    } catch (Exception e) {
                        log.error("[WebSocket] Unexpected authentication error: {}", e.getMessage(), e);
                        return null;
                    }
                }

                return message;
            }
        });
    }
}
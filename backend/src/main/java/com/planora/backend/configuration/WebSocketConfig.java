package com.planora.backend.configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final PlanoraStompInboundInterceptor planoraStompInboundInterceptor;
    private final PlanoraStompErrorHandler planoraStompErrorHandler;

    @Value("${app.websocket.allowed-origins:${cors.allowed-origins:http://localhost:3000,http://localhost:8081}}")
    private String allowedOrigins;

    public WebSocketConfig(
            PlanoraStompInboundInterceptor planoraStompInboundInterceptor,
            PlanoraStompErrorHandler planoraStompErrorHandler
    ) {
        this.planoraStompInboundInterceptor = planoraStompInboundInterceptor;
        this.planoraStompErrorHandler = planoraStompErrorHandler;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(resolveAllowedOrigins())
                .withSockJS();

        registry.addEndpoint("/ws-native")
                .setAllowedOriginPatterns(resolveAllowedOrigins());

        registry.setErrorHandler(planoraStompErrorHandler);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(planoraStompInboundInterceptor);
    }

    private String[] resolveAllowedOrigins() {
        return Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);
    }
}

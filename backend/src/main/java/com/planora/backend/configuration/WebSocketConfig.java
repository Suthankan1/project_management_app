package com.planora.backend.configuration;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final PlanoraStompInboundInterceptor planoraStompInboundInterceptor;
    private final PlanoraStompErrorHandler planoraStompErrorHandler;

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
                .setAllowedOriginPatterns("*")
                .withSockJS();

        registry.addEndpoint("/ws-native")
                .setAllowedOriginPatterns("*");

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
}
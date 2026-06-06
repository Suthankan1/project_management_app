package com.planora.backend.configuration;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageHeaderAccessor;

import com.planora.backend.exception.StompAuthException;

class PlanoraStompErrorHandlerTest {

    private final PlanoraStompErrorHandler errorHandler = new PlanoraStompErrorHandler();

    @Test
    void handleInternalAppendsErrorCodeForStompAuthException() {
        StompHeaderAccessor errorHeaderAccessor = StompHeaderAccessor.create(StompCommand.ERROR);
        errorHeaderAccessor.setLeaveMutable(true);
        byte[] payload = "test payload".getBytes();
        StompAuthException cause = new StompAuthException("Expired token", "AUTH_EXPIRED");

        Message<byte[]> result = errorHandler.handleInternal(
                errorHeaderAccessor,
                payload,
                cause,
                null
        );

        assertNotNull(result);
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(resultAccessor);
        assertEquals("AUTH_EXPIRED", resultAccessor.getFirstNativeHeader("x-error-code"));
    }

    @Test
    void handleInternalAppendsErrorCodeForWrappedStompAuthException() {
        StompHeaderAccessor errorHeaderAccessor = StompHeaderAccessor.create(StompCommand.ERROR);
        errorHeaderAccessor.setLeaveMutable(true);
        byte[] payload = "test payload".getBytes();
        StompAuthException authEx = new StompAuthException("Expired token", "AUTH_EXPIRED");
        RuntimeException cause = new RuntimeException("Wrapped", authEx);

        Message<byte[]> result = errorHandler.handleInternal(
                errorHeaderAccessor,
                payload,
                cause,
                null
        );

        assertNotNull(result);
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(resultAccessor);
        assertEquals("AUTH_EXPIRED", resultAccessor.getFirstNativeHeader("x-error-code"));
    }

    @Test
    void handleInternalDoesNotAppendErrorCodeForOtherExceptions() {
        StompHeaderAccessor errorHeaderAccessor = StompHeaderAccessor.create(StompCommand.ERROR);
        errorHeaderAccessor.setLeaveMutable(true);
        byte[] payload = "test payload".getBytes();
        RuntimeException cause = new RuntimeException("Other error");

        Message<byte[]> result = errorHandler.handleInternal(
                errorHeaderAccessor,
                payload,
                cause,
                null
        );

        assertNotNull(result);
        StompHeaderAccessor resultAccessor = MessageHeaderAccessor.getAccessor(result, StompHeaderAccessor.class);
        assertNotNull(resultAccessor);
        assertNull(resultAccessor.getFirstNativeHeader("x-error-code"));
    }
}

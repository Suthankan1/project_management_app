package com.planora.backend.configuration;

import org.springframework.messaging.Message;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.web.socket.messaging.StompSubProtocolErrorHandler;
import org.springframework.stereotype.Component;

import com.planora.backend.exception.StompAuthException;

@Component
public class PlanoraStompErrorHandler extends StompSubProtocolErrorHandler {

    @Override
    protected Message<byte[]> handleInternal(
            StompHeaderAccessor errorHeaderAccessor,
            byte[] errorPayload,
            Throwable cause,
            StompHeaderAccessor clientHeaderAccessor) {

        Throwable rootCause = findStompAuthException(cause);
        if (rootCause instanceof StompAuthException) {
            errorHeaderAccessor.addNativeHeader("x-error-code", ((StompAuthException) rootCause).getErrorCode());
        }

        return super.handleInternal(errorHeaderAccessor, errorPayload, cause, clientHeaderAccessor);
    }

    private Throwable findStompAuthException(Throwable ex) {
        Throwable current = ex;
        while (current != null) {
            if (current instanceof StompAuthException) {
                return current;
            }
            Throwable next = current.getCause();
            if (next == current || next == null) {
                break;
            }
            current = next;
        }
        return null;
    }
}

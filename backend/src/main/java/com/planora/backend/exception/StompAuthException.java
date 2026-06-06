package com.planora.backend.exception;

import org.springframework.messaging.MessagingException;

public class StompAuthException extends MessagingException {
    private final String errorCode;

    public StompAuthException(String description, String errorCode) {
        super(description);
        this.errorCode = errorCode;
    }

    public StompAuthException(String description, String errorCode, Throwable cause) {
        super(description, cause);
        this.errorCode = errorCode;
    }

    public String getErrorCode() {
        return errorCode;
    }
}

package com.planora.backend.exception;

public class GithubAuthenticationException extends RuntimeException {
    public GithubAuthenticationException(String message) {
        super(message);
    }
}

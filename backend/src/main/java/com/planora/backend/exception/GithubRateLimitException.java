package com.planora.backend.exception;

public class GithubRateLimitException extends RuntimeException {
    public GithubRateLimitException(String message) {
        super(message);
    }
}

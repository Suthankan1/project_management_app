package com.planora.backend.exception;

public class GithubIntegrationDisabledException extends IllegalStateException {
    public GithubIntegrationDisabledException(String message) {
        super(message);
    }
}

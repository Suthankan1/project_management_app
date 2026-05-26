package com.planora.backend.exception;

public class GithubRepositoryNotFoundException extends RuntimeException {
    public GithubRepositoryNotFoundException(String message) {
        super(message);
    }
}

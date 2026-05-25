package com.planora.backend.exception;

public class GithubIssueValidationException extends RuntimeException {

    public GithubIssueValidationException(String message) {
        super(message);
    }
}

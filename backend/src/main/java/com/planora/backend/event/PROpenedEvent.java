package com.planora.backend.event;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class PROpenedEvent extends ApplicationEvent {

    private final String repoFullName;
    private final int prNumber;
    private final String prTitle;
    private final String authorLogin;
    private final String branch;

    public PROpenedEvent(
            Object source,
            String repoFullName,
            int prNumber,
            String prTitle,
            String authorLogin,
            String branch) {
        super(source);
        this.repoFullName = repoFullName;
        this.prNumber = prNumber;
        this.prTitle = prTitle;
        this.authorLogin = authorLogin;
        this.branch = branch;
    }
}

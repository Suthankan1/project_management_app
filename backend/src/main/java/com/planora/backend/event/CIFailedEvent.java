package com.planora.backend.event;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class CIFailedEvent extends ApplicationEvent {

    private final String repoFullName;
    private final String branch;
    private final String commitSha;
    private final String workflowName;

    public CIFailedEvent(Object source, String repoFullName, String branch, String commitSha, String workflowName) {
        super(source);
        this.repoFullName = repoFullName;
        this.branch = branch;
        this.commitSha = commitSha;
        this.workflowName = workflowName;
    }
}

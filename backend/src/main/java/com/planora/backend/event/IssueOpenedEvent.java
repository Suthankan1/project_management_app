package com.planora.backend.event;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class IssueOpenedEvent extends ApplicationEvent {

    private final String repoFullName;
    private final int issueNumber;
    private final String issueTitle;

    public IssueOpenedEvent(Object source, String repoFullName, int issueNumber, String issueTitle) {
        super(source);
        this.repoFullName = repoFullName;
        this.issueNumber = issueNumber;
        this.issueTitle = issueTitle;
    }
}

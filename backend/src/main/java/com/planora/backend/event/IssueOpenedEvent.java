package com.planora.backend.event;

import java.util.List;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class IssueOpenedEvent extends ApplicationEvent {

    private final String repoFullName;
    private final int issueNumber;
    private final String issueTitle;
    private final String issueBody;
    private final String authorLogin;
    private final List<String> labels;

    public IssueOpenedEvent(
            Object source,
            String repoFullName,
            int issueNumber,
            String issueTitle,
            String issueBody,
            String authorLogin,
            List<String> labels) {
        super(source);
        this.repoFullName = repoFullName;
        this.issueNumber = issueNumber;
        this.issueTitle = issueTitle;
        this.issueBody = issueBody;
        this.authorLogin = authorLogin;
        this.labels = labels == null ? List.of() : List.copyOf(labels);
    }
}

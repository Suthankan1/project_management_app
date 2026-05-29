package com.planora.backend.event;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class IssueLabeledEvent extends ApplicationEvent {

    private final String repoFullName;
    private final int issueNumber;
    private final String issueTitle;
    private final String labelName;
    private final String labelColor;

    public IssueLabeledEvent(Object source, String repoFullName, int issueNumber, String issueTitle) {
        this(source, repoFullName, issueNumber, issueTitle, "", "");
    }

    public IssueLabeledEvent(
            Object source,
            String repoFullName,
            int issueNumber,
            String issueTitle,
            String labelName,
            String labelColor) {
        super(source);
        this.repoFullName = repoFullName;
        this.issueNumber = issueNumber;
        this.issueTitle = issueTitle;
        this.labelName = labelName;
        this.labelColor = labelColor;
    }
}

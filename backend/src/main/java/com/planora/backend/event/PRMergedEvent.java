package com.planora.backend.event;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class PRMergedEvent extends ApplicationEvent {

    private final String repoFullName;
    private final int prNumber;
    private final String prTitle;

    public PRMergedEvent(Object source, String repoFullName, int prNumber, String prTitle) {
        super(source);
        this.repoFullName = repoFullName;
        this.prNumber = prNumber;
        this.prTitle = prTitle;
    }
}

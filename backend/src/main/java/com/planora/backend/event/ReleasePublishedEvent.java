package com.planora.backend.event;

import org.springframework.context.ApplicationEvent;

import lombok.Getter;

@Getter
public class ReleasePublishedEvent extends ApplicationEvent {

    private final String repoFullName;
    private final String tagName;
    private final String releaseName;
    private final String releaseUrl;

    public ReleasePublishedEvent(
            Object source,
            String repoFullName,
            String tagName,
            String releaseName,
            String releaseUrl) {
        super(source);
        this.repoFullName = repoFullName;
        this.tagName = tagName;
        this.releaseName = releaseName;
        this.releaseUrl = releaseUrl;
    }
}

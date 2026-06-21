package com.planora.backend.service;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import com.planora.backend.dto.GithubCIUpdatePayload;
import com.planora.backend.dto.GithubIssueUpdatePayload;
import com.planora.backend.dto.GithubPRUpdatePayload;
import com.planora.backend.dto.GithubTaskBadgePayload;

class GithubEventBroadcasterTest {

    private SimpMessagingTemplate messagingTemplate;
    private GithubEventBroadcaster broadcaster;

    @BeforeEach
    void setUp() {
        messagingTemplate = mock(SimpMessagingTemplate.class);
        broadcaster = new GithubEventBroadcaster(messagingTemplate);
    }

    @Test
    void broadcastsGithubUpdatesToProjectTopics() {
        GithubPRUpdatePayload prPayload = new GithubPRUpdatePayload(
                "opened", 17, "Improve sync", "https://github.com/planora/app/pull/17", "octocat");
        GithubCIUpdatePayload ciPayload = new GithubCIUpdatePayload(
                "Backend checks", "main", "failure", "abcdef1234567890");
        GithubIssueUpdatePayload issuePayload = new GithubIssueUpdatePayload(
                "opened", 34, "Broken sync", "octocat");
        GithubTaskBadgePayload badgePayload = new GithubTaskBadgePayload(
                88L, 34L, "planora/app", "open");

        broadcaster.broadcastPRUpdate(41L, prPayload);
        broadcaster.broadcastCIUpdate(41L, ciPayload);
        broadcaster.broadcastIssueUpdate(41L, issuePayload);
        broadcaster.broadcastTaskBadgeUpdate(41L, 88L, badgePayload);

        verify(messagingTemplate).convertAndSend("/topic/projects/41/github/prs", prPayload);
        verify(messagingTemplate).convertAndSend("/topic/projects/41/github/ci", ciPayload);
        verify(messagingTemplate).convertAndSend("/topic/projects/41/github/issues", issuePayload);
        verify(messagingTemplate).convertAndSend("/topic/projects/41/github/task-badges", badgePayload);
    }
}

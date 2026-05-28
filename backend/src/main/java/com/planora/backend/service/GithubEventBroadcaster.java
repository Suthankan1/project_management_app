package com.planora.backend.service;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.planora.backend.dto.GithubCIUpdatePayload;
import com.planora.backend.dto.GithubIssueUpdatePayload;
import com.planora.backend.dto.GithubPRUpdatePayload;
import com.planora.backend.dto.GithubTaskBadgePayload;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GithubEventBroadcaster {

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastPRUpdate(Long projectId, GithubPRUpdatePayload payload) {
        messagingTemplate.convertAndSend("/topic/projects/" + projectId + "/github/prs", payload);
    }

    public void broadcastCIUpdate(Long projectId, GithubCIUpdatePayload payload) {
        messagingTemplate.convertAndSend("/topic/projects/" + projectId + "/github/ci", payload);
    }

    public void broadcastIssueUpdate(Long projectId, GithubIssueUpdatePayload payload) {
        messagingTemplate.convertAndSend("/topic/projects/" + projectId + "/github/issues", payload);
    }

    public void broadcastTaskBadgeUpdate(Long projectId, Long taskId, GithubTaskBadgePayload payload) {
        messagingTemplate.convertAndSend("/topic/projects/" + projectId + "/github/task-badges", payload);
    }
}

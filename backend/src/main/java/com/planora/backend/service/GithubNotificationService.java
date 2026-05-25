package com.planora.backend.service;

import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Service;

import com.planora.backend.model.User;
import com.planora.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GithubNotificationService {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    private void ensureDependenciesInjected() {
        if (notificationService == null || userRepository == null) {
            throw new IllegalStateException("GitHub notification dependencies were not injected");
        }
    }

    public void notifyPROpened(String repoFullName, int prNumber, String prTitle, String authorGithubLogin) {
        ensureDependenciesInjected();
        // Task 107: wire GitHub PR-opened notifications.
    }

    public void notifyPRMerged(String repoFullName, int prNumber, String prTitle, String mergerGithubLogin) {
        ensureDependenciesInjected();
        // Task 108: wire GitHub PR-merged notifications.
    }

    public void notifyReviewRequested(String repoFullName, int prNumber, String prTitle, String reviewerGithubLogin) {
        ensureDependenciesInjected();
        // Task 109: wire review-request notifications.
    }

    public void notifyCIFailed(String repoFullName, String branch, String commitSha, String workflowName) {
        ensureDependenciesInjected();
        // Task 110: wire CI failure notifications.
    }

    public void notifyIssueEvent(String repoFullName, int issueNumber, String issueTitle, String action, String actorGithubLogin) {
        ensureDependenciesInjected();
        // Task 111: wire issue-event notifications.
    }

    public void notifyRelease(String repoFullName, String tagName, String releaseName) {
        ensureDependenciesInjected();
        // Task 112: wire release notifications.
    }

    public List<User> resolveUsersFromGithubLogin(String githubLogin) {
        ensureDependenciesInjected();
        if (githubLogin == null || githubLogin.isBlank()) {
            return Collections.emptyList();
        }

        return userRepository.findByGithubUsernameIgnoreCase(githubLogin);
    }
}
package com.planora.backend.service;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import com.planora.backend.event.CIFailedEvent;
import com.planora.backend.event.PRMergedEvent;
import com.planora.backend.model.Project;
import com.planora.backend.model.TeamMember;
import com.planora.backend.model.User;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.TeamMemberRepository;
import com.planora.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GithubNotificationService {

    private static final Logger log = LoggerFactory.getLogger(GithubNotificationService.class);

    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ApplicationEventPublisher applicationEventPublisher;

    private void ensureDependenciesInjected() {
        if (notificationService == null || userRepository == null
                || projectRepository == null || teamMemberRepository == null
                || applicationEventPublisher == null) {
            throw new IllegalStateException("GitHub notification dependencies were not injected");
        }
    }

    public void notifyPROpened(String repoFullName, int prNumber, String prTitle, String authorGithubLogin) {
        ensureDependenciesInjected();
        if (repoFullName == null || repoFullName.isBlank() || prNumber <= 0) {
            return;
        }

        Set<Long> authorIds = resolveUsersFromGithubLogin(authorGithubLogin).stream()
                .map(User::getUserId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, User> recipients = new LinkedHashMap<>();

        for (Project project : projectRepository.findByGithubRepoFullNameIgnoreCase(repoFullName.trim())) {
            if (project.getTeam() == null || project.getTeam().getId() == null) {
                continue;
            }
            for (TeamMember member : teamMemberRepository.findByTeamId(project.getTeam().getId())) {
                User user = member.getUser();
                if (user != null && user.getUserId() != null && !authorIds.contains(user.getUserId())) {
                    recipients.putIfAbsent(user.getUserId(), user);
                }
            }
        }

        String prefix = "\uD83D\uDD00 PR opened: #" + prNumber + " ";
        String message = prefix + safeTitle(prTitle) + " by @" + safeLogin(authorGithubLogin);
        String link = "https://github.com/" + repoFullName.trim() + "/pull/" + prNumber;
        recipients.values().forEach(recipient ->
                notificationService.createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                        recipient, message, link, prefix));
    }

    public void notifyPRMerged(String repoFullName, int prNumber, String prTitle, String mergerGithubLogin) {
        ensureDependenciesInjected();
        if (repoFullName == null || repoFullName.isBlank() || prNumber <= 0) {
            return;
        }

        String normalizedRepoFullName = repoFullName.trim();
        Set<Long> mergerIds = resolveUsersFromGithubLogin(mergerGithubLogin).stream()
                .map(User::getUserId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, User> recipients = new LinkedHashMap<>();

        for (Project project : projectRepository.findByGithubRepoFullNameIgnoreCase(normalizedRepoFullName)) {
            if (project.getTeam() == null || project.getTeam().getId() == null) {
                continue;
            }
            for (TeamMember member : teamMemberRepository.findByTeamId(project.getTeam().getId())) {
                User user = member.getUser();
                if (user != null && user.getUserId() != null && !mergerIds.contains(user.getUserId())) {
                    recipients.putIfAbsent(user.getUserId(), user);
                }
            }
        }

        String prefix = "\u2705 PR merged: #" + prNumber + " ";
        String message = prefix + safeTitle(prTitle) + " by @" + safeLogin(mergerGithubLogin);
        String link = "https://github.com/" + normalizedRepoFullName + "/pull/" + prNumber;
        recipients.values().forEach(recipient ->
                notificationService.createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                        recipient, message, link, prefix));

        applicationEventPublisher.publishEvent(
                new PRMergedEvent(this, normalizedRepoFullName, prNumber, safeTitle(prTitle)));
    }

    public void notifyReviewRequested(String repoFullName, int prNumber, String prTitle, String reviewerGithubLogin) {
        ensureDependenciesInjected();
        if (repoFullName == null || repoFullName.isBlank() || prNumber <= 0) {
            return;
        }

        List<User> reviewers = resolveUsersFromGithubLogin(reviewerGithubLogin);
        if (reviewers.isEmpty()) {
            log.warn("Skipping PR review-request notification: no Planora user mapped to GitHub login '{}'",
                    safeLogin(reviewerGithubLogin));
            return;
        }

        String normalizedRepoFullName = repoFullName.trim();
        String message = "\uD83D\uDC41 Review requested: #" + prNumber + " "
                + safeTitle(prTitle) + " in " + normalizedRepoFullName;
        String link = "https://github.com/" + normalizedRepoFullName + "/pull/" + prNumber;
        reviewers.forEach(reviewer -> notificationService.createNotification(reviewer, message, link));
    }

    public void notifyCIFailed(String repoFullName, String branch, String commitSha, String workflowName) {
        ensureDependenciesInjected();
        if (repoFullName == null || repoFullName.isBlank()
                || commitSha == null || commitSha.isBlank()) {
            return;
        }

        String normalizedRepoFullName = repoFullName.trim();
        String normalizedCommitSha = commitSha.trim();
        Map<Long, User> recipients = new LinkedHashMap<>();

        for (Project project : projectRepository.findByGithubRepoFullNameIgnoreCase(normalizedRepoFullName)) {
            if (project.getTeam() == null || project.getTeam().getId() == null) {
                continue;
            }
            for (TeamMember member : teamMemberRepository.findByTeamId(project.getTeam().getId())) {
                User user = member.getUser();
                if (user != null && user.getUserId() != null) {
                    recipients.putIfAbsent(user.getUserId(), user);
                }
            }
        }

        String shortSha = normalizedCommitSha.substring(0, Math.min(7, normalizedCommitSha.length()));
        String prefix = "\u274C CI failed: " + safeText(workflowName) + " on ";
        String message = prefix + safeText(branch) + " (" + shortSha + ")";
        String link = "https://github.com/" + normalizedRepoFullName + "/commit/" + normalizedCommitSha + "/checks";
        recipients.values().forEach(recipient ->
                notificationService.createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                        recipient, message, link, prefix));

        applicationEventPublisher.publishEvent(new CIFailedEvent(
                this, normalizedRepoFullName, safeText(branch), normalizedCommitSha, safeText(workflowName)));
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

    private String safeTitle(String title) {
        return title == null ? "" : title;
    }

    private String safeLogin(String login) {
        return login == null ? "" : login;
    }

    private String safeText(String text) {
        return text == null ? "" : text;
    }
}

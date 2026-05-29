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

import com.planora.backend.dto.GithubCIUpdatePayload;
import com.planora.backend.dto.GithubIssueUpdatePayload;
import com.planora.backend.dto.GithubPRUpdatePayload;
import com.planora.backend.event.CIFailedEvent;
import com.planora.backend.event.IssueLabeledEvent;
import com.planora.backend.event.IssueOpenedEvent;
import com.planora.backend.event.PRMergedEvent;
import com.planora.backend.event.PROpenedEvent;
import com.planora.backend.event.ReleasePublishedEvent;
import com.planora.backend.model.Project;
import com.planora.backend.model.Task;
import com.planora.backend.model.TeamMember;
import com.planora.backend.model.User;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.TaskRepository;
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
    private final TaskRepository taskRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ApplicationEventPublisher applicationEventPublisher;
    private final GithubEventBroadcaster githubEventBroadcaster;

    private void ensureDependenciesInjected() {
        if (notificationService == null || userRepository == null
                || projectRepository == null || taskRepository == null || teamMemberRepository == null
                || applicationEventPublisher == null || githubEventBroadcaster == null) {
            throw new IllegalStateException("GitHub notification dependencies were not injected");
        }
    }

    public void notifyPROpened(
            String repoFullName,
            int prNumber,
            String prTitle,
            String authorGithubLogin,
            String branch) {
        ensureDependenciesInjected();
        if (repoFullName == null || repoFullName.isBlank() || prNumber <= 0) {
            return;
        }

        String normalizedRepoFullName = repoFullName.trim();
        List<Project> projects = projectRepository.findByGithubRepoFullNameIgnoreCase(normalizedRepoFullName);
        Set<Long> authorIds = resolveUsersFromGithubLogin(authorGithubLogin).stream()
                .map(User::getUserId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, User> recipients = new LinkedHashMap<>();

        for (Project project : projects) {
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
        String link = "https://github.com/" + normalizedRepoFullName + "/pull/" + prNumber;
        Long projectId = projects.stream().map(Project::getId).filter(java.util.Objects::nonNull).findFirst().orElse(null);
        recipients.values().forEach(recipient ->
                notificationService.createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, projectId, com.planora.backend.model.NotificationEventType.GITHUB_ACTIVITY.name(), message, link, prefix));
        broadcastPRUpdate(projects, new GithubPRUpdatePayload(
                "opened", prNumber, safeTitle(prTitle), link, safeLogin(authorGithubLogin)));

        applicationEventPublisher.publishEvent(new PROpenedEvent(
                this,
                normalizedRepoFullName,
                prNumber,
                safeTitle(prTitle),
                safeLogin(authorGithubLogin),
                safeText(branch)));
    }

    public void notifyPRMerged(String repoFullName, int prNumber, String prTitle, String mergerGithubLogin) {
        notifyPRMerged(repoFullName, prNumber, prTitle, mergerGithubLogin, "");
    }

    public void notifyPRMerged(
            String repoFullName,
            int prNumber,
            String prTitle,
            String mergerGithubLogin,
            String branch) {
        ensureDependenciesInjected();
        if (repoFullName == null || repoFullName.isBlank() || prNumber <= 0) {
            return;
        }

        String normalizedRepoFullName = repoFullName.trim();
        List<Project> projects = projectRepository.findByGithubRepoFullNameIgnoreCase(normalizedRepoFullName);
        Set<Long> mergerIds = resolveUsersFromGithubLogin(mergerGithubLogin).stream()
                .map(User::getUserId)
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, User> recipients = new LinkedHashMap<>();

        for (Project project : projects) {
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
        Long projectId = projects.stream().map(Project::getId).filter(java.util.Objects::nonNull).findFirst().orElse(null);
        recipients.values().forEach(recipient ->
                notificationService.createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, projectId, com.planora.backend.model.NotificationEventType.GITHUB_ACTIVITY.name(), message, link, prefix));
        broadcastPRUpdate(projects, new GithubPRUpdatePayload(
                "merged", prNumber, safeTitle(prTitle), link, safeLogin(mergerGithubLogin)));

        applicationEventPublisher.publishEvent(
                new PRMergedEvent(this, normalizedRepoFullName, prNumber, safeTitle(prTitle), safeText(branch)));
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
        Long projectId = projectRepository.findByGithubRepoFullNameIgnoreCase(normalizedRepoFullName).stream()
            .map(Project::getId)
            .filter(java.util.Objects::nonNull)
            .findFirst()
            .orElse(null);
        reviewers.forEach(reviewer -> notificationService.createNotification(
            reviewer,
            projectId,
            com.planora.backend.model.NotificationEventType.GITHUB_ACTIVITY.name(),
            message,
            link));
    }

    public void notifyCIFailed(String repoFullName, String branch, String commitSha, String workflowName) {
        ensureDependenciesInjected();
        if (repoFullName == null || repoFullName.isBlank()
                || commitSha == null || commitSha.isBlank()) {
            return;
        }

        String normalizedRepoFullName = repoFullName.trim();
        String normalizedCommitSha = commitSha.trim();
        List<Project> projects = projectRepository.findByGithubRepoFullNameIgnoreCase(normalizedRepoFullName);
        Map<Long, User> recipients = new LinkedHashMap<>();

        for (Project project : projects) {
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
        Long projectId = projects.stream().map(Project::getId).filter(java.util.Objects::nonNull).findFirst().orElse(null);
        recipients.values().forEach(recipient ->
                notificationService.createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, projectId, com.planora.backend.model.NotificationEventType.GITHUB_ACTIVITY.name(), message, link, prefix));
        broadcastCIUpdate(projects, new GithubCIUpdatePayload(
                safeText(workflowName), safeText(branch), "failure", normalizedCommitSha));

        applicationEventPublisher.publishEvent(new CIFailedEvent(
                this, normalizedRepoFullName, safeText(branch), normalizedCommitSha, safeText(workflowName)));
    }

    public void notifyIssueEvent(
            String repoFullName,
            int issueNumber,
            String issueTitle,
            String action,
            String actorGithubLogin) {
        notifyIssueEvent(repoFullName, issueNumber, issueTitle, action, actorGithubLogin, "", List.of(), "", "");
    }

    public void notifyIssueEvent(
            String repoFullName,
            int issueNumber,
            String issueTitle,
            String action,
            String actorGithubLogin,
            String issueBody,
            List<String> labels) {
        notifyIssueEvent(repoFullName, issueNumber, issueTitle, action, actorGithubLogin, issueBody, labels, "", "");
    }

    public void notifyIssueEvent(
            String repoFullName,
            int issueNumber,
            String issueTitle,
            String action,
            String actorGithubLogin,
            String issueBody,
            List<String> labels,
            String labelName,
            String labelColor) {
        ensureDependenciesInjected();
        if (repoFullName == null || repoFullName.isBlank() || issueNumber <= 0 || action == null) {
            return;
        }
        if (!Set.of("opened", "closed", "labeled", "assigned").contains(action)) {
            return;
        }

        String normalizedRepoFullName = repoFullName.trim();
        String link = "https://github.com/" + normalizedRepoFullName + "/issues/" + issueNumber;
        List<Project> projects = projectRepository.findByGithubRepoFullNameIgnoreCase(normalizedRepoFullName);
        GithubIssueUpdatePayload updatePayload = new GithubIssueUpdatePayload(
                action, issueNumber, safeTitle(issueTitle), safeLogin(actorGithubLogin));
        Long projectId = projects.stream().map(Project::getId).filter(java.util.Objects::nonNull).findFirst().orElse(null);

        switch (action) {
            case "opened" -> {
                Set<Long> authorIds = resolveUsersFromGithubLogin(actorGithubLogin).stream()
                        .map(User::getUserId)
                        .filter(java.util.Objects::nonNull)
                        .collect(Collectors.toSet());
                Map<Long, User> recipients = projectMemberRecipients(projects);
                authorIds.forEach(recipients::remove);

                String prefix = "\uD83D\uDC1B Issue opened: #" + issueNumber + " ";
                String message = prefix + safeTitle(issueTitle) + " by @" + safeLogin(actorGithubLogin);
                recipients.values().forEach(recipient ->
                        notificationService.createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                        recipient, projectId, com.planora.backend.model.NotificationEventType.GITHUB_ACTIVITY.name(), message, link, prefix));
                applicationEventPublisher.publishEvent(new IssueOpenedEvent(
                        this,
                        normalizedRepoFullName,
                        issueNumber,
                        safeTitle(issueTitle),
                        safeText(issueBody),
                        safeLogin(actorGithubLogin),
                        labels));
            }
            case "closed" -> {
                String prefix = "\u2705 Issue closed: #" + issueNumber + " ";
                String message = prefix + safeTitle(issueTitle);
                projectMemberRecipients(projects).values().forEach(recipient ->
                        notificationService.createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                        recipient, projectId, com.planora.backend.model.NotificationEventType.GITHUB_ACTIVITY.name(), message, link, prefix));
            }
            case "labeled" -> {
                Map<Long, User> recipients = new LinkedHashMap<>();
                for (Project project : projects) {
                    if (project.getId() == null) {
                        continue;
                    }
                    for (Task task : taskRepository.findByProjectIdAndGithubIssueNumber(
                            project.getId(), (long) issueNumber)) {
                        TeamMember assignee = task.getAssignee();
                        User user = assignee == null ? null : assignee.getUser();
                        if (user != null && user.getUserId() != null) {
                            recipients.putIfAbsent(user.getUserId(), user);
                        }
                    }
                }

                String message = "\uD83C\uDFF7 Issue #" + issueNumber + " labeled in GitHub";
                recipients.values().forEach(recipient ->
                    notificationService.createNotification(recipient, projectId, com.planora.backend.model.NotificationEventType.GITHUB_ACTIVITY.name(), message, link));
                applicationEventPublisher.publishEvent(new IssueLabeledEvent(
                        this,
                        normalizedRepoFullName,
                        issueNumber,
                        safeTitle(issueTitle),
                        safeText(labelName),
                        safeText(labelColor)));
            }
            case "assigned" -> {
                String message = "\uD83D\uDCCB You were assigned to issue #" + issueNumber + ": "
                        + safeTitle(issueTitle);
                resolveUsersFromGithubLogin(actorGithubLogin).forEach(recipient ->
                    notificationService.createNotification(recipient, projectId, com.planora.backend.model.NotificationEventType.GITHUB_ACTIVITY.name(), message, link));
            }
            default -> {
                // Ignore issue actions that do not produce Planora notifications.
            }
        }
        broadcastIssueUpdate(projects, updatePayload);
    }

    public void notifyRelease(String repoFullName, String tagName, String releaseName, String releaseUrl) {
        ensureDependenciesInjected();
        if (repoFullName == null || repoFullName.isBlank()
                || releaseUrl == null || releaseUrl.isBlank()) {
            return;
        }

        String normalizedRepoFullName = repoFullName.trim();
        String normalizedReleaseUrl = releaseUrl.trim();
        String prefix = "\uD83D\uDE80 Release published: " + safeText(releaseName) + " (";
        String message = prefix + safeText(tagName) + ") in " + normalizedRepoFullName;
        List<Project> projects = projectRepository.findByGithubRepoFullNameIgnoreCase(normalizedRepoFullName);
        Long projectId = projects.stream().map(Project::getId).filter(java.util.Objects::nonNull).findFirst().orElse(null);
        projectMemberRecipients(projects).values().forEach(recipient ->
                notificationService.createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, projectId, com.planora.backend.model.NotificationEventType.GITHUB_ACTIVITY.name(), message, normalizedReleaseUrl, prefix));

        applicationEventPublisher.publishEvent(new ReleasePublishedEvent(
                this, normalizedRepoFullName, safeText(tagName), safeText(releaseName), normalizedReleaseUrl));
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

    private Map<Long, User> projectMemberRecipients(List<Project> projects) {
        Map<Long, User> recipients = new LinkedHashMap<>();
        for (Project project : projects) {
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
        return recipients;
    }

    private void broadcastPRUpdate(List<Project> projects, GithubPRUpdatePayload payload) {
        for (Project project : projects) {
            if (project.getId() != null) {
                githubEventBroadcaster.broadcastPRUpdate(project.getId(), payload);
            }
        }
    }

    private void broadcastCIUpdate(List<Project> projects, GithubCIUpdatePayload payload) {
        for (Project project : projects) {
            if (project.getId() != null) {
                githubEventBroadcaster.broadcastCIUpdate(project.getId(), payload);
            }
        }
    }

    private void broadcastIssueUpdate(List<Project> projects, GithubIssueUpdatePayload payload) {
        for (Project project : projects) {
            if (project.getId() != null) {
                githubEventBroadcaster.broadcastIssueUpdate(project.getId(), payload);
            }
        }
    }
}

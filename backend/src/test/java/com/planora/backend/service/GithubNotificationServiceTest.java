package com.planora.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

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
import com.planora.backend.model.Team;
import com.planora.backend.model.TeamMember;
import com.planora.backend.model.User;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.TaskRepository;
import com.planora.backend.repository.TeamMemberRepository;
import com.planora.backend.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class GithubNotificationServiceTest {

    @Mock
    private NotificationService notificationService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private ApplicationEventPublisher applicationEventPublisher;

    @Mock
    private GithubEventBroadcaster githubEventBroadcaster;

    @InjectMocks
    private GithubNotificationService githubNotificationService;

    private User author;
    private User recipient;
    private Project firstProject;
    private Project secondProject;

    @BeforeEach
    void setUp() {
        author = user(1L, "author");
        recipient = user(2L, "reviewer");

        Team firstTeam = new Team();
        firstTeam.setId(11L);
        Team secondTeam = new Team();
        secondTeam.setId(12L);

        firstProject = new Project();
        firstProject.setId(41L);
        firstProject.setTeam(firstTeam);
        secondProject = new Project();
        secondProject.setId(42L);
        secondProject.setTeam(secondTeam);
    }

    @Test
    void notifyPROpened_notifiesMembersExceptAuthorAndDeduplicatesAcrossProjects() {
        when(userRepository.findByGithubUsernameIgnoreCase("octocat")).thenReturn(List.of(author));
        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(firstProject, secondProject));
        when(teamMemberRepository.findByTeamId(11L)).thenReturn(List.of(member(author), member(recipient)));
        when(teamMemberRepository.findByTeamId(12L)).thenReturn(List.of(member(recipient)));

        githubNotificationService.notifyPROpened(
                "planora/app", 17, "Improve sync", "octocat", "feature/planora-123-review");

        String message = "\uD83D\uDD00 PR opened: #17 Improve sync by @octocat";
        String link = "https://github.com/planora/app/pull/17";
        String prefix = "\uD83D\uDD00 PR opened: #17 ";
        verify(notificationService).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, message, link, prefix);
        verify(notificationService, never()).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                author, message, link, prefix);
        GithubPRUpdatePayload updatePayload = new GithubPRUpdatePayload(
                "opened", 17, "Improve sync", link, "octocat");
        verify(githubEventBroadcaster).broadcastPRUpdate(41L, updatePayload);
        verify(githubEventBroadcaster).broadcastPRUpdate(42L, updatePayload);

        ArgumentCaptor<PROpenedEvent> eventCaptor = ArgumentCaptor.forClass(PROpenedEvent.class);
        verify(applicationEventPublisher).publishEvent(eventCaptor.capture());
        PROpenedEvent event = eventCaptor.getValue();
        assertSame(githubNotificationService, event.getSource());
        assertEquals("planora/app", event.getRepoFullName());
        assertEquals(17, event.getPrNumber());
        assertEquals("Improve sync", event.getPrTitle());
        assertEquals("octocat", event.getAuthorLogin());
        assertEquals("feature/planora-123-review", event.getBranch());
    }

    @Test
    void notifyPROpened_ignoresInvalidRepositoryInput() {
        githubNotificationService.notifyPROpened(" ", 17, "Improve sync", "octocat", "task/123");

        verify(projectRepository, never()).findByGithubRepoFullNameIgnoreCase(org.mockito.ArgumentMatchers.anyString());
        verify(notificationService, never()).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
        verify(applicationEventPublisher, never()).publishEvent(any());
    }

    @Test
    void notifyPRMerged_notifiesMembersExceptMergerAndPublishesEvent() {
        when(userRepository.findByGithubUsernameIgnoreCase("maintainer")).thenReturn(List.of(author));
        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(firstProject, secondProject));
        when(teamMemberRepository.findByTeamId(11L)).thenReturn(List.of(member(author), member(recipient)));
        when(teamMemberRepository.findByTeamId(12L)).thenReturn(List.of(member(recipient)));

        githubNotificationService.notifyPRMerged(" planora/app ", 17, "Improve sync", "maintainer");

        String message = "\u2705 PR merged: #17 Improve sync by @maintainer";
        String link = "https://github.com/planora/app/pull/17";
        String prefix = "\u2705 PR merged: #17 ";
        verify(notificationService).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, message, link, prefix);
        verify(notificationService, never()).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                author, message, link, prefix);
        GithubPRUpdatePayload updatePayload = new GithubPRUpdatePayload(
                "merged", 17, "Improve sync", link, "maintainer");
        verify(githubEventBroadcaster).broadcastPRUpdate(41L, updatePayload);
        verify(githubEventBroadcaster).broadcastPRUpdate(42L, updatePayload);

        ArgumentCaptor<PRMergedEvent> eventCaptor = ArgumentCaptor.forClass(PRMergedEvent.class);
        verify(applicationEventPublisher).publishEvent(eventCaptor.capture());
        PRMergedEvent event = eventCaptor.getValue();
        assertSame(githubNotificationService, event.getSource());
        assertEquals("planora/app", event.getRepoFullName());
        assertEquals(17, event.getPrNumber());
        assertEquals("Improve sync", event.getPrTitle());
    }

    @Test
    void notifyPRMerged_ignoresInvalidRepositoryInputWithoutPublishingEvent() {
        githubNotificationService.notifyPRMerged(" ", 17, "Improve sync", "maintainer");

        verify(projectRepository, never()).findByGithubRepoFullNameIgnoreCase(any());
        verify(applicationEventPublisher, never()).publishEvent(any());
    }

    @Test
    void notifyReviewRequested_notifiesOnlyUsersMappedToRequestedReviewer() {
        User secondReviewer = user(3L, "second-reviewer");
        when(userRepository.findByGithubUsernameIgnoreCase("requested-reviewer"))
                .thenReturn(List.of(recipient, secondReviewer));

        githubNotificationService.notifyReviewRequested(
                " planora/app ", 17, "Improve sync", "requested-reviewer");

        String message = "\uD83D\uDC41 Review requested: #17 Improve sync in planora/app";
        String link = "https://github.com/planora/app/pull/17";
        verify(notificationService).createNotification(recipient, message, link);
        verify(notificationService).createNotification(secondReviewer, message, link);
        verify(projectRepository, never()).findByGithubRepoFullNameIgnoreCase(any());
        verify(teamMemberRepository, never()).findByTeamId(any());
    }

    @Test
    void notifyReviewRequested_skipsNotificationWhenReviewerIsNotMapped() {
        when(userRepository.findByGithubUsernameIgnoreCase("unknown-reviewer")).thenReturn(List.of());

        githubNotificationService.notifyReviewRequested(
                "planora/app", 17, "Improve sync", "unknown-reviewer");

        verify(notificationService, never()).createNotification(any(), any(), any());
        verify(projectRepository, never()).findByGithubRepoFullNameIgnoreCase(any());
        verify(teamMemberRepository, never()).findByTeamId(any());
    }

    @Test
    void notifyCIFailed_notifiesProjectMembersAndPublishesEvent() {
        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(firstProject, secondProject));
        when(teamMemberRepository.findByTeamId(11L)).thenReturn(List.of(member(author), member(recipient)));
        when(teamMemberRepository.findByTeamId(12L)).thenReturn(List.of(member(recipient)));

        githubNotificationService.notifyCIFailed(
                " planora/app ", "main", "abcdef1234567890", "Backend checks");

        String message = "\u274C CI failed: Backend checks on main (abcdef1)";
        String link = "https://github.com/planora/app/commit/abcdef1234567890/checks";
        String prefix = "\u274C CI failed: Backend checks on ";
        verify(notificationService).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                author, message, link, prefix);
        verify(notificationService).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, message, link, prefix);
        GithubCIUpdatePayload updatePayload = new GithubCIUpdatePayload(
                "Backend checks", "main", "failure", "abcdef1234567890");
        verify(githubEventBroadcaster).broadcastCIUpdate(41L, updatePayload);
        verify(githubEventBroadcaster).broadcastCIUpdate(42L, updatePayload);

        ArgumentCaptor<CIFailedEvent> eventCaptor = ArgumentCaptor.forClass(CIFailedEvent.class);
        verify(applicationEventPublisher).publishEvent(eventCaptor.capture());
        CIFailedEvent event = eventCaptor.getValue();
        assertSame(githubNotificationService, event.getSource());
        assertEquals("planora/app", event.getRepoFullName());
        assertEquals("main", event.getBranch());
        assertEquals("abcdef1234567890", event.getCommitSha());
        assertEquals("Backend checks", event.getWorkflowName());
    }

    @Test
    void notifyCIFailed_ignoresMissingCommitWithoutPublishingEvent() {
        githubNotificationService.notifyCIFailed("planora/app", "main", " ", "Backend checks");

        verify(projectRepository, never()).findByGithubRepoFullNameIgnoreCase(any());
        verify(applicationEventPublisher, never()).publishEvent(any());
    }

    @Test
    void notifyIssueEvent_openedNotifiesMembersExceptAuthorAndPublishesEvent() {
        when(userRepository.findByGithubUsernameIgnoreCase("octocat")).thenReturn(List.of(author));
        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(firstProject, secondProject));
        when(teamMemberRepository.findByTeamId(11L)).thenReturn(List.of(member(author), member(recipient)));
        when(teamMemberRepository.findByTeamId(12L)).thenReturn(List.of(member(recipient)));

        githubNotificationService.notifyIssueEvent(
                "planora/app",
                34,
                "Broken sync",
                "opened",
                "octocat",
                "Build fails on main",
                List.of("bug", "backend"));

        String message = "\uD83D\uDC1B Issue opened: #34 Broken sync by @octocat";
        String link = "https://github.com/planora/app/issues/34";
        String prefix = "\uD83D\uDC1B Issue opened: #34 ";
        verify(notificationService).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, message, link, prefix);
        verify(notificationService, never()).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                author, message, link, prefix);
        GithubIssueUpdatePayload updatePayload = new GithubIssueUpdatePayload(
                "opened", 34, "Broken sync", "octocat");
        verify(githubEventBroadcaster).broadcastIssueUpdate(41L, updatePayload);
        verify(githubEventBroadcaster).broadcastIssueUpdate(42L, updatePayload);

        ArgumentCaptor<IssueOpenedEvent> eventCaptor = ArgumentCaptor.forClass(IssueOpenedEvent.class);
        verify(applicationEventPublisher).publishEvent(eventCaptor.capture());
        assertEquals("planora/app", eventCaptor.getValue().getRepoFullName());
        assertEquals(34, eventCaptor.getValue().getIssueNumber());
        assertEquals("Broken sync", eventCaptor.getValue().getIssueTitle());
        assertEquals("Build fails on main", eventCaptor.getValue().getIssueBody());
        assertEquals("octocat", eventCaptor.getValue().getAuthorLogin());
        assertEquals(List.of("bug", "backend"), eventCaptor.getValue().getLabels());
    }

    @Test
    void notifyIssueEvent_closedNotifiesAllProjectMembers() {
        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(firstProject));
        when(teamMemberRepository.findByTeamId(11L)).thenReturn(List.of(member(author), member(recipient)));

        githubNotificationService.notifyIssueEvent("planora/app", 34, "Broken sync", "closed", "octocat");

        String message = "\u2705 Issue closed: #34 Broken sync";
        String link = "https://github.com/planora/app/issues/34";
        String prefix = "\u2705 Issue closed: #34 ";
        verify(notificationService).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                author, message, link, prefix);
        verify(notificationService).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, message, link, prefix);
    }

    @Test
    void notifyIssueEvent_labeledNotifiesImportedTaskAssigneeAndPublishesEvent() {
        Task importedTask = new Task();
        importedTask.setAssignee(member(recipient));
        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(firstProject));
        when(taskRepository.findByProjectIdAndGithubIssueNumber(41L, 34L))
                .thenReturn(List.of(importedTask));

        githubNotificationService.notifyIssueEvent(
                "planora/app",
                34,
                "Broken sync",
                "labeled",
                "octocat",
                "",
                List.of("ready-for-review"),
                "ready-for-review",
                "5319e7");

        verify(notificationService).createNotification(
                recipient,
                "\uD83C\uDFF7 Issue #34 labeled in GitHub",
                "https://github.com/planora/app/issues/34");
        ArgumentCaptor<IssueLabeledEvent> eventCaptor = ArgumentCaptor.forClass(IssueLabeledEvent.class);
        verify(applicationEventPublisher).publishEvent(eventCaptor.capture());
        assertEquals("planora/app", eventCaptor.getValue().getRepoFullName());
        assertEquals(34, eventCaptor.getValue().getIssueNumber());
        assertEquals("Broken sync", eventCaptor.getValue().getIssueTitle());
        assertEquals("ready-for-review", eventCaptor.getValue().getLabelName());
        assertEquals("5319e7", eventCaptor.getValue().getLabelColor());
    }

    @Test
    void notifyIssueEvent_assignedTargetsMappedGithubAssigneeOnly() {
        when(userRepository.findByGithubUsernameIgnoreCase("assigned-user")).thenReturn(List.of(recipient));
        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(firstProject));

        githubNotificationService.notifyIssueEvent(
                "planora/app", 34, "Broken sync", "assigned", "assigned-user");

        verify(notificationService).createNotification(
                recipient,
                "\uD83D\uDCCB You were assigned to issue #34: Broken sync",
                "https://github.com/planora/app/issues/34");
        verify(teamMemberRepository, never()).findByTeamId(any());
        verify(githubEventBroadcaster).broadcastIssueUpdate(eq(41L), eq(new GithubIssueUpdatePayload(
                "assigned", 34, "Broken sync", "assigned-user")));
    }

    @Test
    void notifyRelease_notifiesAllProjectMembersAndPublishesEvent() {
        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(firstProject, secondProject));
        when(teamMemberRepository.findByTeamId(11L)).thenReturn(List.of(member(author), member(recipient)));
        when(teamMemberRepository.findByTeamId(12L)).thenReturn(List.of(member(recipient)));

        githubNotificationService.notifyRelease(
                " planora/app ", "v2.0.0", "Planora 2.0", " https://github.com/planora/app/releases/tag/v2.0.0 ");

        String message = "\uD83D\uDE80 Release published: Planora 2.0 (v2.0.0) in planora/app";
        String link = "https://github.com/planora/app/releases/tag/v2.0.0";
        String prefix = "\uD83D\uDE80 Release published: Planora 2.0 (";
        verify(notificationService).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                author, message, link, prefix);
        verify(notificationService).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, message, link, prefix);

        ArgumentCaptor<ReleasePublishedEvent> eventCaptor = ArgumentCaptor.forClass(ReleasePublishedEvent.class);
        verify(applicationEventPublisher).publishEvent(eventCaptor.capture());
        ReleasePublishedEvent event = eventCaptor.getValue();
        assertEquals("planora/app", event.getRepoFullName());
        assertEquals("v2.0.0", event.getTagName());
        assertEquals("Planora 2.0", event.getReleaseName());
        assertEquals(link, event.getReleaseUrl());
    }

    @Test
    void notifyRelease_ignoresMissingReleaseUrlWithoutPublishingEvent() {
        githubNotificationService.notifyRelease("planora/app", "v2.0.0", "Planora 2.0", " ");

        verify(projectRepository, never()).findByGithubRepoFullNameIgnoreCase(any());
        verify(applicationEventPublisher, never()).publishEvent(any());
    }

    private User user(Long id, String username) {
        User user = new User();
        user.setUserId(id);
        user.setUsername(username);
        return user;
    }

    private TeamMember member(User user) {
        TeamMember member = new TeamMember();
        member.setUser(user);
        return member;
    }
}

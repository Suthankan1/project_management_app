package com.planora.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
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

import com.planora.backend.event.PRMergedEvent;
import com.planora.backend.model.Project;
import com.planora.backend.model.Team;
import com.planora.backend.model.TeamMember;
import com.planora.backend.model.User;
import com.planora.backend.repository.ProjectRepository;
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
    private TeamMemberRepository teamMemberRepository;

    @Mock
    private ApplicationEventPublisher applicationEventPublisher;

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
        firstProject.setTeam(firstTeam);
        secondProject = new Project();
        secondProject.setTeam(secondTeam);
    }

    @Test
    void notifyPROpened_notifiesMembersExceptAuthorAndDeduplicatesAcrossProjects() {
        when(userRepository.findByGithubUsernameIgnoreCase("octocat")).thenReturn(List.of(author));
        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(firstProject, secondProject));
        when(teamMemberRepository.findByTeamId(11L)).thenReturn(List.of(member(author), member(recipient)));
        when(teamMemberRepository.findByTeamId(12L)).thenReturn(List.of(member(recipient)));

        githubNotificationService.notifyPROpened("planora/app", 17, "Improve sync", "octocat");

        String message = "\uD83D\uDD00 PR opened: #17 Improve sync by @octocat";
        String link = "https://github.com/planora/app/pull/17";
        String prefix = "\uD83D\uDD00 PR opened: #17 ";
        verify(notificationService).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                recipient, message, link, prefix);
        verify(notificationService, never()).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                author, message, link, prefix);
    }

    @Test
    void notifyPROpened_ignoresInvalidRepositoryInput() {
        githubNotificationService.notifyPROpened(" ", 17, "Improve sync", "octocat");

        verify(projectRepository, never()).findByGithubRepoFullNameIgnoreCase(org.mockito.ArgumentMatchers.anyString());
        verify(notificationService, never()).createNotificationIfNotDuplicateByLinkAndMessagePrefix(
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.anyString());
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

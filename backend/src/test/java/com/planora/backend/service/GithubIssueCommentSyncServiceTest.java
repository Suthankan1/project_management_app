package com.planora.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.planora.backend.dto.GithubCommentDTO;
import com.planora.backend.dto.GithubCommentSyncResponseDTO;
import com.planora.backend.exception.ConflictException;
import com.planora.backend.exception.ForbiddenException;
import com.planora.backend.model.Comment;
import com.planora.backend.model.Project;
import com.planora.backend.model.Task;
import com.planora.backend.model.Team;
import com.planora.backend.model.TeamMember;
import com.planora.backend.model.User;
import com.planora.backend.repository.CommentRepository;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.TaskRepository;

@ExtendWith(MockitoExtension.class)
class GithubIssueCommentSyncServiceTest {

    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private TeamMembershipLookupService teamMembershipLookupService;
    @Mock
    private GithubIssuesSyncService githubIssuesSyncService;
    @Mock
    private GithubTokenService githubTokenService;

    @InjectMocks
    private GithubIssueCommentSyncService service;

    private Project project;
    private User user;
    private Task task;

    @BeforeEach
    void setUp() {
        Team team = new Team();
        team.setId(20L);
        project = new Project();
        project.setId(10L);
        project.setTeam(team);

        user = new User();
        user.setUserId(7L);
        user.setGithubAccessToken("github-token");

        task = new Task();
        task.setId(100L);
        task.setProject(project);
        task.setGithubIssueNumber(34L);
        task.setGithubRepoFullName("planora/app");
    }

    @Test
    void syncComments_appendsNewCommentsAndSkipsExistingPrefixedContent() {
        TeamMember member = new TeamMember();
        Comment existing = new Comment();
        existing.setContent("**[@octocat on GitHub]** Already here");

        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(teamMembershipLookupService.getTeamMember(20L, 7L)).thenReturn(member);
        when(taskRepository.findByProjectIdAndGithubIssueNumber(10L, 34L)).thenReturn(List.of(task));
        when(commentRepository.findByTaskOrderByCreatedAtAsc(task)).thenReturn(List.of(existing));
        when(githubTokenService.getToken(7L)).thenReturn("github-token");
        when(githubIssuesSyncService.fetchIssueComments("planora/app", 34, "github-token"))
                .thenReturn(List.of(comment("octocat", "Already here", null),
                        comment("hubot", "New note", Instant.parse("2026-05-24T10:15:30Z"))));

        GithubCommentSyncResponseDTO result = service.syncComments(10L, 34, user);

        assertEquals(1, result.getSynced());
        ArgumentCaptor<Comment> saved = ArgumentCaptor.forClass(Comment.class);
        verify(commentRepository).save(saved.capture());
        assertEquals("**[@hubot on GitHub]** New note", saved.getValue().getContent());
        assertEquals(user, saved.getValue().getAuthor());
        assertEquals(task, saved.getValue().getTask());
        assertEquals(LocalDateTime.parse("2026-05-24T10:15:30"), saved.getValue().getCreatedAt());
        verify(taskRepository).save(task);
    }

    @Test
    void syncComments_rejectsUsersOutsideProjectTeamBeforeFetchingGithub() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(teamMembershipLookupService.getTeamMember(20L, 7L)).thenReturn(null);

        assertThrows(ForbiddenException.class, () -> service.syncComments(10L, 34, user));
        verify(githubIssuesSyncService, never()).fetchIssueComments(any(), anyInt(), any());
    }

    @Test
    void syncComments_rejectsAmbiguousImportedIssueNumbers() {
        TeamMember member = new TeamMember();
        Task otherTask = new Task();
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(teamMembershipLookupService.getTeamMember(20L, 7L)).thenReturn(member);
        when(githubTokenService.getToken(7L)).thenReturn("github-token");
        when(taskRepository.findByProjectIdAndGithubIssueNumber(10L, 34L))
                .thenReturn(List.of(task, otherTask));

        assertThrows(ConflictException.class, () -> service.syncComments(10L, 34, user));
        verify(githubIssuesSyncService, never()).fetchIssueComments(any(), anyInt(), any());
    }

    private GithubCommentDTO comment(String login, String body, Instant createdAt) {
        GithubCommentDTO comment = new GithubCommentDTO();
        comment.setUserLogin(login);
        comment.setBody(body);
        comment.setCreatedAt(createdAt);
        return comment;
    }
}

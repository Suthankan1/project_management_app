package com.planora.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.dto.GithubIssueImportRequestDTO;
import com.planora.backend.dto.GithubIssueImportResponseDTO;
import com.planora.backend.dto.GithubLabelDTO;
import com.planora.backend.exception.ForbiddenException;
import com.planora.backend.model.Project;
import com.planora.backend.model.Task;
import com.planora.backend.model.Team;
import com.planora.backend.model.TeamMember;
import com.planora.backend.model.User;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.TaskRepository;

@ExtendWith(MockitoExtension.class)
class GithubIssueImportServiceTest {

    @Mock
    private GithubIssuesSyncService githubIssuesSyncService;
    @Mock
    private ProjectRepository projectRepository;
    @Mock
    private TaskRepository taskRepository;
    @Mock
    private TeamMembershipLookupService teamMembershipLookupService;
    @Mock
    private GithubIssueConversionService githubIssueConversionService;

    @InjectMocks
    private GithubIssueImportService service;

    private Project project;
    private User user;
    private TeamMember member;
    private GithubIssueImportRequestDTO request;

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
        member = new TeamMember();
        member.setUser(user);
        member.setTeam(team);

        request = new GithubIssueImportRequestDTO();
        request.setProjectId(10L);
        request.setRepoFullName("planora/app");
        request.setIssueNumbers(List.of(1, 2, 3));
    }

    @Test
    void importIssues_convertsAndSavesRequestedIssuesAndSkipsImportedIssues() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(teamMembershipLookupService.getTeamMember(20L, 7L)).thenReturn(member);
        when(githubIssuesSyncService.syncIssues("planora/app", "github-token"))
                .thenReturn(List.of(issue(1, "open", "First", "body one", "bug", "d73a4a"),
                        issue(2, "closed", "Second", "body two", null, null)));
        when(githubIssueConversionService.isAlreadyImported(1L, "planora/app", 10L)).thenReturn(false);
        when(githubIssueConversionService.isAlreadyImported(2L, "planora/app", 10L)).thenReturn(false);
        when(githubIssueConversionService.isAlreadyImported(3L, "planora/app", 10L)).thenReturn(true);
        when(taskRepository.findMaxProjectTaskNumberByProjectId(10L)).thenReturn(40L);
        when(taskRepository.findMaxBacklogPositionByProjectId(10L)).thenReturn(4);
        when(githubIssueConversionService.convertIssueToTask(any(GithubIssueDTO.class), org.mockito.Mockito.eq(project)))
                .thenAnswer(invocation -> {
                    GithubIssueDTO issue = invocation.getArgument(0);
                    Task task = new Task();
                    task.setGithubIssueNumber(issue.getNumber().longValue());
                    return task;
                });
        when(taskRepository.save(any(Task.class))).thenAnswer(invocation -> {
            Task task = invocation.getArgument(0);
            task.setId(task.getGithubIssueNumber() + 100);
            return task;
        });

        GithubIssueImportResponseDTO result = service.importIssues(request, user);

        assertEquals(List.of(101L, 102L), result.getImported());
        assertEquals(List.of(3), result.getSkipped());

        ArgumentCaptor<Task> tasks = ArgumentCaptor.forClass(Task.class);
        verify(taskRepository, org.mockito.Mockito.times(2)).save(tasks.capture());
        Task open = tasks.getAllValues().get(0);
        assertEquals(1L, open.getGithubIssueNumber());
        assertEquals(41L, open.getProjectTaskNumber());
        assertEquals(5, open.getBacklogPosition());
        assertEquals(member, open.getReporter());
        assertEquals(user, open.getLastModifiedBy());

        Task closed = tasks.getAllValues().get(1);
        assertEquals(42L, closed.getProjectTaskNumber());
        verify(githubIssueConversionService, org.mockito.Mockito.times(2))
                .convertIssueToTask(any(GithubIssueDTO.class), org.mockito.Mockito.eq(project));
    }

    @Test
    void importIssues_rejectsNonMemberBeforeSyncing() {
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(teamMembershipLookupService.getTeamMember(20L, 7L)).thenReturn(null);

        assertThrows(ForbiddenException.class, () -> service.importIssues(request, user));
        verify(githubIssuesSyncService, never()).syncIssues(any(), any());
    }

    @Test
    void importIssues_usesRequestTokenForBrowserOauthConnections() {
        user.setGithubAccessToken(null);
        request.setIssueNumbers(List.of());
        when(projectRepository.findById(10L)).thenReturn(Optional.of(project));
        when(teamMembershipLookupService.getTeamMember(20L, 7L)).thenReturn(member);
        when(githubIssuesSyncService.syncIssues("planora/app", "browser-token"))
                .thenReturn(List.of());

        service.importIssues(request, user, "browser-token");

        verify(githubIssuesSyncService).syncIssues("planora/app", "browser-token");
    }

    private GithubIssueDTO issue(
            Integer number,
            String state,
            String title,
            String body,
            String label,
            String color
    ) {
        GithubIssueDTO issue = new GithubIssueDTO();
        issue.setNumber(number);
        issue.setState(state);
        issue.setTitle(title);
        issue.setBody(body);
        if (label != null) {
            issue.setLabels(List.of(new GithubLabelDTO(label, color)));
        }
        return issue;
    }
}

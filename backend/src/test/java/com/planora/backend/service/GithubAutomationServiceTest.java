package com.planora.backend.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import com.planora.backend.dto.GithubAutomationRuleRequestDTO;
import com.planora.backend.dto.GithubAutomationRuleResponseDTO;
import com.planora.backend.event.CIFailedEvent;
import com.planora.backend.event.IssueOpenedEvent;
import com.planora.backend.event.PRMergedEvent;
import com.planora.backend.event.PROpenedEvent;
import com.planora.backend.model.GithubAction;
import com.planora.backend.model.GithubAutomationRule;
import com.planora.backend.model.GithubTrigger;
import com.planora.backend.model.KanbanColumn;
import com.planora.backend.model.Project;
import com.planora.backend.model.Task;
import com.planora.backend.repository.GithubAutomationRuleRepository;
import com.planora.backend.repository.KanbanColumnRepository;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.TaskRepository;

@ExtendWith({MockitoExtension.class, OutputCaptureExtension.class})
class GithubAutomationServiceTest {

    @Mock
    private TaskService taskService;

    @Mock
    private KanbanColumnRepository kanbanColumnRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private GithubAutomationRuleRepository ruleRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private GithubIssueConversionService githubIssueConversionService;

    private GithubAutomationService automationService;

    @BeforeEach
    void setUp() {
        automationService = new GithubAutomationService(
                taskService,
                kanbanColumnRepository,
                notificationService,
                projectRepository,
                ruleRepository,
                taskRepository,
                githubIssueConversionService);
    }

    @Test
    void prMergedEventFindsMatchingRulesForConnectedProjects() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                1L,
                project,
                GithubTrigger.PR_MERGED,
                GithubAction.SEND_NOTIFICATION,
                Map.of());

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.PR_MERGED))
                .thenReturn(List.of(rule));

        automationService.onPRMerged(new PRMergedEvent(this, "planora/app", 17, "Improve sync"));

        verify(ruleRepository).findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.PR_MERGED);
    }

    @Test
    void doesNotQueryRulesWhenNoProjectsAreConnectedToRepo() {
        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of());

        automationService.executeRulesForTrigger(
                GithubTrigger.CI_FAILED,
                Map.of("repoFullName", "planora/app"));

        verifyNoInteractions(ruleRepository);
    }

    @Test
    void createRulePersistsRuleForRequestedProject() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRuleRequestDTO request = new GithubAutomationRuleRequestDTO();
        request.setTrigger(GithubTrigger.ISSUE_OPENED);
        request.setAction(GithubAction.CREATE_TASK);
        request.setConfig(Map.of("column", "To Do"));

        when(projectRepository.findById(41L)).thenReturn(Optional.of(project));
        when(ruleRepository.save(any(GithubAutomationRule.class))).thenAnswer(invocation -> {
            GithubAutomationRule rule = invocation.getArgument(0);
            rule.setId(9L);
            return rule;
        });

        GithubAutomationRuleResponseDTO response = automationService.createRule(41L, request);

        assertEquals(9L, response.getId());
        assertEquals(41L, response.getProjectId());
        assertEquals(GithubTrigger.ISSUE_OPENED, response.getTrigger());
        assertEquals("To Do", response.getConfig().get("column"));
    }

    @Test
    void deleteRuleOnlyDeletesRuleWithinRequestedProject() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule();
        rule.setId(9L);
        rule.setProject(project);

        when(projectRepository.findById(41L)).thenReturn(Optional.of(project));
        when(ruleRepository.findByIdAndProject_Id(9L, 41L)).thenReturn(Optional.of(rule));

        automationService.deleteRule(41L, 9L);

        verify(ruleRepository).delete(rule);
    }

    @Test
    void prOpenedMovesReferencedProjectTaskToConfiguredColumn() {
        Project project = new Project();
        project.setId(41L);
        project.setProjectKey("PLN");
        GithubAutomationRule rule = new GithubAutomationRule(
                1L,
                project,
                GithubTrigger.PR_OPENED,
                GithubAction.MOVE_TASK_TO_COLUMN,
                Map.of("columnName", "In Review"));
        Task task = new Task();
        task.setProjectTaskNumber(123L);
        KanbanColumn column = new KanbanColumn();
        column.setName("In Review");
        column.setStatus("IN_REVIEW");

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.PR_OPENED))
                .thenReturn(List.of(rule));
        when(taskRepository.findByProjectIdAndProjectTaskNumber(41L, 123L))
                .thenReturn(Optional.of(task));
        when(kanbanColumnRepository.findFirstByKanban_ProjectIdAndNameIgnoreCase(41L, "In Review"))
                .thenReturn(Optional.of(column));

        automationService.onPROpened(new PROpenedEvent(
                this,
                "planora/app",
                17,
                "Improve sync",
                "octocat",
                "feature-planora-123-review"));

        assertEquals(column, task.getKanbanColumn());
        assertEquals("IN_REVIEW", task.getStatus());
        verify(taskRepository).save(task);
    }

    @Test
    void prOpenedAcceptsTaskSlashBranchReference() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                1L,
                project,
                GithubTrigger.PR_OPENED,
                GithubAction.MOVE_TASK_TO_COLUMN,
                Map.of("column", "In Review"));
        Task task = new Task();
        task.setProjectTaskNumber(123L);
        KanbanColumn column = new KanbanColumn();
        column.setStatus("IN_REVIEW");

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.PR_OPENED))
                .thenReturn(List.of(rule));
        when(taskRepository.findByProjectIdAndProjectTaskNumber(41L, 123L))
                .thenReturn(Optional.of(task));
        when(kanbanColumnRepository.findFirstByKanban_ProjectIdAndNameIgnoreCase(41L, "In Review"))
                .thenReturn(Optional.of(column));

        automationService.onPROpened(new PROpenedEvent(
                this, "planora/app", 17, "Improve sync", "octocat", "feature/task/123-review"));

        verify(taskRepository).save(task);
    }

    @Test
    void ciFailedCreateTaskRuleLogsRenderedTaskPreviewWithDefaultPriority(CapturedOutput output) {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                8L,
                project,
                GithubTrigger.CI_FAILED,
                GithubAction.CREATE_TASK,
                Map.of(
                        "projectId", "41",
                        "taskTitle", "CI failure: {workflowName} on {branch} ({commitSha})",
                        "labelName", "build-failure"));

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.CI_FAILED))
                .thenReturn(List.of(rule));

        automationService.onCIFailed(new CIFailedEvent(
                this, "planora/app", "main", "abcdef123", "Backend checks"));

        org.junit.jupiter.api.Assertions.assertTrue(output.getOut().contains(
                "title='CI failure: Backend checks on main (abcdef123)'"));
        org.junit.jupiter.api.Assertions.assertTrue(output.getOut().contains("priority='HIGH'"));
        org.junit.jupiter.api.Assertions.assertTrue(output.getOut().contains("label='build-failure'"));
    }

    @Test
    void issueOpenedCreateTaskRuleImportsIssueWhenRequiredLabelMatches() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                12L,
                project,
                GithubTrigger.ISSUE_OPENED,
                GithubAction.CREATE_TASK,
                Map.of("projectId", "41", "onlyIfLabeled", "bug"));
        Task task = new Task();

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.ISSUE_OPENED))
                .thenReturn(List.of(rule));
        when(githubIssueConversionService.isAlreadyImported(34L, "planora/app", 41L)).thenReturn(false);
        when(githubIssueConversionService.convertIssueToTask(any(), org.mockito.Mockito.eq(project)))
                .thenReturn(task);
        when(taskRepository.findMaxProjectTaskNumberByProjectId(41L)).thenReturn(6L);
        when(taskRepository.findMaxBacklogPositionByProjectId(41L)).thenReturn(2);

        automationService.onIssueOpened(new IssueOpenedEvent(
                this,
                "planora/app",
                34,
                "Broken sync",
                "Build fails on main",
                "octocat",
                List.of("bug", "backend")));

        assertEquals(7L, task.getProjectTaskNumber());
        assertEquals(3, task.getBacklogPosition());
        verify(githubIssueConversionService).convertIssueToTask(
                org.mockito.ArgumentMatchers.argThat(issue ->
                        issue.getNumber().equals(34)
                                && issue.getBody().equals("Build fails on main")
                                && issue.getLabels().stream().anyMatch(label -> label.getName().equals("bug"))),
                org.mockito.Mockito.eq(project));
        verify(taskRepository).save(task);
    }

    @Test
    void issueOpenedCreateTaskRuleSkipsIssueWithoutConfiguredLabel() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                12L,
                project,
                GithubTrigger.ISSUE_OPENED,
                GithubAction.CREATE_TASK,
                Map.of("projectId", "41", "onlyIfLabeled", "bug"));

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.ISSUE_OPENED))
                .thenReturn(List.of(rule));

        automationService.onIssueOpened(new IssueOpenedEvent(
                this, "planora/app", 34, "Broken sync", "", "octocat", List.of("feature")));

        verifyNoInteractions(githubIssueConversionService);
        org.mockito.Mockito.verify(taskRepository, org.mockito.Mockito.never()).save(any());
    }
}

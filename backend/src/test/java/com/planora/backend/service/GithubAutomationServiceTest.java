package com.planora.backend.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.dto.GithubAutomationRuleRequestDTO;
import com.planora.backend.dto.GithubAutomationRuleResponseDTO;
import com.planora.backend.event.CIFailedEvent;
import com.planora.backend.event.IssueLabeledEvent;
import com.planora.backend.event.IssueOpenedEvent;
import com.planora.backend.event.PRMergedEvent;
import com.planora.backend.event.PROpenedEvent;
import com.planora.backend.event.ReleasePublishedEvent;
import com.planora.backend.model.GithubAction;
import com.planora.backend.model.GithubAutomationRule;
import com.planora.backend.model.GithubTrigger;
import com.planora.backend.model.KanbanColumn;
import com.planora.backend.model.Label;
import com.planora.backend.model.Priority;
import com.planora.backend.model.NotificationEventType;
import com.planora.backend.model.Project;
import com.planora.backend.model.Sprint;
import com.planora.backend.model.SprintStatus;
import com.planora.backend.model.Task;
import com.planora.backend.model.Team;
import com.planora.backend.model.TeamMember;
import com.planora.backend.model.User;
import com.planora.backend.repository.GithubAutomationLogRepository;
import com.planora.backend.repository.GithubAutomationRuleRepository;
import com.planora.backend.repository.KanbanColumnRepository;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.SprintRepository;
import com.planora.backend.repository.TaskRepository;
import com.planora.backend.repository.TeamMemberRepository;

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
    private GithubAutomationLogRepository automationLogRepository;

    @Mock
    private GithubAutomationRuleRepository ruleRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private SprintRepository sprintRepository;

        @Mock
        private TeamMemberRepository teamMemberRepository;

    @Mock
    private GithubIssueConversionService githubIssueConversionService;

    @Mock
    private GithubEventBroadcaster githubEventBroadcaster;

        @Mock
        private LabelService labelService;

    private GithubAutomationService automationService;

    @BeforeEach
    void setUp() {
        automationService = new GithubAutomationService(
                taskService,
                kanbanColumnRepository,
                notificationService,
                projectRepository,
                automationLogRepository,
                ruleRepository,
                taskRepository,
                sprintRepository,
                teamMemberRepository,
                githubIssueConversionService,
                githubEventBroadcaster,
                labelService,
                new ObjectMapper());
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
                true,
                Map.<String, String>of());

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
                true,
                Map.of("columnName", "In Review"));
        Task task = new Task();
        task.setId(99L);
        task.setProjectTaskNumber(123L);
        KanbanColumn column = new KanbanColumn();
        column.setId(7L);
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

        verify(taskService).updateTaskColumn(99L, 7L);
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
                true,
                Map.of("column", "In Review"));
        Task task = new Task();
        task.setId(99L);
        task.setProjectTaskNumber(123L);
        KanbanColumn column = new KanbanColumn();
        column.setId(7L);
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

        verify(taskService).updateTaskColumn(99L, 7L);
    }

    @Test
    void ciFailedCreateTaskRuleCreatesTaskWithDefaultPriorityAndBugLabel(CapturedOutput output) {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                8L,
                project,
                GithubTrigger.CI_FAILED,
                GithubAction.CREATE_TASK,
                true,
                Map.of("projectId", "41"));
        Task task = new Task();
        task.setProject(project);
        Label label = new Label();
        label.setId(12L);
        label.setName("bug");
        label.setColor("#d73a4a");

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(projectRepository.findById(41L)).thenReturn(Optional.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.CI_FAILED))
                .thenReturn(List.of(rule));
        when(taskService.createAutomationTask(
                org.mockito.ArgumentMatchers.eq(project),
                org.mockito.ArgumentMatchers.eq("🔴 CI Failure: Backend checks on main"),
                org.mockito.ArgumentMatchers.argThat(description -> description.contains("[abcdef123](https://github.com/planora/app/commit/abcdef123)")),
                org.mockito.ArgumentMatchers.eq(Priority.HIGH)))
                .thenReturn(task);
        when(labelService.findOrCreate("bug", "#d73a4a", project)).thenReturn(label);
        when(taskRepository.save(task)).thenAnswer(invocation -> {
            Task saved = invocation.getArgument(0);
            saved.setId(77L);
            return saved;
        });

        automationService.onCIFailed(new CIFailedEvent(
                this, "planora/app", "main", "abcdef123", "Backend checks"));

        verify(taskService).createAutomationTask(
                org.mockito.ArgumentMatchers.eq(project),
                org.mockito.ArgumentMatchers.eq("🔴 CI Failure: Backend checks on main"),
                org.mockito.ArgumentMatchers.argThat(description -> description.contains("Workflow: Backend checks")
                        && description.contains("Branch: main")
                        && description.contains("[abcdef123](https://github.com/planora/app/commit/abcdef123)")),
                org.mockito.ArgumentMatchers.eq(Priority.HIGH));
        verify(labelService).findOrCreate("bug", "#d73a4a", project);
        verify(taskRepository).save(task);
        verify(automationLogRepository).save(org.mockito.ArgumentMatchers.argThat(execution ->
                "SUCCESS".equals(execution.getOutcome())
                        && execution.getMessage().contains("created task 77")));
        org.junit.jupiter.api.Assertions.assertTrue(output.getOut().contains("created CI failure task 77"));
    }

    @Test
    void ciFailedDoesNotCreateTaskWithoutMatchingRule() {
        Project project = new Project();
        project.setId(41L);

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(
                org.mockito.ArgumentMatchers.anyList(),
                org.mockito.ArgumentMatchers.eq(GithubTrigger.CI_FAILED)))
                .thenReturn(List.of());

        automationService.executeRulesForTrigger(
                GithubTrigger.CI_FAILED,
                Map.of("repoFullName", "planora/app", "branch", "main", "commitSha", "abcdef123", "workflowName", "Backend checks"));

        verifyNoInteractions(taskService, labelService, taskRepository, automationLogRepository);
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
                true,
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
                true,
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

    @Test
    void issueLabeledMoveRuleMovesTaskLinkedToMatchingRepoIssue() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                13L,
                project,
                GithubTrigger.ISSUE_LABELED,
                GithubAction.MOVE_TASK_TO_COLUMN,
                true,
                Map.of(
                        "projectId", "41",
                        "labelName", "ready-for-review",
                        "targetColumnName", "In Review"));
        Task task = new Task();
        task.setId(99L);
        KanbanColumn targetColumn = new KanbanColumn();
        targetColumn.setId(7L);
        targetColumn.setName("In Review");

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.ISSUE_LABELED))
                .thenReturn(List.of(rule));
        when(kanbanColumnRepository.findFirstByKanban_ProjectIdAndNameIgnoreCase(41L, "In Review"))
                .thenReturn(Optional.of(new KanbanColumn()));
        when(taskRepository.findByProjectIdAndGithubIssueNumberAndGithubRepoFullNameIgnoreCase(
                41L, 34L, "planora/app")).thenReturn(List.of(task));
        when(kanbanColumnRepository.findFirstByKanban_ProjectIdAndNameIgnoreCase(41L, "In Review"))
                .thenReturn(Optional.of(targetColumn));

        automationService.onIssueLabeled(new IssueLabeledEvent(
                this, "planora/app", 34, "Broken sync", "ready-for-review", "5319e7"));

        verify(taskService).updateTaskColumn(99L, 7L);
    }

    @Test
    void issueLabeledMoveRuleSkipsNonMatchingLabel() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                13L,
                project,
                GithubTrigger.ISSUE_LABELED,
                GithubAction.MOVE_TASK_TO_COLUMN,
                true,
                Map.of(
                        "projectId", "41",
                        "labelName", "ready-for-review",
                        "targetColumnName", "In Review"));

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.ISSUE_LABELED))
                .thenReturn(List.of(rule));
        when(kanbanColumnRepository.findFirstByKanban_ProjectIdAndNameIgnoreCase(41L, "In Review"))
                .thenReturn(Optional.of(new KanbanColumn()));

        automationService.onIssueLabeled(new IssueLabeledEvent(
                this, "planora/app", 34, "Broken sync", "blocked", "d73a4a"));

        org.mockito.Mockito.verify(taskService, org.mockito.Mockito.never())
                .updateTaskColumn(any(), any());
    }

    @Test
    void releasePublishedMovesActiveSprintTasksToDoneColumnByDefault() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                14L,
                project,
                GithubTrigger.RELEASE_PUBLISHED,
                GithubAction.MOVE_TASK_TO_COLUMN,
                true,
                Map.of("projectId", "41"));
        Sprint activeSprint = new Sprint();
        activeSprint.setId(6L);
        activeSprint.setStatus(SprintStatus.ACTIVE);
        Task firstTask = new Task();
        firstTask.setId(90L);
        Task secondTask = new Task();
        secondTask.setId(91L);
        KanbanColumn doneColumn = new KanbanColumn();
        doneColumn.setId(8L);
        doneColumn.setName("Done");

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.RELEASE_PUBLISHED))
                .thenReturn(List.of(rule));
        when(kanbanColumnRepository.findFirstByKanban_ProjectIdAndNameIgnoreCase(41L, "Done"))
                .thenReturn(Optional.of(new KanbanColumn()));
        when(sprintRepository.findByProject_Id(41L)).thenReturn(List.of(activeSprint));
        when(taskRepository.findBySprintId(6L)).thenReturn(List.of(firstTask, secondTask));
        when(kanbanColumnRepository.findFirstByKanban_ProjectIdAndNameIgnoreCase(41L, "Done"))
                .thenReturn(Optional.of(doneColumn));

        automationService.onReleasePublished(new ReleasePublishedEvent(
                this, "planora/app", "v2.0.0", "Planora 2.0", "https://github.com/planora/app/releases/tag/v2.0.0"));

        verify(taskService).updateTaskColumn(90L, 8L);
        verify(taskService).updateTaskColumn(91L, 8L);
        verify(automationLogRepository).save(org.mockito.ArgumentMatchers.argThat(execution ->
                "SUCCESS".equals(execution.getOutcome())
                        && execution.getMessage().contains("Moved 2 task")));
    }

    @Test
    void releasePublishedDoesNotMoveProjectWideTasksWhenCurrentSprintLimitDisabled() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                14L,
                project,
                GithubTrigger.RELEASE_PUBLISHED,
                GithubAction.MOVE_TASK_TO_COLUMN,
                true,
                Map.of("projectId", "41", "onlyCurrentSprint", "false"));

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.RELEASE_PUBLISHED))
                .thenReturn(List.of(rule));
        when(kanbanColumnRepository.findFirstByKanban_ProjectIdAndNameIgnoreCase(41L, "Done"))
                .thenReturn(Optional.of(new KanbanColumn()));

        automationService.onReleasePublished(new ReleasePublishedEvent(
                this, "planora/app", "v2.0.0", "Planora 2.0", "https://github.com/planora/app/releases/tag/v2.0.0"));

        org.mockito.Mockito.verify(taskService, org.mockito.Mockito.never())
                .updateTaskColumn(any(), any());
        verifyNoInteractions(sprintRepository);
    }

    @Test
    void prMergedMovesTaskReferencedByHashBranchAndBroadcastsBadgeUpdate() {
        Project project = new Project();
        project.setId(41L);
        GithubAutomationRule rule = new GithubAutomationRule(
                15L,
                project,
                GithubTrigger.PR_MERGED,
                GithubAction.MOVE_TASK_TO_COLUMN,
                true,
                Map.of("targetColumnName", "Done"));
        Task task = new Task();
        task.setId(99L);
        task.setGithubIssueNumber(34L);
        task.setGithubRepoFullName("planora/app");
        KanbanColumn doneColumn = new KanbanColumn();
        doneColumn.setId(8L);
        doneColumn.setName("Done");
        doneColumn.setStatus("DONE");

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.PR_MERGED))
                .thenReturn(List.of(rule));
        when(kanbanColumnRepository.findFirstByKanban_ProjectIdAndNameIgnoreCase(41L, "Done"))
                .thenReturn(Optional.of(doneColumn));
        when(taskRepository.findByProjectIdAndProjectTaskNumber(41L, 123L))
                .thenReturn(Optional.of(task));

        automationService.onPRMerged(new PRMergedEvent(
                this, "planora/app", 17, "Improve sync", "release/#123"));

        verify(taskService).updateTaskColumn(99L, 8L);
        verify(githubEventBroadcaster).broadcastTaskBadgeUpdate(
                org.mockito.ArgumentMatchers.eq(41L),
                org.mockito.ArgumentMatchers.eq(99L),
                org.mockito.ArgumentMatchers.argThat(payload ->
                        payload.getTaskId().equals(99L) && "closed".equals(payload.getIssueState())));
    }

    @Test
    void sendNotificationRuleCreatesNotificationForProjectTeamMembers() {
        Project project = new Project();
        project.setId(41L);
        Team team = new Team();
        team.setId(11L);
        project.setTeam(team);

        User first = new User();
        first.setUserId(101L);
        first.setUsername("alice");

        User second = new User();
        second.setUserId(102L);
        second.setUsername("bob");

        TeamMember firstMember = new TeamMember();
        firstMember.setUser(first);
        TeamMember secondMember = new TeamMember();
        secondMember.setUser(second);

        GithubAutomationRule rule = new GithubAutomationRule(
                21L,
                project,
                GithubTrigger.PR_OPENED,
                GithubAction.SEND_NOTIFICATION,
                true,
                Map.<String, String>of());

        when(projectRepository.findByGithubRepoFullNameIgnoreCase("planora/app"))
                .thenReturn(List.of(project));
        when(ruleRepository.findByProject_IdInAndTrigger(List.of(41L), GithubTrigger.PR_OPENED))
                .thenReturn(List.of(rule));
        when(teamMemberRepository.findByTeamId(11L)).thenReturn(List.of(firstMember, secondMember));

        automationService.onPROpened(new PROpenedEvent(
                this, "planora/app", 17, "Improve sync", "octocat", "feature/task/123"));

        verify(notificationService).createNotification(
                first,
                41L,
                NotificationEventType.GITHUB_ACTIVITY.name(),
                "GitHub: Pull request #17 was opened - Improve sync",
                "https://github.com/planora/app/pull/17");
        verify(notificationService).createNotification(
                second,
                41L,
                NotificationEventType.GITHUB_ACTIVITY.name(),
                "GitHub: Pull request #17 was opened - Improve sync",
                "https://github.com/planora/app/pull/17");
        verify(automationLogRepository).save(org.mockito.ArgumentMatchers.argThat(execution ->
                "SUCCESS".equals(execution.getOutcome())
                        && execution.getMessage().contains("created 2 notification")));
    }
}

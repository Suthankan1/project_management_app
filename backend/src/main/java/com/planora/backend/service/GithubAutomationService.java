package com.planora.backend.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.time.LocalDateTime;

import org.springframework.data.domain.PageRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.dto.GithubAutomationRuleRequestDTO;
import com.planora.backend.dto.GithubAutomationRuleResponseDTO;
import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.dto.GithubLabelDTO;
import com.planora.backend.dto.GithubTaskBadgePayload;
import com.planora.backend.event.CIFailedEvent;
import com.planora.backend.event.IssueLabeledEvent;
import com.planora.backend.event.IssueOpenedEvent;
import com.planora.backend.event.PRMergedEvent;
import com.planora.backend.event.PROpenedEvent;
import com.planora.backend.event.ReleasePublishedEvent;
import com.planora.backend.exception.ResourceNotFoundException;
import com.planora.backend.model.GithubAction;
import com.planora.backend.model.GithubAutomationLog;
import com.planora.backend.model.GithubAutomationRule;
import com.planora.backend.model.Label;
import com.planora.backend.model.GithubTrigger;
import com.planora.backend.model.KanbanColumn;
import com.planora.backend.model.Project;
import com.planora.backend.model.Priority;
import com.planora.backend.model.Sprint;
import com.planora.backend.model.SprintStatus;
import com.planora.backend.model.Task;
import com.planora.backend.repository.GithubAutomationLogRepository;
import com.planora.backend.repository.GithubAutomationRuleRepository;
import com.planora.backend.repository.KanbanColumnRepository;
import com.planora.backend.repository.ProjectRepository;
import com.planora.backend.repository.SprintRepository;
import com.planora.backend.repository.TaskRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GithubAutomationService {

    private static final Logger log = LoggerFactory.getLogger(GithubAutomationService.class);

    private final TaskService taskService;
    private final KanbanColumnRepository kanbanColumnRepository;
    private final NotificationService notificationService;
    private final ProjectRepository projectRepository;
    private final GithubAutomationLogRepository githubAutomationLogRepository;
    private final GithubAutomationRuleRepository githubAutomationRuleRepository;
    private final TaskRepository taskRepository;
    private final SprintRepository sprintRepository;
    private final GithubIssueConversionService githubIssueConversionService;
    private final GithubEventBroadcaster githubEventBroadcaster;
    private final LabelService labelService;
    private final ObjectMapper objectMapper;

    @EventListener
    @Async
    public void onPRMerged(PRMergedEvent event) {
        Map<String, Object> context = Map.of(
                "repoFullName", event.getRepoFullName(),
                "prNumber", event.getPrNumber(),
                "prTitle", event.getPrTitle(),
                "branch", event.getBranch());
        executeRulesForTrigger(GithubTrigger.PR_MERGED, context);
    }

    @EventListener
    @Async
    @Transactional
    public void onPROpened(PROpenedEvent event) {
        executeRulesForTrigger(GithubTrigger.PR_OPENED, Map.of(
                "repoFullName", event.getRepoFullName(),
                "prNumber", event.getPrNumber(),
                "prTitle", event.getPrTitle(),
                "branch", event.getBranch()));
    }

    @EventListener
    @Async
    public void onCIFailed(CIFailedEvent event) {
        executeRulesForTrigger(GithubTrigger.CI_FAILED, Map.of(
                "repoFullName", event.getRepoFullName(),
                "branch", event.getBranch(),
                "commitSha", event.getCommitSha(),
                "workflowName", event.getWorkflowName()));
    }

    @EventListener
    @Async
    public void onIssueOpened(IssueOpenedEvent event) {
        executeRulesForTrigger(GithubTrigger.ISSUE_OPENED, Map.of(
                "repoFullName", event.getRepoFullName(),
                "issueNumber", event.getIssueNumber(),
                "issueTitle", event.getIssueTitle(),
                "issueBody", event.getIssueBody(),
                "authorLogin", event.getAuthorLogin(),
                "labels", event.getLabels()));
    }

    @EventListener
    @Async
    public void onIssueLabeled(IssueLabeledEvent event) {
        executeRulesForTrigger(GithubTrigger.ISSUE_LABELED, Map.of(
                "repoFullName", event.getRepoFullName(),
                "issueNumber", event.getIssueNumber(),
                "labelName", event.getLabelName()));
    }

    @EventListener
    @Async
    public void onReleasePublished(ReleasePublishedEvent event) {
        executeRulesForTrigger(GithubTrigger.RELEASE_PUBLISHED, Map.of(
                "repoFullName", event.getRepoFullName(),
                "tagName", event.getTagName(),
                "releaseName", event.getReleaseName()));
    }

    /**
     * Locates configured rules for projects linked to the source repository and
     * dispatches them to their action handlers. Action behavior is deliberately
     * stubbed until each rule type defines its required configuration and actor.
     */
    @Transactional
    public void executeRulesForTrigger(GithubTrigger trigger, Map<String, Object> context) {
        String repoFullName = Objects.toString(context.get("repoFullName"), "").trim();
        if (trigger == null || repoFullName.isBlank()) {
            return;
        }

        List<Long> projectIds = projectRepository.findByGithubRepoFullNameIgnoreCase(repoFullName)
                .stream()
                .map(Project::getId)
                .filter(Objects::nonNull)
                .toList();
        if (projectIds.isEmpty()) {
            return;
        }

        githubAutomationRuleRepository.findByProject_IdInAndTrigger(projectIds, trigger).stream()
            .filter(rule -> rule.getTrigger() == trigger && rule.isEnabled())
                .forEach(rule -> dispatchAction(rule, context));
    }

    @Transactional(readOnly = true)
    public List<GithubAutomationRuleResponseDTO> getRulesForProject(Long projectId) {
        requireProject(projectId);
        return githubAutomationRuleRepository.findByProject_IdOrderByIdAsc(projectId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public GithubAutomationRuleResponseDTO createRule(
            Long projectId,
            GithubAutomationRuleRequestDTO request) {
        Project project = requireProject(projectId);
        GithubAutomationRule rule = new GithubAutomationRule();
        rule.setProject(project);
        rule.setTrigger(request.getTrigger());
        rule.setAction(request.getAction());
        rule.setEnabled(true);
        rule.setConfig(request.getConfig() == null
                ? new LinkedHashMap<>()
                : new LinkedHashMap<>(request.getConfig()));
        return toResponse(githubAutomationRuleRepository.save(rule));
    }

    @Transactional
    public GithubAutomationRuleResponseDTO setRuleEnabled(Long projectId, Long ruleId, boolean enabled) {
        requireProject(projectId);
        GithubAutomationRule rule = githubAutomationRuleRepository.findByIdAndProject_Id(ruleId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("GitHub automation rule not found"));
        rule.setEnabled(enabled);
        return toResponse(githubAutomationRuleRepository.save(rule));
    }

    @Transactional
    public void deleteRule(Long projectId, Long ruleId) {
        requireProject(projectId);
        GithubAutomationRule rule = githubAutomationRuleRepository.findByIdAndProject_Id(ruleId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("GitHub automation rule not found"));
        githubAutomationRuleRepository.delete(rule);
    }

    @Transactional(readOnly = true)
    public List<GithubAutomationLog> getRecentLogsForProject(Long projectId) {
        requireProject(projectId);
        return githubAutomationLogRepository.findRecentByProjectId(projectId, PageRequest.of(0, 50));
    }

    private void dispatchAction(GithubAutomationRule rule, Map<String, Object> context) {
        if (rule.getAction() == null) {
            log.warn("Skipping GitHub automation rule {} because it has no action", rule.getId());
            return;
        }

        try {
            switch (rule.getAction()) {
                case MOVE_TASK_TO_COLUMN -> executeMoveTaskToColumn(rule, context);
                case CREATE_TASK -> {
                    Optional<Long> createdTaskId = createTask(rule, context);
                    createdTaskId.ifPresent(taskId -> recordExecution(rule, context, "SUCCESS",
                            "CREATE_TASK action created task " + taskId));
                }
                case SEND_NOTIFICATION -> {
                    sendNotification(rule, context);
                    recordExecution(rule, context, "SUCCESS", "SEND_NOTIFICATION action dispatched");
                }
            }
        } catch (RuntimeException exception) {
            recordExecution(rule, context, "ERROR", exception.getMessage() == null
                    ? "Automation action failed"
                    : exception.getMessage());
            log.error("GitHub automation rule {} failed for action {}", rule.getId(), rule.getAction(), exception);
        }
    }

    private void executeMoveTaskToColumn(GithubAutomationRule rule, Map<String, Object> context) {
        Project project = rule.getProject();
        if (project == null || project.getId() == null) {
            recordExecution(rule, context, "SKIPPED", "Rule has no project");
            return;
        }

        Map<String, String> config = rule.getConfig() == null ? Map.of() : rule.getConfig();
        String targetColumnName = targetColumnName(rule, config);
        if (targetColumnName.isBlank()) {
            recordExecution(rule, context, "SKIPPED", "No target column is configured");
            return;
        }
        Optional<KanbanColumn> targetColumn = kanbanColumnRepository
                .findFirstByKanban_ProjectIdAndNameIgnoreCase(project.getId(), targetColumnName);
        if (targetColumn.isEmpty()) {
            recordExecution(rule, context, "SKIPPED", "Target column '" + targetColumnName + "' was not found");
            return;
        }

        List<Task> tasks = switch (rule.getTrigger()) {
            case PR_OPENED, PR_MERGED -> tasksFromPullRequestBranch(rule, context, project);
            case ISSUE_LABELED -> tasksFromLabeledIssue(rule, context, project);
            case RELEASE_PUBLISHED -> tasksFromRelease(rule, project);
            default -> List.of();
        };
        if (tasks.isEmpty()) {
            recordExecution(rule, context, "SKIPPED", "No matching tasks were found");
            return;
        }

        KanbanColumn column = targetColumn.get();
        int movedCount = 0;
        for (Task task : tasks) {
            if (task.getId() == null) {
                continue;
            }
            String fromColumn = task.getKanbanColumn() == null ? "" : task.getKanbanColumn().getName();
            taskService.updateTaskColumn(task.getId(), column.getId());
            githubEventBroadcaster.broadcastTaskBadgeUpdate(
                    project.getId(),
                    task.getId(),
                    new GithubTaskBadgePayload(
                            task.getId(),
                            task.getGithubIssueNumber(),
                            task.getGithubRepoFullName(),
                            badgeIssueState(column)));
            movedCount++;
            log.info("GitHub automation rule {} moved task {} from column '{}' to '{}'",
                    rule.getId(), task.getId(), fromColumn, column.getName());
        }
        if (movedCount == 0) {
            recordExecution(rule, context, "SKIPPED", "Matching tasks did not have persisted IDs");
            return;
        }
        recordExecution(rule, context, "SUCCESS",
                "Moved " + movedCount + " task(s) to column '" + column.getName() + "'");
    }

    private Optional<Long> createTask(GithubAutomationRule rule, Map<String, Object> context) {
        if (rule.getTrigger() == GithubTrigger.CI_FAILED) {
            return executeCreateTask(rule, context);
        }
        if (rule.getTrigger() == GithubTrigger.ISSUE_OPENED) {
            return importOpenedIssueAsTask(rule, context);
        }
        log.debug("Dispatching GitHub automation action {} for rule {} with context {}",
                GithubAction.CREATE_TASK, rule.getId(), context);
        return Optional.empty();
    }

    private void sendNotification(GithubAutomationRule rule, Map<String, Object> context) {
        log.debug("Dispatching GitHub automation action {} for rule {} with context {}",
                GithubAction.SEND_NOTIFICATION, rule.getId(), context);
    }

    private Map<String, Object> eventContext(String repoFullName) {
        Map<String, Object> context = new LinkedHashMap<>();
        context.put("repoFullName", repoFullName);
        return context;
    }

    private Map<String, Object> issueContext(String repoFullName, int issueNumber, String issueTitle) {
        Map<String, Object> context = eventContext(repoFullName);
        context.put("issueNumber", issueNumber);
        context.put("issueTitle", issueTitle);
        return context;
    }

    private String targetColumnName(GithubAutomationRule rule, Map<String, String> config) {
        String configuredName = Objects.toString(config.get("targetColumnName"), "").trim();
        if (!configuredName.isBlank()) {
            return configuredName;
        }
        if (rule.getTrigger() == GithubTrigger.RELEASE_PUBLISHED) {
            return "Done";
        }
        return Objects.toString(
                config.getOrDefault("columnName", config.get("column")),
                "").trim();
    }

    private List<Task> tasksFromPullRequestBranch(
            GithubAutomationRule rule,
            Map<String, Object> context,
            Project project) {
        String branch = Objects.toString(context.get("branch"), "");
        Optional<Long> projectTaskNumber = extractProjectTaskNumber(branch, project.getProjectKey());
        if (projectTaskNumber.isEmpty()) {
            log.debug("Skipping PR automation rule {}: branch '{}' has no task reference",
                    rule.getId(), branch);
            return List.of();
        }
        return taskRepository.findByProjectIdAndProjectTaskNumber(project.getId(), projectTaskNumber.get())
                .map(List::of)
                .orElseGet(List::of);
    }

    private Optional<Long> extractProjectTaskNumber(String branch, String projectKey) {
        if (branch == null || branch.isBlank()) {
            return Optional.empty();
        }

        Matcher taskBranch = Pattern.compile("(?i)(?:^|[^a-z0-9])task/(\\d+)(?=$|[^0-9])")
                .matcher(branch);
        if (taskBranch.find()) {
            return Optional.of(Long.valueOf(taskBranch.group(1)));
        }

        Matcher issueReference = Pattern.compile("(?<!\\w)#(\\d+)(?=$|[^0-9])").matcher(branch);
        if (issueReference.find()) {
            return Optional.of(Long.valueOf(issueReference.group(1)));
        }

        String prefixes = projectKey == null || projectKey.isBlank()
                ? "planora"
                : "planora|" + Pattern.quote(projectKey);
        Matcher keyedBranch = Pattern.compile(
                "(?i)(?:^|[^a-z0-9])(?:" + prefixes + ")-(\\d+)(?=$|[^0-9])")
                .matcher(branch);
        return keyedBranch.find()
                ? Optional.of(Long.valueOf(keyedBranch.group(1)))
                : Optional.empty();
    }

    private List<Task> tasksFromLabeledIssue(
            GithubAutomationRule rule,
            Map<String, Object> context,
            Project project) {
        Map<String, String> config = rule.getConfig() == null ? Map.of() : rule.getConfig();
        String configuredLabelName = Objects.toString(config.get("labelName"), "").trim();
        String appliedLabelName = Objects.toString(context.get("labelName"), "").trim();
        if (configuredLabelName.isBlank() || !configuredLabelName.equalsIgnoreCase(appliedLabelName)) {
            log.debug("Skipping issue-labeled automation rule {} because applied label '{}' does not match '{}'",
                    rule.getId(), appliedLabelName, configuredLabelName);
            return List.of();
        }

        String repoFullName = Objects.toString(context.get("repoFullName"), "").trim();
        int issueNumber = ((Number) context.get("issueNumber")).intValue();
        return taskRepository
                .findByProjectIdAndGithubIssueNumberAndGithubRepoFullNameIgnoreCase(
                        project.getId(), (long) issueNumber, repoFullName);
    }

    private List<Task> tasksFromRelease(GithubAutomationRule rule, Project project) {
        Map<String, String> config = rule.getConfig() == null ? Map.of() : rule.getConfig();
        boolean onlyCurrentSprint = Boolean.parseBoolean(config.getOrDefault("onlyCurrentSprint", "true"));
        if (!onlyCurrentSprint) {
            log.warn("Skipping release automation rule {} because onlyCurrentSprint=false requires a configured sprint or milestone selector",
                    rule.getId());
            return List.of();
        }

        Optional<Sprint> activeSprint = sprintRepository.findByProject_Id(project.getId()).stream()
                .filter(sprint -> sprint.getStatus() == SprintStatus.ACTIVE)
                .findFirst();
        if (activeSprint.isEmpty()) {
            log.debug("Skipping release automation rule {} because project {} has no active sprint",
                    rule.getId(), project.getId());
            return List.of();
        }
        return taskRepository.findBySprintId(activeSprint.get().getId());
    }

    private String badgeIssueState(KanbanColumn targetColumn) {
        return "DONE".equalsIgnoreCase(targetColumn.getStatus())
                || "Done".equalsIgnoreCase(targetColumn.getName())
                ? "closed"
                : "open";
    }

    private void recordExecution(
            GithubAutomationRule rule,
            Map<String, Object> context,
            String outcome,
            String message) {
        GithubAutomationLog execution = new GithubAutomationLog();
        execution.setRuleId(rule.getId());
        execution.setTrigger(rule.getTrigger());
        execution.setAction(rule.getAction());
        execution.setContext(toContextJson(context));
        execution.setOutcome(outcome);
        execution.setMessage(message);
        execution.setExecutedAt(LocalDateTime.now());
        githubAutomationLogRepository.save(execution);
    }

    private String toContextJson(Map<String, Object> context) {
        try {
            return objectMapper.writeValueAsString(context);
        } catch (JsonProcessingException exception) {
            log.warn("Could not serialize GitHub automation context as JSON", exception);
            return "{}";
        }
    }

    private Optional<Long> executeCreateTask(GithubAutomationRule rule, Map<String, Object> context) {
        Map<String, String> config = rule.getConfig() == null ? Map.of() : rule.getConfig();
        Project ruleProject = rule.getProject();
        if (ruleProject == null || ruleProject.getId() == null) {
            recordExecution(rule, context, "SKIPPED", "Rule has no project");
            return Optional.empty();
        }

        String configuredProjectId = Objects.toString(config.get("projectId"), "").trim();
        String ruleProjectId = ruleProject.getId().toString();
        if (!configuredProjectId.isBlank() && !configuredProjectId.equals(ruleProjectId)) {
            recordExecution(rule, context, "SKIPPED",
                    "Configured projectId " + configuredProjectId + " does not match rule project " + ruleProjectId);
            return Optional.empty();
        }

        Project project = requireProject(ruleProject.getId());
        String titleTemplate = Objects.toString(config.get("taskTitle"), "🔴 CI Failure: {workflowName} on {branch}");
        String taskTitle = renderTemplate(titleTemplate, context);
        String taskDescription = buildCIFailureDescription(context);
        Priority priority = parsePriority(config.get("priority"), Priority.HIGH);

        Task task = taskService.createAutomationTask(project, taskTitle, taskDescription, priority);

        String labelName = Objects.toString(config.get("labelName"), "").trim();
        if (labelName.isBlank()) {
            labelName = "bug";
        }
        String labelColor = Objects.toString(config.get("labelColor"), "").trim();
        if (labelColor.isBlank()) {
            labelColor = "#d73a4a";
        }
        Label label = labelService.findOrCreate(labelName, labelColor, project);
        task.getLabels().add(label);
        Task saved = taskRepository.save(task);

        log.info("GitHub automation rule {} created CI failure task {} in project {}: title='{}', priority='{}', label='{}'",
                rule.getId(), saved.getId(), project.getId(), saved.getTitle(), saved.getPriority(), label.getName());
        return Optional.of(saved.getId());
    }

    private String renderTemplate(String template, Map<String, Object> context) {
        return template
                .replace("{workflowName}", Objects.toString(context.get("workflowName"), ""))
                .replace("{branch}", Objects.toString(context.get("branch"), ""))
                .replace("{commitSha}", Objects.toString(context.get("commitSha"), ""))
                .replace("{issueTitle}", Objects.toString(context.get("issueTitle"), ""))
                .replace("{issueNumber}", Objects.toString(context.get("issueNumber"), ""));
    }

    private String buildCIFailureDescription(Map<String, Object> context) {
        String workflowName = Objects.toString(context.get("workflowName"), "").trim();
        String branch = Objects.toString(context.get("branch"), "").trim();
        String commitSha = Objects.toString(context.get("commitSha"), "").trim();
        String repoFullName = Objects.toString(context.get("repoFullName"), "").trim();
        String commitLink = commitSha.isBlank() || repoFullName.isBlank()
                ? ""
                : "https://github.com/" + repoFullName + "/commit/" + commitSha;

        StringBuilder description = new StringBuilder("Automated task created from a failed CI run.\n\n");
        if (!workflowName.isBlank()) {
            description.append("Workflow: ").append(workflowName).append('\n');
        }
        if (!branch.isBlank()) {
            description.append("Branch: ").append(branch).append('\n');
        }
        if (!commitSha.isBlank()) {
            description.append("Commit: ");
            if (commitLink.isBlank()) {
                description.append(commitSha);
            } else {
                description.append('[').append(commitSha).append("](").append(commitLink).append(')');
            }
            description.append('\n');
        }
        return description.toString().trim();
    }

    private Priority parsePriority(String value, Priority defaultPriority) {
        if (value == null || value.isBlank()) {
            return defaultPriority;
        }
        try {
            return Priority.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            log.warn("Invalid priority '{}' in GitHub automation rule; defaulting to {}", value, defaultPriority);
            return defaultPriority;
        }
    }

    private Optional<Long> importOpenedIssueAsTask(GithubAutomationRule rule, Map<String, Object> context) {
        Map<String, String> config = rule.getConfig() == null ? Map.of() : rule.getConfig();
        Project project = rule.getProject();
        String configuredProjectId = Objects.toString(config.get("projectId"), "").trim();
        String ruleProjectId = project == null || project.getId() == null
                ? ""
                : project.getId().toString();
        if (configuredProjectId.isBlank() || !configuredProjectId.equals(ruleProjectId)) {
            log.warn("Skipping issue-opened automation rule {} because config projectId must match its project",
                    rule.getId());
            return Optional.empty();
        }

        List<String> labels = issueLabelsFromContext(context);
        String requiredLabel = Objects.toString(config.get("onlyIfLabeled"), "").trim();
        if (!requiredLabel.isBlank() && labels.stream().noneMatch(requiredLabel::equalsIgnoreCase)) {
            log.debug("Skipping issue-opened automation rule {} because label '{}' is absent",
                    rule.getId(), requiredLabel);
            return Optional.empty();
        }

        String repoFullName = Objects.toString(context.get("repoFullName"), "").trim();
        int issueNumber = ((Number) context.get("issueNumber")).intValue();
        if (githubIssueConversionService.isAlreadyImported((long) issueNumber, repoFullName, project.getId())) {
            log.debug("Skipping issue-opened automation rule {} because issue #{} is already imported",
                    rule.getId(), issueNumber);
            return Optional.empty();
        }

        GithubIssueDTO issue = new GithubIssueDTO();
        issue.setNumber(issueNumber);
        issue.setTitle(Objects.toString(context.get("issueTitle"), ""));
        issue.setBody(Objects.toString(context.get("issueBody"), ""));
        issue.setState("open");
        issue.setHtmlUrl("https://github.com/" + repoFullName + "/issues/" + issueNumber);
        issue.setLabels(labels.stream().map(label -> new GithubLabelDTO(label, null)).toList());

        Task task = githubIssueConversionService.convertIssueToTask(issue, project);
        if (task.getCreatedAt() == null) {
            task.setCreatedAt(LocalDateTime.now());
        }
        task.setProjectTaskNumber(taskRepository.findMaxProjectTaskNumberByProjectId(project.getId()) + 1L);
        task.setBacklogPosition(taskRepository.findMaxBacklogPositionByProjectId(project.getId()) + 1);
        Task saved = taskRepository.save(task);
        log.info("GitHub automation imported opened issue #{} as a task in project {}",
                issueNumber, project.getId());
        return Optional.of(saved.getId());
    }

    @SuppressWarnings("unchecked")
    private List<String> issueLabelsFromContext(Map<String, Object> context) {
        Object labels = context.get("labels");
        return labels instanceof List<?> list
                ? list.stream().filter(String.class::isInstance).map(String.class::cast).toList()
                : List.of();
    }

    private Project requireProject(Long projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found"));
    }

    private GithubAutomationRuleResponseDTO toResponse(GithubAutomationRule rule) {
        return new GithubAutomationRuleResponseDTO(
                rule.getId(),
                rule.getProject().getId(),
                rule.getTrigger(),
                rule.getAction(),
            rule.isEnabled(),
                rule.getConfig() == null ? Map.of() : new LinkedHashMap<>(rule.getConfig()));
    }
}

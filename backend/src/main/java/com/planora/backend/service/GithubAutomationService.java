package com.planora.backend.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.planora.backend.dto.GithubAutomationRuleRequestDTO;
import com.planora.backend.dto.GithubAutomationRuleResponseDTO;
import com.planora.backend.event.CIFailedEvent;
import com.planora.backend.event.IssueLabeledEvent;
import com.planora.backend.event.IssueOpenedEvent;
import com.planora.backend.event.PRMergedEvent;
import com.planora.backend.event.ReleasePublishedEvent;
import com.planora.backend.exception.ResourceNotFoundException;
import com.planora.backend.model.GithubAction;
import com.planora.backend.model.GithubAutomationRule;
import com.planora.backend.model.GithubTrigger;
import com.planora.backend.model.Project;
import com.planora.backend.repository.GithubAutomationRuleRepository;
import com.planora.backend.repository.KanbanColumnRepository;
import com.planora.backend.repository.ProjectRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GithubAutomationService {

    private static final Logger log = LoggerFactory.getLogger(GithubAutomationService.class);

    private final TaskService taskService;
    private final KanbanColumnRepository kanbanColumnRepository;
    private final NotificationService notificationService;
    private final ProjectRepository projectRepository;
    private final GithubAutomationRuleRepository githubAutomationRuleRepository;

    @EventListener
    @Async
    public void onPRMerged(PRMergedEvent event) {
        Map<String, Object> context = Map.of(
                "repoFullName", event.getRepoFullName(),
                "prNumber", event.getPrNumber(),
                "prTitle", event.getPrTitle());
        executeRulesForTrigger(GithubTrigger.PR_MERGED, context);
    }

    @EventListener
    public void onCIFailed(CIFailedEvent event) {
        Map<String, Object> context = eventContext(event.getRepoFullName());
        context.put("workflowName", event.getWorkflowName());
        context.put("branch", event.getBranch());
        context.put("commitSha", event.getCommitSha());
        executeRulesForTrigger(GithubTrigger.CI_FAILED, context);
    }

    @EventListener
    public void onIssueOpened(IssueOpenedEvent event) {
        Map<String, Object> context = issueContext(
                event.getRepoFullName(), event.getIssueNumber(), event.getIssueTitle());
        executeRulesForTrigger(GithubTrigger.ISSUE_OPENED, context);
    }

    @EventListener
    public void onIssueLabeled(IssueLabeledEvent event) {
        Map<String, Object> context = issueContext(
                event.getRepoFullName(), event.getIssueNumber(), event.getIssueTitle());
        executeRulesForTrigger(GithubTrigger.ISSUE_LABELED, context);
    }

    @EventListener
    public void onReleasePublished(ReleasePublishedEvent event) {
        Map<String, Object> context = eventContext(event.getRepoFullName());
        context.put("tagName", event.getTagName());
        context.put("releaseName", event.getReleaseName());
        context.put("releaseUrl", event.getReleaseUrl());
        executeRulesForTrigger(GithubTrigger.RELEASE_PUBLISHED, context);
    }

    /**
     * Locates configured rules for projects linked to the source repository and
     * dispatches them to their action handlers. Action behavior is deliberately
     * stubbed until each rule type defines its required configuration and actor.
     */
    @Transactional(readOnly = true)
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
                .filter(rule -> rule.getTrigger() == trigger)
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
        rule.setConfig(request.getConfig() == null
                ? new LinkedHashMap<>()
                : new LinkedHashMap<>(request.getConfig()));
        return toResponse(githubAutomationRuleRepository.save(rule));
    }

    @Transactional
    public void deleteRule(Long projectId, Long ruleId) {
        requireProject(projectId);
        GithubAutomationRule rule = githubAutomationRuleRepository.findByIdAndProject_Id(ruleId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("GitHub automation rule not found"));
        githubAutomationRuleRepository.delete(rule);
    }

    private void dispatchAction(GithubAutomationRule rule, Map<String, Object> context) {
        if (rule.getAction() == null) {
            log.warn("Skipping GitHub automation rule {} because it has no action", rule.getId());
            return;
        }

        switch (rule.getAction()) {
            case MOVE_TASK_TO_COLUMN -> moveTaskToColumn(rule, context);
            case CREATE_TASK -> createTask(rule, context);
            case SEND_NOTIFICATION -> sendNotification(rule, context);
        }
    }

    private void moveTaskToColumn(GithubAutomationRule rule, Map<String, Object> context) {
        log.debug("Dispatching GitHub automation action {} for rule {} with context {}",
                GithubAction.MOVE_TASK_TO_COLUMN, rule.getId(), context);
    }

    private void createTask(GithubAutomationRule rule, Map<String, Object> context) {
        log.debug("Dispatching GitHub automation action {} for rule {} with context {}",
                GithubAction.CREATE_TASK, rule.getId(), context);
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
                rule.getConfig() == null ? Map.of() : new LinkedHashMap<>(rule.getConfig()));
    }
}

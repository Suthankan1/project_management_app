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

import com.planora.backend.dto.GithubAutomationRuleRequestDTO;
import com.planora.backend.dto.GithubAutomationRuleResponseDTO;
import com.planora.backend.event.PRMergedEvent;
import com.planora.backend.model.GithubAction;
import com.planora.backend.model.GithubAutomationRule;
import com.planora.backend.model.GithubTrigger;
import com.planora.backend.model.Project;
import com.planora.backend.repository.GithubAutomationRuleRepository;
import com.planora.backend.repository.KanbanColumnRepository;
import com.planora.backend.repository.ProjectRepository;

@ExtendWith(MockitoExtension.class)
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

    private GithubAutomationService automationService;

    @BeforeEach
    void setUp() {
        automationService = new GithubAutomationService(
                taskService,
                kanbanColumnRepository,
                notificationService,
                projectRepository,
                ruleRepository);
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
}

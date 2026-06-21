package com.planora.backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.planora.backend.dto.GithubAutomationRuleRequestDTO;
import com.planora.backend.dto.GithubAutomationRuleResponseDTO;
import com.planora.backend.model.GithubAction;
import com.planora.backend.model.GithubAutomationLog;
import com.planora.backend.model.GithubTrigger;
import com.planora.backend.service.GithubAutomationService;

class GithubAutomationControllerTest {

    private GithubAutomationService githubAutomationService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        githubAutomationService = org.mockito.Mockito.mock(GithubAutomationService.class);
        mockMvc = MockMvcBuilders.standaloneSetup(
                new GithubAutomationController(githubAutomationService)).build();
    }

    @Test
    void listsGithubAutomationRulesForProject() throws Exception {
        GithubAutomationRuleResponseDTO rule = response();
        when(githubAutomationService.getRulesForProject(41L)).thenReturn(List.of(rule));

        mockMvc.perform(get("/api/projects/41/automations/github"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(9))
                .andExpect(jsonPath("$[0].trigger").value("PR_MERGED"));
    }

    @Test
    void createsGithubAutomationRuleForProject() throws Exception {
        when(githubAutomationService.createRule(
                org.mockito.ArgumentMatchers.eq(41L),
                org.mockito.ArgumentMatchers.any(GithubAutomationRuleRequestDTO.class)))
                .thenReturn(response());

        mockMvc.perform(post("/api/projects/41/automations/github")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "trigger": "PR_MERGED",
                                  "action": "SEND_NOTIFICATION",
                                  "config": {"message": "Merged"}
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.projectId").value(41))
                .andExpect(jsonPath("$.action").value("SEND_NOTIFICATION"));
    }

    @Test
    void listsRecentGithubAutomationLogsForProject() throws Exception {
        GithubAutomationLog execution = new GithubAutomationLog(
                22L,
                9L,
                GithubTrigger.PR_MERGED,
                GithubAction.MOVE_TASK_TO_COLUMN,
                "{\"repoFullName\":\"planora/app\"}",
                "SUCCESS",
                "Moved 1 task(s) to column 'Done'",
                LocalDateTime.of(2026, 5, 26, 12, 0));
        when(githubAutomationService.getRecentLogsForProject(41L)).thenReturn(List.of(execution));

        mockMvc.perform(get("/api/projects/41/automations/github/logs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].ruleId").value(9))
                .andExpect(jsonPath("$[0].outcome").value("SUCCESS"));
    }

    @Test
    void deletesGithubAutomationRuleWithinProject() throws Exception {
        mockMvc.perform(delete("/api/projects/41/automations/github/9"))
                .andExpect(status().isNoContent());

        verify(githubAutomationService).deleteRule(41L, 9L);
    }

    private GithubAutomationRuleResponseDTO response() {
        return new GithubAutomationRuleResponseDTO(
                9L,
                41L,
                GithubTrigger.PR_MERGED,
                GithubAction.SEND_NOTIFICATION,
                                true,
                Map.of("message", "Merged"));
    }
}

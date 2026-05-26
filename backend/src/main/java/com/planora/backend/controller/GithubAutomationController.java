package com.planora.backend.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.planora.backend.dto.GithubAutomationRuleRequestDTO;
import com.planora.backend.dto.GithubAutomationRuleResponseDTO;
import com.planora.backend.service.GithubAutomationService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/projects/{projectId}/automations/github")
@RequiredArgsConstructor
public class GithubAutomationController {

    private final GithubAutomationService githubAutomationService;

    @GetMapping
    public ResponseEntity<List<GithubAutomationRuleResponseDTO>> getRules(
            @PathVariable Long projectId) {
        return ResponseEntity.ok(githubAutomationService.getRulesForProject(projectId));
    }

    @PostMapping
    public ResponseEntity<GithubAutomationRuleResponseDTO> createRule(
            @PathVariable Long projectId,
            @Valid @RequestBody GithubAutomationRuleRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(githubAutomationService.createRule(projectId, request));
    }

    @DeleteMapping("/{ruleId}")
    public ResponseEntity<Void> deleteRule(
            @PathVariable Long projectId,
            @PathVariable Long ruleId) {
        githubAutomationService.deleteRule(projectId, ruleId);
        return ResponseEntity.noContent().build();
    }
}

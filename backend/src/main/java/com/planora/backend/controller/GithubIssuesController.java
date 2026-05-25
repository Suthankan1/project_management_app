package com.planora.backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.exception.GithubAuthenticationException;
import com.planora.backend.model.User;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.repository.UserRepository;
import com.planora.backend.service.GithubIssuesSyncService;

import jakarta.validation.constraints.Pattern;

@Validated
@RestController
@RequestMapping("/api/github")
public class GithubIssuesController {

    @Autowired
    private GithubIssuesSyncService githubIssuesSyncService;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/issues")
    public ResponseEntity<List<GithubIssueDTO>> getIssues(
            @RequestParam String repoFullName,
            @RequestParam(defaultValue = "all")
            @Pattern(regexp = "open|closed|all", message = "state must be open, closed, or all")
            String state,
            @RequestParam(required = false) String label,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        if (currentUser == null) {
            throw new GithubAuthenticationException("Authentication is required");
        }

        User user = userRepository.findById(currentUser.getUserId())
                .orElseThrow(() -> new GithubAuthenticationException("Authenticated user not found"));

        String accessToken = user.getGithubAccessToken();
        if (accessToken == null || accessToken.isBlank()) {
            throw new GithubAuthenticationException("GitHub account is not connected");
        }

        List<GithubIssueDTO> issues = githubIssuesSyncService.syncIssues(repoFullName, accessToken);
        List<GithubIssueDTO> filteredIssues = issues.stream()
                .filter(issue -> "all".equals(state) || state.equalsIgnoreCase(issue.getState()))
                .filter(issue -> label == null || label.isBlank() || hasLabel(issue, label))
                .toList();

        return ResponseEntity.ok(filteredIssues);
    }

    private boolean hasLabel(GithubIssueDTO issue, String label) {
        return issue.getLabels() != null && issue.getLabels().stream()
                .anyMatch(issueLabel -> issueLabel.getName() != null
                        && issueLabel.getName().equalsIgnoreCase(label));
    }
}

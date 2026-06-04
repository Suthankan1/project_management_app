package com.planora.backend.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.planora.backend.dto.GitHubRepositoryDTO;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.GitHubIntegrationService;
import com.planora.backend.service.GithubTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
public class GitHubController {

    private final GitHubIntegrationService gitHubIntegrationService;
    private final GithubTokenService githubTokenService;

    @GetMapping("/repositories")
    public ResponseEntity<List<GitHubRepositoryDTO>> getRepositories(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = githubTokenService.getToken(currentUser.getUserId());
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(gitHubIntegrationService.fetchUserRepositories(token));
    }

    @PostMapping("/token")
    public ResponseEntity<?> exchangeToken(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Unauthorized"));
        }
        String code = body.get("code");
        if (code == null || code.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No authorization code provided"));
        }

        try {
            gitHubIntegrationService.exchangeAndSaveToken(currentUser.getUserId(), currentUser.getUsername(), code);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/revoke")
    public ResponseEntity<?> revokeToken(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            gitHubIntegrationService.revokeToken(currentUser.getUserId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user")
    public ResponseEntity<JsonNode> getGitHubUser(@AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = githubTokenService.getToken(currentUser.getUserId());
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(gitHubIntegrationService.fetchGitHubUser(token));
    }

    @GetMapping("/pull-requests")
    public ResponseEntity<JsonNode> getPullRequests(
            @RequestParam String owner,
            @RequestParam String repo,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = githubTokenService.getToken(currentUser.getUserId());
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(gitHubIntegrationService.fetchPullRequests(owner, repo, token));
    }

    @GetMapping("/pull-requests/{prNumber}")
    public ResponseEntity<JsonNode> getPullRequest(
            @PathVariable int prNumber,
            @RequestParam String owner,
            @RequestParam String repo,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = githubTokenService.getToken(currentUser.getUserId());
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(gitHubIntegrationService.fetchPullRequest(owner, repo, prNumber, token));
    }

    @GetMapping("/commits")
    public ResponseEntity<JsonNode> getCommits(
            @RequestParam String owner,
            @RequestParam String repo,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        String token = githubTokenService.getToken(currentUser.getUserId());
        if (token == null || token.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        return ResponseEntity.ok(gitHubIntegrationService.fetchCommits(owner, repo, token));
    }
}
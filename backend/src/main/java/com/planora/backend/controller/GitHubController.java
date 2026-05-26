package com.planora.backend.controller;

import com.planora.backend.dto.GitHubRepositoryDTO;
import com.planora.backend.service.GitHubIntegrationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/github")
public class GitHubController {

    @Autowired
    private GitHubIntegrationService gitHubIntegrationService;

    /**
     * Returns repositories visible to the provided GitHub token.
     *
     * The frontend repo picker calls this endpoint with the token stored in
     * the browser session/local storage and maps the response directly.
     */
    @GetMapping("/repositories")
    public ResponseEntity<List<GitHubRepositoryDTO>> getRepositories(
            @RequestHeader(value = "X-GitHub-Token", required = false) String githubToken) {
        return ResponseEntity.ok(gitHubIntegrationService.fetchUserRepositories(githubToken));
    }
}
package com.planora.backend.controller;

import com.planora.backend.dto.GithubLinkRequestDTO;
import com.planora.backend.dto.GithubRepositoryDTO;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.GithubIntegrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
public class GithubIntegrationController {

    private final GithubIntegrationService integrationService;

    @PostMapping("/link")
    public ResponseEntity<GithubRepositoryDTO> linkRepository(
            @Valid @RequestBody GithubLinkRequestDTO request,
            @AuthenticationPrincipal UserPrincipal principal) {

        GithubRepositoryDTO result = integrationService.linkRepository(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @DeleteMapping("/link/{integrationId}")
    public ResponseEntity<Void> unlinkRepository(
            @PathVariable Long integrationId,
            @RequestParam Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {

        integrationService.unlinkRepository(integrationId, projectId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/project/{projectId}/repos")
    public ResponseEntity<List<GithubRepositoryDTO>> getLinkedRepositories(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {

        List<GithubRepositoryDTO> repos = integrationService.getLinkedRepositories(projectId);
        return ResponseEntity.ok(repos);
    }
}

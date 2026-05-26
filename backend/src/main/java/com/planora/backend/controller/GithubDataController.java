package com.planora.backend.controller;

import com.planora.backend.dto.*;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/github/project/{projectId}")
@RequiredArgsConstructor
public class GithubDataController {

    private final GithubPullRequestService pullRequestService;
    private final GithubCommitService commitService;
    private final GithubIssueService issueService;
    private final GithubSyncService syncService;

    @GetMapping("/pull-requests")
    public ResponseEntity<Page<GithubPrDTO>> getPullRequests(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "all") String state,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        Page<GithubPrDTO> result = pullRequestService.getPullRequests(projectId, state, page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/commits")
    public ResponseEntity<Page<GithubCommitDTO>> getCommits(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        Page<GithubCommitDTO> result = commitService.getCommits(projectId, page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/issues")
    public ResponseEntity<Page<GithubIssueDTO>> getIssues(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "open") String state,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserPrincipal principal) {

        Page<GithubIssueDTO> result = issueService.getIssues(projectId, state, page, size);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/stats")
    public ResponseEntity<GithubStatsDTO> getStats(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {

        GithubStatsDTO stats = syncService.getStats(projectId);
        return ResponseEntity.ok(stats);
    }

    @PostMapping("/sync")
    public ResponseEntity<Void> triggerSync(
            @PathVariable Long projectId,
            @AuthenticationPrincipal UserPrincipal principal) {

        syncService.syncProject(projectId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/issues")
    public ResponseEntity<GithubIssueDTO> createIssue(
            @PathVariable Long projectId,
            @Valid @RequestBody GithubCreateIssueRequestDTO request,
            @AuthenticationPrincipal UserPrincipal principal) {

        GithubIssueDTO created = issueService.createIssue(
            request.getIntegrationId(),
            request.getTitle(),
            request.getBody(),
            request.getLabels());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PostMapping("/pull-requests/{prId}/link-task")
    public ResponseEntity<Void> linkTaskToPr(
            @PathVariable Long projectId,
            @PathVariable Long prId,
            @Valid @RequestBody GithubLinkTaskRequestDTO request,
            @AuthenticationPrincipal UserPrincipal principal) {

        pullRequestService.linkTaskToPr(prId, request.getTaskId());
        return ResponseEntity.ok().build();
    }
}

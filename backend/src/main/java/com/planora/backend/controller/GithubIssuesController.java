package com.planora.backend.controller;

import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.planora.backend.dto.GithubCommentDTO;
import com.planora.backend.dto.GithubCommentSyncResponseDTO;
import com.planora.backend.dto.GithubIssueCreateRequestDTO;
import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.dto.GithubIssueImportRequestDTO;
import com.planora.backend.dto.GithubIssueImportResponseDTO;
import com.planora.backend.dto.GithubLabelDTO;
import com.planora.backend.exception.GithubAuthenticationException;
import com.planora.backend.model.User;
import com.planora.backend.model.UserPrincipal;
import com.planora.backend.repository.UserRepository;
import com.planora.backend.service.GithubIssueCommentSyncService;
import com.planora.backend.service.GithubIssueImportService;
import com.planora.backend.service.GithubIssuesSyncService;
import com.planora.backend.service.GithubNotificationService;
import com.planora.backend.service.GithubTokenService;
import com.planora.backend.service.TaskService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;

import lombok.RequiredArgsConstructor;

@Validated
@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
public class GithubIssuesController {

    private final GithubIssuesSyncService githubIssuesSyncService;
    private final GithubTokenService githubTokenService;

    private final UserRepository userRepository;

    private final GithubIssueImportService githubIssueImportService;

    private final GithubIssueCommentSyncService githubIssueCommentSyncService;

    private final GithubNotificationService githubNotificationService;

    private final TaskService taskService;

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

        String accessToken = githubTokenService.getToken(user.getUserId());
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

    @PostMapping("/issues/import")
    public ResponseEntity<GithubIssueImportResponseDTO> importIssues(
            @Valid @RequestBody GithubIssueImportRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(githubIssueImportService.importIssues(
                request, getCurrentUser(currentUser)));
    }

    @PostMapping("/issues/create")
    public ResponseEntity<GithubIssueDTO> createIssue(
            @Valid @RequestBody GithubIssueCreateRequestDTO request,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        User user = getCurrentUser(currentUser);
        String accessToken = githubTokenService.getToken(user.getUserId());
        if (accessToken == null || accessToken.isBlank()) {
            throw new GithubAuthenticationException("GitHub account is not connected");
        }
        GithubIssueDTO createdIssue = githubIssuesSyncService.createIssue(request, accessToken);
        Integer issueNumber = createdIssue.getNumber();
        if (request.getTaskId() != null && issueNumber != null) {
            taskService.linkGithubIssue(
                    request.getTaskId(),
                    issueNumber.longValue(),
                    request.getRepoFullName(),
                    currentUser.getUserId());
        }
        githubNotificationService.notifyIssueEvent(
            request.getRepoFullName(),
            issueNumber == null ? 0 : issueNumber,
            createdIssue.getTitle(),
            "opened",
            resolveActorLogin(user),
            createdIssue.getBody(),
            extractLabelNames(createdIssue));
        return ResponseEntity.status(HttpStatus.CREATED).body(createdIssue);
    }

    @GetMapping("/issues/{owner}/{repo}/labels")
    public ResponseEntity<List<GithubLabelDTO>> getLabels(
            @PathVariable String owner,
            @PathVariable String repo,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        User user = getCurrentUser(currentUser);
        String accessToken = githubTokenService.getToken(user.getUserId());
        if (accessToken == null || accessToken.isBlank()) {
            throw new GithubAuthenticationException("GitHub account is not connected");
        }
        return ResponseEntity.ok(githubIssuesSyncService.syncLabels(owner + "/" + repo, accessToken));
    }

    @GetMapping("/issues/{owner}/{repo}/{issueNumber}/comments")
    public ResponseEntity<List<GithubCommentDTO>> getIssueComments(
            @PathVariable String owner,
            @PathVariable String repo,
            @PathVariable int issueNumber,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        User user = getCurrentUser(currentUser);
        String accessToken = githubTokenService.getToken(user.getUserId());
        if (accessToken == null || accessToken.isBlank()) {
            throw new GithubAuthenticationException("GitHub account is not connected");
        }
        return ResponseEntity.ok(githubIssuesSyncService.fetchIssueComments(
                owner + "/" + repo, issueNumber, accessToken));
    }

    @PostMapping("/issues/{issueNumber}/sync-comments")
    public ResponseEntity<GithubCommentSyncResponseDTO> syncIssueComments(
            @PathVariable int issueNumber,
            @RequestParam Long projectId,
            @AuthenticationPrincipal UserPrincipal currentUser
    ) {
        return ResponseEntity.ok(githubIssueCommentSyncService.syncComments(
                projectId, issueNumber, getCurrentUser(currentUser)));
    }

    private boolean hasLabel(GithubIssueDTO issue, String label) {
        return issue.getLabels() != null && issue.getLabels().stream()
                .anyMatch(issueLabel -> issueLabel.getName() != null
                        && issueLabel.getName().equalsIgnoreCase(label));
    }

    private User getCurrentUser(UserPrincipal currentUser) {
        if (currentUser == null) {
            throw new GithubAuthenticationException("Authentication is required");
        }
        return userRepository.findById(currentUser.getUserId())
                .orElseThrow(() -> new GithubAuthenticationException("Authenticated user not found"));
    }

    private String resolveActorLogin(User user) {
        String githubUsername = user.getGithubUsername();
        if (githubUsername != null && !githubUsername.isBlank()) {
            return githubUsername;
        }
        return Objects.toString(user.getUsername(), "");
    }

    private List<String> extractLabelNames(GithubIssueDTO issue) {
        if (issue.getLabels() == null) {
            return List.of();
        }
        return issue.getLabels().stream()
                .map(GithubLabelDTO::getName)
                .filter(Objects::nonNull)
                .filter(name -> !name.isBlank())
                .collect(Collectors.toList());
    }
}

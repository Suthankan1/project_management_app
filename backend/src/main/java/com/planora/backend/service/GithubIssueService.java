package com.planora.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.planora.backend.dto.GithubIssueDTO;
import com.planora.backend.exception.ResourceNotFoundException;
import com.planora.backend.model.GithubIntegration;
import com.planora.backend.model.GithubIssue;
import com.planora.backend.repository.GithubIntegrationRepository;
import com.planora.backend.repository.GithubIssueRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubIssueService {

    private final GithubApiClient githubApiClient;
    private final GithubTokenService githubTokenService;
    private final GithubIntegrationRepository integrationRepository;
    private final GithubIssueRepository issueRepository;

    @Transactional(readOnly = true)
    public Page<GithubIssueDTO> getIssues(Long projectId, String state, int page, int size) {
        List<Long> ids = resolveIntegrationIds(projectId);
        if (ids.isEmpty()) return Page.empty();

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "githubCreatedAt"));
        Page<GithubIssue> issues = "all".equalsIgnoreCase(state)
            ? issueRepository.findByIntegrationIdIn(ids, pageRequest)
            : issueRepository.findByIntegrationIdInAndState(ids, state.toLowerCase(), pageRequest);

        return issues.map(this::toDTO);
    }

    @Transactional
    public void syncIssues(GithubIntegration integration) {
        String token = githubTokenService.resolveToken(integration);
        String repo = integration.getRepositoryFullName();
        log.info("Syncing issues for {}", repo);

        List<JsonNode> nodes = githubApiClient.fetchIssues(repo, token, "all", 1, 100);
        for (JsonNode node : nodes) {
            // GitHub issues endpoint also returns PRs; skip them
            if (!node.path("pull_request").isMissingNode()) continue;
            upsertIssue(integration, node);
        }

        log.info("Issue sync complete for {}", repo);
    }

    @Transactional
    public GithubIssueDTO createIssue(Long integrationId, String title, String body, List<String> labels) {
        GithubIntegration integration = integrationRepository.findById(integrationId)
            .orElseThrow(() -> new ResourceNotFoundException("Integration not found: " + integrationId));

        String token = githubTokenService.resolveToken(integration);
        JsonNode created = githubApiClient.createIssue(
            integration.getRepositoryFullName(), token, title, body, labels);

        upsertIssue(integration, created);
        int issueNumber = created.path("number").asInt();

        return issueRepository.findByIntegrationIdAndGithubIssueNumber(integrationId, issueNumber)
            .map(this::toDTO)
            .orElseThrow(() -> new RuntimeException("Issue created on GitHub but not saved locally"));
    }

    @Transactional
    public void upsertIssue(GithubIntegration integration, JsonNode node) {
        int issueNumber = node.path("number").asInt();
        Optional<GithubIssue> existing = issueRepository
            .findByIntegrationIdAndGithubIssueNumber(integration.getId(), issueNumber);

        GithubIssue issue = existing.orElse(new GithubIssue());
        issue.setIntegration(integration);
        issue.setGithubIssueNumber(issueNumber);
        issue.setTitle(truncate(node.path("title").asText(""), 500));
        issue.setBody(node.path("body").asText(null));
        issue.setState(node.path("state").asText("open"));
        issue.setAuthorLogin(node.path("user").path("login").asText(null));
        issue.setGithubUrl(node.path("html_url").asText(null));
        issue.setGithubCreatedAt(parseDateTime(node.path("created_at").asText(null)));
        issue.setGithubUpdatedAt(parseDateTime(node.path("updated_at").asText(null)));
        issue.setSyncedAt(LocalDateTime.now());

        List<String> labelNames = new ArrayList<>();
        node.path("labels").forEach(label -> labelNames.add(label.path("name").asText()));
        issue.setLabelNames(String.join(",", labelNames));

        issueRepository.save(issue);
    }

    @Transactional(readOnly = true)
    public List<GithubIssueDTO> getIssuesForTask(Long taskId) {
        return issueRepository.findByLinkedTaskId(taskId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private List<Long> resolveIntegrationIds(Long projectId) {
        return integrationRepository.findByProjectIdAndActiveTrue(projectId)
            .stream().map(GithubIntegration::getId).collect(Collectors.toList());
    }

    private GithubIssueDTO toDTO(GithubIssue issue) {
        List<String> labels = (issue.getLabelNames() != null && !issue.getLabelNames().isBlank())
            ? List.of(issue.getLabelNames().split(","))
            : List.of();
        return GithubIssueDTO.builder()
            .id(issue.getId())
            .integrationId(issue.getIntegration().getId())
            .githubIssueNumber(issue.getGithubIssueNumber())
            .title(issue.getTitle())
            .body(issue.getBody())
            .state(issue.getState())
            .authorLogin(issue.getAuthorLogin())
            .githubUrl(issue.getGithubUrl())
            .labels(labels)
            .linkedTaskId(issue.getLinkedTaskId())
            .githubCreatedAt(issue.getGithubCreatedAt())
            .githubUpdatedAt(issue.getGithubUpdatedAt())
            .build();
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        try { return OffsetDateTime.parse(value).toLocalDateTime(); } catch (Exception e) { return null; }
    }

    private String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}

package com.planora.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.planora.backend.dto.GithubCommitDTO;
import com.planora.backend.model.GithubCommit;
import com.planora.backend.model.GithubIntegration;
import com.planora.backend.repository.GithubCommitRepository;
import com.planora.backend.repository.GithubIntegrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubCommitService {

    private final GithubApiClient githubApiClient;
    private final GithubTokenService githubTokenService;
    private final GithubIntegrationRepository integrationRepository;
    private final GithubCommitRepository commitRepository;

    private static final Pattern TASK_REF_PATTERN = Pattern.compile("#(\\d+)");

    @Transactional(readOnly = true)
    public Page<GithubCommitDTO> getCommits(Long projectId, int page, int size) {
        List<Long> ids = resolveIntegrationIds(projectId);
        if (ids.isEmpty()) return Page.empty();

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "authoredAt"));
        return commitRepository.findByIntegrationIdIn(ids, pageRequest).map(this::toDTO);
    }

    @Transactional
    public void syncCommits(GithubIntegration integration) {
        String token = githubTokenService.resolveToken(integration);
        String repo = integration.getRepositoryFullName();
        log.info("Syncing commits for {}", repo);

        List<JsonNode> commits = githubApiClient.fetchCommits(repo, token, 1, 100);
        commits.forEach(node -> upsertCommit(integration, node));

        log.info("Commit sync complete for {} ({} fetched)", repo, commits.size());
    }

    @Transactional
    public void upsertCommit(GithubIntegration integration, JsonNode node) {
        String sha = node.path("sha").asText();
        if (sha.isBlank()) return;

        Optional<GithubCommit> existing = commitRepository.findByIntegrationIdAndSha(integration.getId(), sha);
        GithubCommit commit = existing.orElse(new GithubCommit());
        commit.setIntegration(integration);
        commit.setSha(sha);

        JsonNode commitNode = node.path("commit");
        commit.setMessage(commitNode.path("message").asText(null));
        commit.setAuthorName(commitNode.path("author").path("name").asText(null));
        commit.setAuthorEmail(commitNode.path("author").path("email").asText(null));
        commit.setAuthoredAt(parseDateTime(commitNode.path("author").path("date").asText(null)));
        commit.setCommitUrl(node.path("html_url").asText(null));
        commit.setSyncedAt(LocalDateTime.now());

        if (commit.getLinkedTaskId() == null) {
            commit.setLinkedTaskId(detectTaskRef(commit.getMessage()));
        }
        commitRepository.save(commit);
    }

    @Transactional(readOnly = true)
    public List<GithubCommitDTO> getCommitsForTask(Long taskId) {
        return commitRepository.findByLinkedTaskId(taskId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private List<Long> resolveIntegrationIds(Long projectId) {
        return integrationRepository.findByProjectIdAndActiveTrue(projectId)
            .stream().map(GithubIntegration::getId).collect(Collectors.toList());
    }

    private Long detectTaskRef(String message) {
        if (message == null) return null;
        Matcher matcher = TASK_REF_PATTERN.matcher(message);
        if (matcher.find()) {
            try { return Long.parseLong(matcher.group(1)); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private GithubCommitDTO toDTO(GithubCommit commit) {
        String sha = commit.getSha();
        return GithubCommitDTO.builder()
            .id(commit.getId())
            .integrationId(commit.getIntegration().getId())
            .sha(sha)
            .shortSha(sha != null && sha.length() >= 7 ? sha.substring(0, 7) : sha)
            .message(commit.getMessage())
            .authorName(commit.getAuthorName())
            .authorEmail(commit.getAuthorEmail())
            .commitUrl(commit.getCommitUrl())
            .linkedTaskId(commit.getLinkedTaskId())
            .authoredAt(commit.getAuthoredAt())
            .build();
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        try { return OffsetDateTime.parse(value).toLocalDateTime(); } catch (Exception e) { return null; }
    }
}

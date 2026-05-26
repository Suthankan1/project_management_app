package com.planora.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.planora.backend.dto.GithubPrDTO;
import com.planora.backend.model.GithubIntegration;
import com.planora.backend.model.GithubPullRequest;
import com.planora.backend.repository.GithubIntegrationRepository;
import com.planora.backend.repository.GithubPullRequestRepository;
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
public class GithubPullRequestService {

    private final GithubApiClient githubApiClient;
    private final GithubTokenService githubTokenService;
    private final GithubIntegrationRepository integrationRepository;
    private final GithubPullRequestRepository pullRequestRepository;

    private static final Pattern TASK_REF_PATTERN = Pattern.compile("#(\\d+)", Pattern.CASE_INSENSITIVE);

    @Transactional(readOnly = true)
    public Page<GithubPrDTO> getPullRequests(Long projectId, String state, int page, int size) {
        List<Long> ids = resolveIntegrationIds(projectId);
        if (ids.isEmpty()) return Page.empty();

        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "githubCreatedAt"));
        Page<GithubPullRequest> prs = "all".equalsIgnoreCase(state)
            ? pullRequestRepository.findByIntegrationIdIn(ids, pageRequest)
            : pullRequestRepository.findByIntegrationIdInAndState(ids, state.toLowerCase(), pageRequest);

        return prs.map(this::toDTO);
    }

    @Transactional
    public void syncPullRequests(GithubIntegration integration) {
        String token = githubTokenService.resolveToken(integration);
        String repo = integration.getRepositoryFullName();
        log.info("Syncing pull requests for {}", repo);

        int page = 1;
        int fetched;
        do {
            List<JsonNode> nodes = githubApiClient.fetchPullRequests(repo, token, "all", page, 100);
            fetched = nodes.size();
            nodes.forEach(node -> upsertPullRequest(integration, node));
            page++;
        } while (fetched == 100);

        log.info("Pull request sync complete for {}", repo);
    }

    @Transactional
    public void upsertPullRequest(GithubIntegration integration, JsonNode node) {
        int prNumber = node.path("number").asInt();
        Optional<GithubPullRequest> existing = pullRequestRepository
            .findByIntegrationIdAndGithubPrNumber(integration.getId(), prNumber);

        GithubPullRequest pr = existing.orElse(new GithubPullRequest());
        pr.setIntegration(integration);
        pr.setGithubPrNumber(prNumber);
        pr.setTitle(truncate(node.path("title").asText(""), 500));
        pr.setBody(node.path("body").asText(null));
        pr.setState(resolvePrState(node));
        pr.setAuthorLogin(node.path("user").path("login").asText(null));
        pr.setHeadBranch(node.path("head").path("ref").asText(null));
        pr.setBaseBranch(node.path("base").path("ref").asText(null));
        pr.setGithubUrl(node.path("html_url").asText(null));
        pr.setGithubCreatedAt(parseDateTime(node.path("created_at").asText(null)));
        pr.setGithubUpdatedAt(parseDateTime(node.path("updated_at").asText(null)));
        pr.setGithubMergedAt(parseDateTime(node.path("merged_at").asText(null)));
        pr.setSyncedAt(LocalDateTime.now());

        if (pr.getLinkedTaskId() == null) {
            pr.setLinkedTaskId(detectTaskRef(pr.getTitle() + " " + pr.getHeadBranch()));
        }
        pullRequestRepository.save(pr);
    }

    @Transactional
    public void linkTaskToPr(Long prId, Long taskId) {
        pullRequestRepository.findById(prId).ifPresent(pr -> {
            pr.setLinkedTaskId(taskId);
            pullRequestRepository.save(pr);
        });
    }

    @Transactional(readOnly = true)
    public List<GithubPrDTO> getPrsForTask(Long taskId) {
        return pullRequestRepository.findByLinkedTaskId(taskId)
            .stream().map(this::toDTO).collect(Collectors.toList());
    }

    private List<Long> resolveIntegrationIds(Long projectId) {
        return integrationRepository.findByProjectIdAndActiveTrue(projectId)
            .stream().map(GithubIntegration::getId).collect(Collectors.toList());
    }

    private String resolvePrState(JsonNode node) {
        String state = node.path("state").asText("open");
        JsonNode mergedAt = node.path("merged_at");
        if ("closed".equals(state) && !mergedAt.isNull() && !mergedAt.isMissingNode()) {
            return "merged";
        }
        return state;
    }

    private Long detectTaskRef(String text) {
        if (text == null) return null;
        Matcher matcher = TASK_REF_PATTERN.matcher(text);
        if (matcher.find()) {
            try { return Long.parseLong(matcher.group(1)); } catch (NumberFormatException e) { return null; }
        }
        return null;
    }

    private GithubPrDTO toDTO(GithubPullRequest pr) {
        return GithubPrDTO.builder()
            .id(pr.getId())
            .integrationId(pr.getIntegration().getId())
            .githubPrNumber(pr.getGithubPrNumber())
            .title(pr.getTitle())
            .body(pr.getBody())
            .state(pr.getState())
            .authorLogin(pr.getAuthorLogin())
            .headBranch(pr.getHeadBranch())
            .baseBranch(pr.getBaseBranch())
            .githubUrl(pr.getGithubUrl())
            .linkedTaskId(pr.getLinkedTaskId())
            .githubCreatedAt(pr.getGithubCreatedAt())
            .githubUpdatedAt(pr.getGithubUpdatedAt())
            .mergedAt(pr.getGithubMergedAt())
            .build();
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank() || "null".equals(value)) return null;
        try { return OffsetDateTime.parse(value).toLocalDateTime(); } catch (Exception e) { return null; }
    }

    private String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() > max ? value.substring(0, max) : value;
    }
}

package com.planora.backend.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.model.GithubIntegration;
import com.planora.backend.repository.GithubIntegrationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GithubWebhookService {

    private final GithubIntegrationRepository integrationRepository;
    private final GithubPullRequestService pullRequestService;
    private final GithubCommitService commitService;
    private final GithubIssueService issueService;
    private final ObjectMapper objectMapper;

    @Value("${github.webhook.secret:}")
    private String webhookSecret;

    public boolean verifySignature(String payload, String signature) {
        if (webhookSecret == null || webhookSecret.isBlank()) {
            log.warn("GitHub webhook secret not configured — skipping signature validation");
            return true;
        }
        if (signature == null || !signature.startsWith("sha256=")) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] computed = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = "sha256=" + HexFormat.of().formatHex(computed);
            return expected.equals(signature);
        } catch (Exception e) {
            log.error("Webhook signature verification failed", e);
            return false;
        }
    }

    public void handleEvent(String eventType, String payload) {
        try {
            JsonNode root = objectMapper.readTree(payload);
            switch (eventType) {
                case "pull_request" -> handlePullRequestEvent(root);
                case "push"         -> handlePushEvent(root);
                case "issues"       -> handleIssuesEvent(root);
                case "check_run"    -> log.debug("check_run event received — no action configured");
                case "release"      -> log.debug("release event received — no action configured");
                default             -> log.debug("Unhandled GitHub webhook event type: {}", eventType);
            }
        } catch (Exception e) {
            log.error("Error processing GitHub webhook event '{}': {}", eventType, e.getMessage(), e);
        }
    }

    private void handlePullRequestEvent(JsonNode root) {
        String repoFullName = root.path("repository").path("full_name").asText();
        JsonNode prNode = root.path("pull_request");
        String action = root.path("action").asText();
        log.info("pull_request '{}' on {}", action, repoFullName);

        resolveIntegration(repoFullName).ifPresent(integration ->
            pullRequestService.upsertPullRequest(integration, prNode));
    }

    private void handlePushEvent(JsonNode root) {
        String repoFullName = root.path("repository").path("full_name").asText();
        log.info("push event on {}", repoFullName);

        resolveIntegration(repoFullName).ifPresent(integration -> {
            root.path("commits").forEach(commitNode ->
                commitService.upsertCommit(integration, wrapCommitNode(commitNode)));
        });
    }

    private void handleIssuesEvent(JsonNode root) {
        String repoFullName = root.path("repository").path("full_name").asText();
        JsonNode issueNode = root.path("issue");
        String action = root.path("action").asText();
        log.info("issues '{}' on {}", action, repoFullName);

        resolveIntegration(repoFullName).ifPresent(integration ->
            issueService.upsertIssue(integration, issueNode));
    }

    private Optional<GithubIntegration> resolveIntegration(String repoFullName) {
        List<GithubIntegration> integrations = integrationRepository.findAllByActiveTrue();
        return integrations.stream()
            .filter(i -> repoFullName.equals(i.getRepositoryFullName()))
            .findFirst();
    }

    /**
     * Push event commit nodes use a different shape than the commits API.
     * Wraps push commit JSON to match the shape expected by GithubCommitService.
     */
    private JsonNode wrapCommitNode(JsonNode pushCommit) {
        try {
            String sha = pushCommit.path("id").asText();
            String message = pushCommit.path("message").asText();
            String authorName = pushCommit.path("author").path("name").asText();
            String authorEmail = pushCommit.path("author").path("email").asText();
            String timestamp = pushCommit.path("timestamp").asText();
            String htmlUrl = pushCommit.path("url").asText();

            String wrapped = String.format(
                "{\"sha\":\"%s\",\"html_url\":\"%s\",\"commit\":{\"message\":\"%s\"," +
                "\"author\":{\"name\":\"%s\",\"email\":\"%s\",\"date\":\"%s\"}}}",
                sha, htmlUrl,
                message.replace("\"", "\\\"").replace("\n", "\\n"),
                authorName.replace("\"", "\\\""),
                authorEmail,
                timestamp);
            return objectMapper.readTree(wrapped);
        } catch (Exception e) {
            log.warn("Failed to wrap push commit node: {}", e.getMessage());
            return pushCommit;
        }
    }
}

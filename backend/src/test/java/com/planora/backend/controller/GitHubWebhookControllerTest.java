package com.planora.backend.controller;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.planora.backend.service.CiStatusResolver;
import com.planora.backend.service.GithubNotificationService;
import com.planora.backend.service.TaskGithubService;

class GitHubWebhookControllerTest {

    private static final String SECRET = "webhook-test-secret";
    private static final String OPENED_PR_BODY = """
            {
              "action":"opened",
              "repository":{"full_name":"planora/app"},
              "pull_request":{"number":17,"title":"Improve sync","user":{"login":"octocat"}}
            }
            """;

    private MockMvc mockMvc;
    private GithubNotificationService githubNotificationService;

    @BeforeEach
    void setUp() {
        GitHubWebhookController controller = new GitHubWebhookController();
        githubNotificationService = mock(GithubNotificationService.class);
        ReflectionTestUtils.setField(controller, "webhookSecret", SECRET);
        ReflectionTestUtils.setField(controller, "objectMapper", new ObjectMapper());
        ReflectionTestUtils.setField(controller, "githubNotificationService", githubNotificationService);
        ReflectionTestUtils.setField(controller, "ciStatusResolver", mock(CiStatusResolver.class));
        ReflectionTestUtils.setField(controller, "taskGithubService", mock(TaskGithubService.class));
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void singularWebhookRoute_dispatchesSignedOpenedPullRequest() throws Exception {
        mockMvc.perform(post("/api/github/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "pull_request")
                        .header("X-Hub-Signature-256", signature(OPENED_PR_BODY))
                        .content(OPENED_PR_BODY))
                .andExpect(status().isOk())
                .andExpect(content().string("processed"));

        verify(githubNotificationService).notifyPROpened("planora/app", 17, "Improve sync", "octocat");
    }

    @Test
    void webhook_rejectsInvalidSignatureBeforeDispatch() throws Exception {
        mockMvc.perform(post("/api/github/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "pull_request")
                        .header("X-Hub-Signature-256", "sha256=deadbeef")
                        .content(OPENED_PR_BODY))
                .andExpect(status().isUnauthorized());

        verify(githubNotificationService, never()).notifyPROpened(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyInt(),
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString());
    }

    @Test
    void webhook_rejectsDeliveriesWhenSecretIsNotConfigured() throws Exception {
        GitHubWebhookController controller = new GitHubWebhookController();
        ReflectionTestUtils.setField(controller, "webhookSecret", "");
        ReflectionTestUtils.setField(controller, "objectMapper", new ObjectMapper());
        ReflectionTestUtils.setField(controller, "githubNotificationService", githubNotificationService);
        ReflectionTestUtils.setField(controller, "ciStatusResolver", mock(CiStatusResolver.class));
        ReflectionTestUtils.setField(controller, "taskGithubService", mock(TaskGithubService.class));
        MockMvc unconfiguredMockMvc = MockMvcBuilders.standaloneSetup(controller).build();

        unconfiguredMockMvc.perform(post("/api/github/webhook")
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-GitHub-Event", "pull_request")
                        .header("X-Hub-Signature-256", signature(OPENED_PR_BODY))
                        .content(OPENED_PR_BODY))
                .andExpect(status().isServiceUnavailable());
    }

    private String signature(String body) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return "sha256=" + HexFormat.of().formatHex(mac.doFinal(body.getBytes(StandardCharsets.UTF_8)));
    }
}

package com.planora.backend.controller;

import com.planora.backend.service.GithubWebhookService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@Slf4j
@RestController
@RequestMapping("/api/github")
@RequiredArgsConstructor
public class GithubWebhookController {

    private final GithubWebhookService webhookService;

    /**
     * Receives all GitHub webhook events.
     * This endpoint is public (no JWT required) — GitHub calls it directly.
     * Signature validation is performed inside GithubWebhookService.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestHeader(value = "X-GitHub-Event", defaultValue = "unknown") String eventType,
            @RequestHeader(value = "X-Hub-Signature-256", required = false) String signature,
            @RequestBody String payload) {

        if (!webhookService.verifySignature(payload, signature)) {
            log.warn("GitHub webhook signature validation failed for event: {}", eventType);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        log.info("Received GitHub webhook: {}", eventType);
        webhookService.handleEvent(eventType, payload);
        return ResponseEntity.ok().build();
    }
}

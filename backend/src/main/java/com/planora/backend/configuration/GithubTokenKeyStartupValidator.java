package com.planora.backend.configuration;

import java.util.Base64;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class GithubTokenKeyStartupValidator implements ApplicationRunner {

    @Value("${github.sync.enabled:true}")
    private boolean githubSyncEnabled;

    @Value("${github.token.encryption.key:}")
    private String encryptionKey;

    @Override
    public void run(ApplicationArguments args) {
        if (!githubSyncEnabled) {
            log.info("[Startup] GitHub integration is disabled (github.sync.enabled=false). Skipping token key validation.");
            return;
        }

        if (encryptionKey == null || encryptionKey.isBlank()) {
            throw new IllegalStateException(
                    "[STARTUP] github.token.encryption.key (GITHUB_TOKEN_ENCRYPTION_KEY) is not set, " +
                    "but GitHub integration is enabled. To disable GitHub features, set github.sync.enabled=false. " +
                    "Otherwise, configure a 256-bit encryption key.");
        }

        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(encryptionKey.getBytes());
        } catch (IllegalArgumentException e) {
            try {
                decoded = Base64.getUrlDecoder().decode(encryptionKey.getBytes());
            } catch (IllegalArgumentException ex) {
                throw new IllegalStateException(
                        "[STARTUP] GITHUB_TOKEN_ENCRYPTION_KEY is not a valid Base64 encoded string.", ex);
            }
        }

        int decodedBytes = decoded.length;
        if (decodedBytes != 32) {
            throw new IllegalStateException(
                    "[STARTUP] GITHUB_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (256 bits). " +
                    "Found: " + decodedBytes + " bytes.");
        }

        log.info("[Startup] GitHub token encryption key length: {} bytes — OK", decodedBytes);
    }
}

package com.planora.backend.configuration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class GithubTokenKeyStartupValidatorTest {

    @Test
    void run_whenGithubEnabledAndKeyValid_doesNotThrow() {
        GithubTokenKeyStartupValidator validator = new GithubTokenKeyStartupValidator();
        // A valid 32-byte key in standard base64 (43 'A's and one '=')
        String validKey = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
        ReflectionTestUtils.setField(validator, "githubSyncEnabled", true);
        ReflectionTestUtils.setField(validator, "encryptionKey", validKey);

        assertDoesNotThrow(() -> validator.run(null));
    }

    @Test
    void run_whenGithubEnabledAndKeyMissing_throwsException() {
        GithubTokenKeyStartupValidator validator = new GithubTokenKeyStartupValidator();
        ReflectionTestUtils.setField(validator, "githubSyncEnabled", true);
        ReflectionTestUtils.setField(validator, "encryptionKey", "");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> validator.run(null));
        assertTrue(ex.getMessage().contains("is not set"));
    }

    @Test
    void run_whenGithubEnabledAndKeyInvalidBase64_throwsException() {
        GithubTokenKeyStartupValidator validator = new GithubTokenKeyStartupValidator();
        ReflectionTestUtils.setField(validator, "githubSyncEnabled", true);
        ReflectionTestUtils.setField(validator, "encryptionKey", "not-base64-@@@!!!");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> validator.run(null));
        assertTrue(ex.getMessage().contains("is not a valid Base64 encoded string"));
    }

    @Test
    void run_whenGithubEnabledAndKeyInvalidLength_throwsException() {
        GithubTokenKeyStartupValidator validator = new GithubTokenKeyStartupValidator();
        // A key that is not 32 bytes (e.g. 16 bytes: 22 'A's and two '=')
        String shortKey = "AAAAAAAAAAAAAAAAAAAAAA==";
        ReflectionTestUtils.setField(validator, "githubSyncEnabled", true);
        ReflectionTestUtils.setField(validator, "encryptionKey", shortKey);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> validator.run(null));
        assertTrue(ex.getMessage().contains("must decode to exactly 32 bytes"));
    }

    @Test
    void run_whenGithubDisabledAndKeyMissing_doesNotThrow() {
        GithubTokenKeyStartupValidator validator = new GithubTokenKeyStartupValidator();
        ReflectionTestUtils.setField(validator, "githubSyncEnabled", false);
        ReflectionTestUtils.setField(validator, "encryptionKey", "");

        assertDoesNotThrow(() -> validator.run(null));
    }
}

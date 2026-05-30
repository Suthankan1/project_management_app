package com.planora.backend.service;

import com.planora.backend.model.GithubIntegration;
import com.planora.backend.model.User;
import com.planora.backend.repository.UserRepository;
import com.planora.backend.util.TokenEncryptionUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class GithubTokenService {

    @Autowired
    private UserRepository userRepository;

    @Value("${github.default.token:}")
    private String defaultToken;

    @Value("${github.token.encryption.key:}")
    private String encryptionKey;

    public String resolveToken(GithubIntegration integration) {
        if (integration != null && StringUtils.hasText(integration.getEncryptedAccessToken())) {
            return integration.getEncryptedAccessToken();
        }
        if (StringUtils.hasText(defaultToken)) {
            return defaultToken;
        }
        throw new IllegalStateException("No GitHub token configured for integration id="
            + (integration != null ? integration.getId() : "null"));
    }

    public boolean hasValidToken(GithubIntegration integration) {
        try {
            resolveToken(integration);
            return true;
        } catch (IllegalStateException e) {
            return false;
        }
    }

    @Transactional
    public void saveToken(Long userId, String token) {
        if (!StringUtils.hasText(encryptionKey)) {
            throw new IllegalStateException("GITHUB_TOKEN_ENCRYPTION_KEY is not configured");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        try {
            String encrypted = TokenEncryptionUtil.encrypt(token, encryptionKey);
            user.setGithubAccessToken(encrypted);
            userRepository.save(user);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt GitHub token for user " + userId, e);
        }
    }

    @Transactional(readOnly = true)
    public String getToken(Long userId) {
        if (!StringUtils.hasText(encryptionKey)) {
            throw new IllegalStateException("GITHUB_TOKEN_ENCRYPTION_KEY is not configured");
        }
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        String stored = user.getGithubAccessToken();
        if (!StringUtils.hasText(stored)) {
            return null;
        }
        try {
            return TokenEncryptionUtil.decrypt(stored, encryptionKey);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt GitHub token for user " + userId, e);
        }
    }
}

package com.planora.backend.service;

import com.planora.backend.model.GithubIntegration;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Slf4j
@Service
public class GithubTokenService {

    @Value("${github.default.token:}")
    private String defaultToken;

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
}

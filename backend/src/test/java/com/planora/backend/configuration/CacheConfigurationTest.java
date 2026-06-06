package com.planora.backend.configuration;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.test.context.ActiveProfiles;
import com.planora.backend.service.UserService;

@SpringBootTest
@ActiveProfiles("test")
class CacheConfigurationTest {

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private UserService userService;

    @Test
    void requiredCachesAreRegistered() {
        assertNotNull(cacheManager.getCache("users-by-identity"));
        assertNotNull(cacheManager.getCache("user-details"));
        assertNotNull(cacheManager.getCache("project-membership"));
        assertNotNull(cacheManager.getCache("project-team-id"));
        assertNotNull(cacheManager.getCache("team-member"));
        assertNotNull(cacheManager.getCache("github-issues"));
        assertNotNull(cacheManager.getCache("github-issue-comments"));
        assertNotNull(cacheManager.getCache("userPhotoUrls"));
    }

    @Test
    void generatePresignedUrl_withNullPhotoKey_doesNotThrowCacheException() {
        assertNull(userService.generatePresignedUrl(null));
    }
}

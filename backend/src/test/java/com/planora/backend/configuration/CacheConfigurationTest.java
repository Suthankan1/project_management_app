package com.planora.backend.configuration;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.test.context.ActiveProfiles;
import com.planora.backend.service.UserService;

@SpringBootTest
@ActiveProfiles("test")
class CacheConfigurationTest {

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private UserService userService;

    @Autowired
    private CacheErrorHandler cacheErrorHandler;

    @Test
    void requiredCachesAreRegistered() {
        assertNotNull(cacheManager.getCache("users-by-identity"));
        assertNotNull(cacheManager.getCache("user-details"));
        assertNotNull(cacheManager.getCache("project-membership"));
        assertNotNull(cacheManager.getCache("project-team-id"));
        assertNotNull(cacheManager.getCache("team-member"));
        assertNotNull(cacheManager.getCache("github-issues"));
        assertNotNull(cacheManager.getCache("github-issue-comments"));
        assertNotNull(cacheManager.getCache("userProfile"));
        assertNotNull(cacheManager.getCache("userPhotoUrls"));
        assertNotNull(cacheManager.getCache("project-recent"));
        assertNotNull(cacheManager.getCache("project-favorites"));
    }

    @Test
    void testProfileUsesCaffeineCacheManagerFallback() {
        org.junit.jupiter.api.Assertions.assertInstanceOf(CaffeineCacheManager.class, cacheManager);
    }

    @Test
    void cacheErrorHandler_failOpenDoesNotThrow() {
        Cache cache = cacheManager.getCache("userProfile");
        org.junit.jupiter.api.Assertions.assertDoesNotThrow(() ->
                cacheErrorHandler.handleCacheGetError(new RuntimeException("Redis down"), cache, "alice@example.com"));
    }

    @Test
    void generatePresignedUrl_withNullPhotoKey_doesNotThrowCacheException() {
        assertNull(userService.generatePresignedUrl(null));
    }
}

package com.planora.backend.configuration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import org.springframework.test.util.ReflectionTestUtils;

import com.fasterxml.jackson.databind.ObjectMapper;

class CacheConfigurationUnitTest {

    @Test
    void redisEnabledCacheManagerRegistersDashboardCachesBeforeSpringLifecycleCallbacks() {
        CacheConfiguration configuration = new CacheConfiguration();
        setCacheConfigurationFields(configuration);

        LettuceConnectionFactory redisConnectionFactory = new LettuceConnectionFactory("localhost", 6379);
        try {
            CacheManager cacheManager = configuration.cacheManager(redisConnectionFactory, new ObjectMapper());

            assertNotNull(cacheManager.getCache("project-recent"));
            assertNotNull(cacheManager.getCache("project-favorites"));
        } finally {
            redisConnectionFactory.destroy();
        }
    }

    @Test
    void projectTeamIdRedisCacheDeserializesSmallNumbersAsLong() {
        CacheConfiguration configuration = new CacheConfiguration();
        setCacheConfigurationFields(configuration);
        RedisCacheConfiguration cacheConfiguration = configuration.projectTeamIdRedisCacheConfiguration(
                RedisCacheConfiguration.defaultCacheConfig());

        Object cachedValue = cacheConfiguration.getValueSerializationPair()
                .read(ByteBuffer.wrap("5".getBytes(StandardCharsets.UTF_8)));

        assertInstanceOf(Long.class, cachedValue);
        assertEquals(5L, cachedValue);
    }

    private static void setCacheConfigurationFields(CacheConfiguration configuration) {
        ReflectionTestUtils.setField(configuration, "redisCacheEnabled", true);
        ReflectionTestUtils.setField(configuration, "redisCacheFailOpen", true);
        ReflectionTestUtils.setField(configuration, "projectMembershipTtl", "120s");
        ReflectionTestUtils.setField(configuration, "projectTeamIdTtl", "600s");
        ReflectionTestUtils.setField(configuration, "githubIssuesTtl", "300s");
        ReflectionTestUtils.setField(configuration, "githubIssueCommentsTtl", "300s");
        ReflectionTestUtils.setField(configuration, "userProfileTtl", "300s");
        ReflectionTestUtils.setField(configuration, "userPhotoUrlsTtl", "2700s");
        ReflectionTestUtils.setField(configuration, "projectRecentTtl", "60s");
        ReflectionTestUtils.setField(configuration, "projectFavoritesTtl", "60s");
    }
}

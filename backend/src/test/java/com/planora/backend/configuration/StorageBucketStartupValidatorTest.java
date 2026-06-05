package com.planora.backend.configuration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.test.util.ReflectionTestUtils;

class StorageBucketStartupValidatorTest {

    @Test
    void run_whenProductionProfileAndBucketMissing_failsFastWithEnvName() {
        StorageBucketStartupValidator validator = new StorageBucketStartupValidator(environmentWithProfiles("production"));
        setBuckets(validator, "", "docs-bucket", "chat-bucket", "tasks-bucket");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> validator.run(null));

        assertTrue(ex.getMessage().contains("Production object storage bucket configuration is incomplete"));
        assertTrue(ex.getMessage().contains("AWS_PROFILE_PHOTOS_BUCKET"));
        assertFalse(ex.getMessage().contains("AWS_DMS_BUCKET"));
    }

    @Test
    void run_whenProductionProfileAndBucketPlaceholder_failsFastWithEnvName() {
        StorageBucketStartupValidator validator = new StorageBucketStartupValidator(environmentWithProfiles("production"));
        setBuckets(validator, "your-profile-photos-bucket", "docs-bucket", "chat-bucket", "tasks-bucket");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> validator.run(null));

        assertTrue(ex.getMessage().contains("AWS_PROFILE_PHOTOS_BUCKET"));
    }

    @Test
    void run_whenProductionProfileAndBucketsConfigured_allowsStartup() {
        StorageBucketStartupValidator validator = new StorageBucketStartupValidator(environmentWithProfiles("prod"));
        setBuckets(validator, "profiles-bucket", "docs-bucket", "chat-bucket", "tasks-bucket");

        assertDoesNotThrow(() -> validator.run(null));
    }

    @Test
    void run_whenLocalProfileAndBucketsMissing_allowsStartup() {
        StorageBucketStartupValidator validator = new StorageBucketStartupValidator(environmentWithProfiles("dev"));
        setBuckets(validator, "", "", "", "");

        assertDoesNotThrow(() -> validator.run(null));
    }

    private MockEnvironment environmentWithProfiles(String... profiles) {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles(profiles);
        return environment;
    }

    private void setBuckets(
            StorageBucketStartupValidator validator,
            String profilePhotosBucket,
            String dmsBucket,
            String chatBucket,
            String taskStorageBucket) {
        ReflectionTestUtils.setField(validator, "profilePhotosBucket", profilePhotosBucket);
        ReflectionTestUtils.setField(validator, "dmsBucket", dmsBucket);
        ReflectionTestUtils.setField(validator, "chatBucket", chatBucket);
        ReflectionTestUtils.setField(validator, "taskStorageBucket", taskStorageBucket);
    }
}

package com.planora.backend.configuration;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
    "spring.jpa.hibernate.ddl-auto=validate",
    "spring.flyway.enabled=true",
    "app.flyway.repair-on-startup=false"
})
@ActiveProfiles("test")
@Testcontainers
class DatabaseMigrationSmokeTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("planora_test")
            .withUsername("test")
            .withPassword("test");

    @Test
    void migrateAndValidateSchema() {
        assertThat(postgres.isRunning()).isTrue();
    }
}

package com.planora.backend.configuration;

import com.planora.backend.BaseIntegrationIT;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class DatabaseMigrationSmokeIT extends BaseIntegrationIT {

    @Test
    void migrateAndValidateSchema() {
        assertThat(postgres.isRunning()).isTrue();
    }
}

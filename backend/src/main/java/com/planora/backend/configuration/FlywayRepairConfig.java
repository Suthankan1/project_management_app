package com.planora.backend.configuration;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Runs flyway.repair() before every migrate() so that checksum mismatches
 * caused by migration file edits never block application startup.
 * repair() only updates the stored checksum in flyway_schema_history —
 * it does not re-run or roll back any SQL that was already applied.
 */
@Slf4j
@Configuration
public class FlywayRepairConfig {

    @Bean
    public FlywayMigrationStrategy repairThenMigrate() {
        return flyway -> {
            try {
                flyway.repair();
                log.info("Flyway repair completed successfully");
            } catch (Exception e) {
                log.warn("Flyway repair encountered an issue (non-fatal): {}", e.getMessage());
            }
            flyway.migrate();
        };
    }
}

package com.planora.backend;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SchemaValidationIT extends BaseIntegrationIT {

    @Test
    void contextLoadsAndSchemaValidates() {
        assertTrue(postgres.isRunning());
    }
}

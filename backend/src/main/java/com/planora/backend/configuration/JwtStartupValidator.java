package com.planora.backend.configuration;

import java.util.Base64;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JwtStartupValidator implements ApplicationRunner {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Override
    public void run(ApplicationArguments args) {
        if (jwtSecret == null || jwtSecret.isBlank()) {
            throw new IllegalStateException(
                    "[STARTUP] JWT_SECRET environment variable is not set. " +
                    "The application cannot start securely without a JWT signing key.");
        }

        byte[] decoded;
        try {
            decoded = Base64.getDecoder().decode(jwtSecret.getBytes());
        } catch (IllegalArgumentException e) {
            try {
                decoded = Base64.getUrlDecoder().decode(jwtSecret.getBytes());
            } catch (IllegalArgumentException ex) {
                throw new IllegalStateException(
                        "[STARTUP] JWT_SECRET is not a valid Base64 encoded string. " +
                        "Generate a secure key: openssl rand -base64 64", ex);
            }
        }

        int decodedBytes = decoded.length;
        if (decodedBytes < 32) {
            throw new IllegalStateException(
                    "[STARTUP] JWT_SECRET is too short. Minimum 256 bits (32 bytes) required. " +
                    "Found: " + decodedBytes + " bytes. Generate a secure key: " +
                    "openssl rand -base64 64");
        }

        log.info("[Startup] JWT secret key length: {} bytes — OK", decodedBytes);
    }
}

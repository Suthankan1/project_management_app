-- NOTE: This migration cannot re-encrypt existing tokens in SQL because
-- AES-256-GCM requires the application-layer key (GITHUB_TOKEN_ENCRYPTION_KEY).
-- All existing plain-text tokens are invalidated here. Users will need to
-- reconnect their GitHub account after this migration runs.
UPDATE users SET github_access_token = NULL WHERE github_access_token IS NOT NULL;

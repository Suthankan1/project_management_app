-- Align merged_at to TIMESTAMP to match the GithubPullRequest entity (LocalDateTime).
-- V22 originally created this column as VARCHAR(30); this migration promotes it to TIMESTAMP.
ALTER TABLE github_pull_requests
    ALTER COLUMN merged_at TYPE TIMESTAMP
    USING NULLIF(merged_at::text, '')::timestamp;

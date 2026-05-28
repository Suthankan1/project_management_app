-- GitHub timestamps are retained as ISO-8601 text in GithubPullRequest and its DTOs.
-- Repair databases where merged_at was previously created as a timestamp column.
ALTER TABLE github_pull_requests
    ALTER COLUMN merged_at TYPE VARCHAR(30)
    USING merged_at::VARCHAR(30);

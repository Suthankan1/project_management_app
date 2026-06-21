-- Complete GitHub schema changes for databases where an earlier compatibility
-- migration was recorded before these alterations were included.
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_merged_at TIMESTAMP;
ALTER TABLE github_pull_requests ALTER COLUMN task_id DROP NOT NULL;

ALTER TABLE github_commits ALTER COLUMN task_id DROP NOT NULL;

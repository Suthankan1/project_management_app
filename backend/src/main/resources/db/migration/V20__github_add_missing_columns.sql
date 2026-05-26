-- Adds any columns that may be missing from GitHub tables created by a prior V18 migration.
-- All statements use IF NOT EXISTS so this is fully idempotent.

-- github_integrations
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS repository_url         VARCHAR(512);
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS encrypted_access_token VARCHAR(512);
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS token_type             VARCHAR(50) NOT NULL DEFAULT 'PERSONAL_ACCESS_TOKEN';
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS active                 BOOLEAN     NOT NULL DEFAULT TRUE;
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS created_at             TIMESTAMP   NOT NULL DEFAULT NOW();
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMP;

-- github_pull_requests
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS title             VARCHAR(500);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS body              TEXT;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS state             VARCHAR(20);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS author_login      VARCHAR(255);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS head_branch       VARCHAR(255);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS base_branch       VARCHAR(255);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_url        VARCHAR(512);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS linked_task_id    BIGINT;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_created_at TIMESTAMP;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_updated_at TIMESTAMP;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS merged_at         TIMESTAMP;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS synced_at         TIMESTAMP NOT NULL DEFAULT NOW();

-- github_commits
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS message      TEXT;
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS author_name  VARCHAR(255);
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS commit_url   VARCHAR(512);
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS linked_task_id BIGINT;
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS authored_at  TIMESTAMP;
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS synced_at    TIMESTAMP NOT NULL DEFAULT NOW();

-- github_issues
ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS title               VARCHAR(500);
ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS body                TEXT;
ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS state               VARCHAR(20);
ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS author_login        VARCHAR(255);
ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS github_url          VARCHAR(512);
ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS label_names         VARCHAR(1000);
ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS linked_task_id      BIGINT;
ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS github_created_at   TIMESTAMP;
ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS github_updated_at   TIMESTAMP;
ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS synced_at           TIMESTAMP NOT NULL DEFAULT NOW();

-- Indexes (IF NOT EXISTS supported in PostgreSQL 9.5+)
CREATE INDEX IF NOT EXISTS idx_github_prs_integration ON github_pull_requests(integration_id);
CREATE INDEX IF NOT EXISTS idx_github_prs_state       ON github_pull_requests(state);
CREATE INDEX IF NOT EXISTS idx_github_commits_integ   ON github_commits(integration_id);
CREATE INDEX IF NOT EXISTS idx_github_issues_integ    ON github_issues(integration_id);
CREATE INDEX IF NOT EXISTS idx_github_issues_state    ON github_issues(state);

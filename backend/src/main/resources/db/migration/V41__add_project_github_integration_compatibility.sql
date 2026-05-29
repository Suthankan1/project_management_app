-- Retain the project-level GitHub API alongside task-linked GitHub summaries.
CREATE TABLE IF NOT EXISTS github_integrations (
    id                     BIGSERIAL PRIMARY KEY,
    project_id             BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    repository_full_name   VARCHAR(255) NOT NULL,
    repository_url         VARCHAR(512),
    encrypted_access_token VARCHAR(512),
    token_type             VARCHAR(50) NOT NULL DEFAULT 'PERSONAL_ACCESS_TOKEN',
    active                 BOOLEAN NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP,
    CONSTRAINT uq_github_integration UNIQUE (project_id, repository_full_name)
);

CREATE TABLE IF NOT EXISTS github_issues (
    id                  BIGSERIAL PRIMARY KEY,
    integration_id      BIGINT NOT NULL REFERENCES github_integrations(id) ON DELETE CASCADE,
    github_issue_number INTEGER NOT NULL,
    title               VARCHAR(500),
    body                TEXT,
    state               VARCHAR(20),
    author_login        VARCHAR(255),
    github_url          VARCHAR(512),
    label_names         VARCHAR(1000),
    linked_task_id      BIGINT,
    github_created_at   TIMESTAMP,
    github_updated_at   TIMESTAMP,
    synced_at           TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_github_issue UNIQUE (integration_id, github_issue_number)
);

ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS integration_id BIGINT REFERENCES github_integrations(id) ON DELETE CASCADE;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_pr_number INTEGER;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS body TEXT;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS author_login VARCHAR(255);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_url VARCHAR(512);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS linked_task_id BIGINT;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_created_at TIMESTAMP;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_updated_at TIMESTAMP;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_merged_at TIMESTAMP;
ALTER TABLE github_pull_requests ALTER COLUMN task_id DROP NOT NULL;

ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS integration_id BIGINT REFERENCES github_integrations(id) ON DELETE CASCADE;
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS author_email VARCHAR(255);
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS commit_url VARCHAR(512);
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS linked_task_id BIGINT;
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS authored_at TIMESTAMP;
ALTER TABLE github_commits ALTER COLUMN task_id DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_github_pr_integration_number
    ON github_pull_requests(integration_id, github_pr_number);
CREATE UNIQUE INDEX IF NOT EXISTS uq_github_commit_integration_sha
    ON github_commits(integration_id, sha);
CREATE INDEX IF NOT EXISTS idx_github_issues_integration ON github_issues(integration_id);

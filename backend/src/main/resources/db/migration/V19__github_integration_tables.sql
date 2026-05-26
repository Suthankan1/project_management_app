-- GitHub integration tables (idempotent: safe to run even if V18 partially created them)

CREATE TABLE IF NOT EXISTS github_integrations (
    id                     BIGSERIAL    PRIMARY KEY,
    project_id             BIGINT       NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    repository_full_name   VARCHAR(255) NOT NULL,
    repository_url         VARCHAR(512),
    encrypted_access_token VARCHAR(512),
    token_type             VARCHAR(50)  NOT NULL DEFAULT 'PERSONAL_ACCESS_TOKEN',
    active                 BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at             TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMP,
    CONSTRAINT uq_github_integration UNIQUE (project_id, repository_full_name)
);

CREATE TABLE IF NOT EXISTS github_pull_requests (
    id                BIGSERIAL    PRIMARY KEY,
    integration_id    BIGINT       NOT NULL REFERENCES github_integrations(id) ON DELETE CASCADE,
    github_pr_number  INTEGER      NOT NULL,
    title             VARCHAR(500) NOT NULL,
    body              TEXT,
    state             VARCHAR(20)  NOT NULL,
    author_login      VARCHAR(255),
    head_branch       VARCHAR(255),
    base_branch       VARCHAR(255),
    github_url        VARCHAR(512),
    linked_task_id    BIGINT,
    github_created_at TIMESTAMP,
    github_updated_at TIMESTAMP,
    merged_at         TIMESTAMP,
    synced_at         TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_github_pr UNIQUE (integration_id, github_pr_number)
);

CREATE TABLE IF NOT EXISTS github_commits (
    id             BIGSERIAL   PRIMARY KEY,
    integration_id BIGINT      NOT NULL REFERENCES github_integrations(id) ON DELETE CASCADE,
    sha            VARCHAR(40) NOT NULL,
    message        TEXT,
    author_name    VARCHAR(255),
    author_email   VARCHAR(255),
    commit_url     VARCHAR(512),
    linked_task_id BIGINT,
    authored_at    TIMESTAMP,
    synced_at      TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_github_commit UNIQUE (integration_id, sha)
);

CREATE TABLE IF NOT EXISTS github_issues (
    id                  BIGSERIAL    PRIMARY KEY,
    integration_id      BIGINT       NOT NULL REFERENCES github_integrations(id) ON DELETE CASCADE,
    github_issue_number INTEGER      NOT NULL,
    title               VARCHAR(500) NOT NULL,
    body                TEXT,
    state               VARCHAR(20)  NOT NULL,
    author_login        VARCHAR(255),
    github_url          VARCHAR(512),
    label_names         VARCHAR(1000),
    linked_task_id      BIGINT,
    github_created_at   TIMESTAMP,
    github_updated_at   TIMESTAMP,
    synced_at           TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_github_issue UNIQUE (integration_id, github_issue_number)
);

CREATE INDEX IF NOT EXISTS idx_github_prs_integration ON github_pull_requests(integration_id);
CREATE INDEX IF NOT EXISTS idx_github_prs_state       ON github_pull_requests(state);
CREATE INDEX IF NOT EXISTS idx_github_commits_integ   ON github_commits(integration_id);
CREATE INDEX IF NOT EXISTS idx_github_issues_integ    ON github_issues(integration_id);
CREATE INDEX IF NOT EXISTS idx_github_issues_state    ON github_issues(state);

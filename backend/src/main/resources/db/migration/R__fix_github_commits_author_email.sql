-- Ensure databases already ahead of the versioned migrations still get the
-- GitHub integration tables and columns expected by the entities before
-- Hibernate validates.

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

ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS repository_url         VARCHAR(512);
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS encrypted_access_token VARCHAR(512);
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS token_type             VARCHAR(50) NOT NULL DEFAULT 'PERSONAL_ACCESS_TOKEN';
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS active                 BOOLEAN     NOT NULL DEFAULT TRUE;
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS created_at             TIMESTAMP   NOT NULL DEFAULT NOW();
ALTER TABLE github_integrations ADD COLUMN IF NOT EXISTS updated_at             TIMESTAMP;

ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS title             VARCHAR(500);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS body              TEXT;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS state             VARCHAR(20);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS author_login      VARCHAR(255);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_pr_number  INTEGER;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS head_branch       VARCHAR(255);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS base_branch       VARCHAR(255);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_url        VARCHAR(512);
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS linked_task_id    BIGINT;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_created_at TIMESTAMP;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS github_updated_at TIMESTAMP;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS merged_at         TIMESTAMP;
ALTER TABLE github_pull_requests ADD COLUMN IF NOT EXISTS synced_at         TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE github_pull_requests ALTER COLUMN github_created_at TYPE TIMESTAMP USING NULLIF(github_created_at::text, '')::timestamp;
ALTER TABLE github_pull_requests ALTER COLUMN github_updated_at TYPE TIMESTAMP USING NULLIF(github_updated_at::text, '')::timestamp;
ALTER TABLE github_pull_requests ALTER COLUMN merged_at TYPE TIMESTAMP USING NULLIF(merged_at::text, '')::timestamp;
ALTER TABLE github_pull_requests ALTER COLUMN synced_at TYPE TIMESTAMP USING NULLIF(synced_at::text, '')::timestamp;

ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS integration_id BIGINT;
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS sha            VARCHAR(40);
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS message        TEXT;
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS author_name    VARCHAR(255);
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS author_email   VARCHAR(255);
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS commit_url     VARCHAR(512);
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS linked_task_id BIGINT;
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS authored_at    TIMESTAMP;
ALTER TABLE github_commits ADD COLUMN IF NOT EXISTS synced_at      TIMESTAMP NOT NULL DEFAULT NOW();
ALTER TABLE github_commits ALTER COLUMN authored_at TYPE TIMESTAMP USING NULLIF(authored_at::text, '')::timestamp;
ALTER TABLE github_commits ALTER COLUMN synced_at TYPE TIMESTAMP USING NULLIF(synced_at::text, '')::timestamp;

ALTER TABLE github_issues ADD COLUMN IF NOT EXISTS github_issue_number INTEGER;
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
ALTER TABLE github_issues ALTER COLUMN github_created_at TYPE TIMESTAMP USING NULLIF(github_created_at::text, '')::timestamp;
ALTER TABLE github_issues ALTER COLUMN github_updated_at TYPE TIMESTAMP USING NULLIF(github_updated_at::text, '')::timestamp;
ALTER TABLE github_issues ALTER COLUMN synced_at TYPE TIMESTAMP USING NULLIF(synced_at::text, '')::timestamp;
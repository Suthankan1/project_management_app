-- Safety migration: recreate github_pull_requests in PostgreSQL environments
-- where the earlier versioned migration was marked applied but never produced
-- the table or its enrichment columns.
CREATE TABLE IF NOT EXISTS github_pull_requests (
    id            BIGSERIAL     PRIMARY KEY,
    task_id       BIGINT        NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    pr_number     INT           NOT NULL,
    title         VARCHAR(500),
    state         VARCHAR(20),
    html_url      VARCHAR(1000),
    author        VARCHAR(255),
    created_at    VARCHAR(30),
    merged_at     VARCHAR(30),
    head_branch   VARCHAR(255),
    base_branch   VARCHAR(255),
    synced_at     TIMESTAMP     NOT NULL,
    head_sha      VARCHAR(40),
    updated_at    VARCHAR(30),
    ci_status     VARCHAR(20),
    review_status VARCHAR(30)
);

CREATE INDEX IF NOT EXISTS idx_gpr_task_id
    ON github_pull_requests (task_id);

CREATE INDEX IF NOT EXISTS idx_gpr_updated_at
    ON github_pull_requests (updated_at DESC);
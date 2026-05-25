-- Safety migration: recreate github_commits in PostgreSQL environments where
-- the earlier versioned migration was marked applied but never produced the table.
CREATE TABLE IF NOT EXISTS github_commits (
    id           BIGSERIAL     PRIMARY KEY,
    task_id      BIGINT        NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    sha          VARCHAR(40)   NOT NULL,
    message      VARCHAR(1000),
    author       VARCHAR(255),
    committed_at VARCHAR(30),
    html_url     VARCHAR(1000),
    ci_status    VARCHAR(20),
    synced_at    TIMESTAMP     NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gc_task_id
    ON github_commits (task_id);

CREATE INDEX IF NOT EXISTS idx_gc_synced_at
    ON github_commits (synced_at);
-- Migration: Create project_page_versions table for durable page history
CREATE TABLE IF NOT EXISTS project_page_versions (
    id BIGSERIAL PRIMARY KEY,
    page_id BIGINT NOT NULL REFERENCES project_pages(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    author_id BIGINT REFERENCES users(user_id) ON DELETE SET NULL,
    version_number INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_project_page_version UNIQUE (page_id, version_number)
);

CREATE INDEX idx_project_page_versions_page ON project_page_versions(page_id);

-- Migration: Backend-Backed Page Hierarchy, Starred Pages, and Recent Pages
ALTER TABLE project_pages ADD COLUMN parent_page_id BIGINT REFERENCES project_pages(id) ON DELETE CASCADE;
ALTER TABLE project_pages ADD COLUMN is_starred BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE project_pages ADD COLUMN last_viewed_at TIMESTAMP;
ALTER TABLE project_pages ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE project_pages ADD COLUMN icon VARCHAR(255);
ALTER TABLE project_pages ADD COLUMN cover VARCHAR(255);

CREATE INDEX idx_project_pages_parent ON project_pages(parent_page_id);
CREATE INDEX idx_project_pages_project_recent ON project_pages(project_id, last_viewed_at DESC);

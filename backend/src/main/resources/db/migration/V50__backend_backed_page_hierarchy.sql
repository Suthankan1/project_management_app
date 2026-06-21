-- Migration: Backend-Backed Page Hierarchy, Starred Pages, and Recent Pages
ALTER TABLE project_pages ADD COLUMN IF NOT EXISTS parent_page_id BIGINT REFERENCES project_pages(id) ON DELETE CASCADE;
ALTER TABLE project_pages ADD COLUMN IF NOT EXISTS is_starred BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE project_pages ADD COLUMN IF NOT EXISTS last_viewed_at TIMESTAMP;
ALTER TABLE project_pages ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE project_pages ADD COLUMN IF NOT EXISTS icon VARCHAR(255);
ALTER TABLE project_pages ADD COLUMN IF NOT EXISTS cover VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_project_pages_parent ON project_pages(parent_page_id);
CREATE INDEX IF NOT EXISTS idx_project_pages_project_recent ON project_pages(project_id, last_viewed_at DESC);

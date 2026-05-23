ALTER TABLE tasks ADD COLUMN archived BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE tasks ADD COLUMN archived_at TIMESTAMP;
CREATE INDEX idx_tasks_archived ON tasks(project_id, archived);

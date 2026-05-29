-- V7: Recurring task support — extend the tasks table

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_rule VARCHAR(30) NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_end DATE NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_parent_id BIGINT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS next_occurrence DATE NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_next_occurrence ON tasks(next_occurrence);

-- V47: Extend tasks table to support premium recurring task capabilities
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS custom_interval INT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_limit INT NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence_count INT NOT NULL DEFAULT 0;

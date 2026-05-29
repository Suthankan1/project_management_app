-- Add enabled flag for GitHub automation rules and default existing rows to enabled.
ALTER TABLE github_automation_rules
    ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE github_automation_rules
SET enabled = TRUE
WHERE enabled IS NULL;

-- Safety migration: restore the GitHub branch column on tasks for PostgreSQL
-- databases where the earlier migration was marked applied but the column is
-- absent from the live schema.
ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS github_branch VARCHAR(255) NULL;
-- Sprints were originally linked to projects via a plain `pro_id` BIGINT column.
-- The entity was later changed to a proper @ManyToOne using `project_id` as the FK column.
-- This migration ensures `project_id` exists on any database regardless of how the schema
-- was bootstrapped (ddl-auto=update locally vs Flyway in Docker/production).

ALTER TABLE sprints ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES projects(id) ON DELETE CASCADE;

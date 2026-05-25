-- Keep sprint cleanup consistent when a project is removed.
-- V17 may have created an automatically named foreign key, so replace any
-- project_id foreign key before adding the canonical cascading constraint.
DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    FOR constraint_name IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON t.oid = c.conrelid
        JOIN pg_attribute a
            ON a.attrelid = t.oid
           AND a.attnum = ANY (c.conkey)
        WHERE t.relname = 'sprints'
          AND c.contype = 'f'
          AND a.attname = 'project_id'
    LOOP
        EXECUTE format('ALTER TABLE sprints DROP CONSTRAINT %I', constraint_name);
    END LOOP;
END $$;

ALTER TABLE sprints
    ADD CONSTRAINT fk_sprints_project
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

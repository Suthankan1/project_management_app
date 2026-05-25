DO $$
DECLARE
    constraint_name text;
BEGIN
    SELECT con.conname
    INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_attribute attr ON attr.attrelid = rel.oid AND attr.attnum = ANY(con.conkey)
    JOIN pg_class referenced_rel ON referenced_rel.oid = con.confrelid
    WHERE con.contype = 'f'
      AND rel.relname = 'sprints'
      AND attr.attname = 'project_id'
      AND referenced_rel.relname = 'projects'
    LIMIT 1;

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE sprints DROP CONSTRAINT %I', constraint_name);
    END IF;

    ALTER TABLE sprints
        ADD CONSTRAINT fk_sprints_project
        FOREIGN KEY (project_id)
        REFERENCES projects(id)
        ON DELETE CASCADE;
END $$;

DO $$
DECLARE
    v_offending_count INTEGER;
    v_sample_ids TEXT;
BEGIN
    SELECT COUNT(*)
    INTO v_offending_count
    FROM tasks
    WHERE char_length(title) > 255;

    IF v_offending_count > 0 THEN
        SELECT STRING_AGG(format('id=%s (%s chars)', id, char_length(title)), ', ' ORDER BY id)
        INTO v_sample_ids
        FROM (
            SELECT id, title
            FROM tasks
            WHERE char_length(title) > 255
            ORDER BY id
            LIMIT 10
        ) offending_tasks;

        RAISE EXCEPTION
            'Cannot add chk_task_title_length: % task title(s) exceed 255 characters. Sample offending rows: %',
            v_offending_count,
            v_sample_ids;
    END IF;
END $$;

ALTER TABLE tasks ADD CONSTRAINT chk_task_title_length
    CHECK (char_length(title) <= 255);

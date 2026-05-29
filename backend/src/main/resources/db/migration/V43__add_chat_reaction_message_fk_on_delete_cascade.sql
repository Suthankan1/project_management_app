DO $$
DECLARE
    fk_name text;
BEGIN
    SELECT tc.constraint_name
    INTO fk_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
     AND tc.table_schema = kcu.table_schema
     AND tc.table_name = kcu.table_name
    WHERE tc.table_schema = current_schema()
      AND tc.table_name = 'chat_reaction'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'message_id'
    LIMIT 1;

    IF fk_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE chat_reaction DROP CONSTRAINT %I', fk_name);
    END IF;
END $$;

ALTER TABLE chat_reaction
    ADD CONSTRAINT fk_chat_reaction_message
    FOREIGN KEY (message_id) REFERENCES chat_message (id) ON DELETE CASCADE;
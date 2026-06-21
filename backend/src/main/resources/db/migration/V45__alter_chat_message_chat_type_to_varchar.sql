-- Drop obsolete integer-based check constraints on chat_message if they exist
ALTER TABLE chat_message DROP CONSTRAINT IF EXISTS chat_message_chat_type_check;
ALTER TABLE chat_message DROP CONSTRAINT IF EXISTS chat_message_type_check;

-- Alter chat_type and type columns in chat_message table to VARCHAR(20) if they are currently stored as smallint/integer
DO $$
BEGIN
    -- Convert chat_type column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_message' 
          AND column_name = 'chat_type' 
          AND data_type IN ('smallint', 'integer')
    ) THEN
        ALTER TABLE chat_message 
          ALTER COLUMN chat_type TYPE VARCHAR(20) 
          USING CASE 
            WHEN chat_type = 0 THEN 'GROUP'
            WHEN chat_type = 1 THEN 'PRIVATE'
            ELSE NULL
          END;
    END IF;

    -- Convert type column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chat_message' 
          AND column_name = 'type' 
          AND data_type IN ('smallint', 'integer')
    ) THEN
        ALTER TABLE chat_message 
          ALTER COLUMN type TYPE VARCHAR(20) 
          USING CASE 
            WHEN type = 0 THEN 'CHAT'
            WHEN type = 1 THEN 'JOIN'
            WHEN type = 2 THEN 'LEAVE'
            ELSE NULL
          END;
    END IF;
END $$;

-- Alter merged_at in github_pull_requests to TIMESTAMP if it is currently stored as character varying
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'github_pull_requests' 
          AND column_name = 'merged_at' 
          AND data_type = 'character varying'
    ) THEN
        ALTER TABLE github_pull_requests 
          ALTER COLUMN merged_at TYPE TIMESTAMP 
          USING NULLIF(merged_at::text, '')::timestamp;
    END IF;
END $$;

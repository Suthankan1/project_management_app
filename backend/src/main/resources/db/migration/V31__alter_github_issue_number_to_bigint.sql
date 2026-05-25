ALTER TABLE tasks
    ALTER COLUMN github_issue_number TYPE BIGINT
    USING github_issue_number::BIGINT;
ALTER TABLE tasks ADD CONSTRAINT chk_task_title_length
    CHECK (char_length(title) <= 255);

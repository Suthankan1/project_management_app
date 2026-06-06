CREATE TABLE IF NOT EXISTS notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    project_id BIGINT NULL REFERENCES projects(id) ON DELETE CASCADE,
    event_type VARCHAR(80) NOT NULL,
    channel VARCHAR(16) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_notification_preferences_scope UNIQUE NULLS NOT DISTINCT (user_id, project_id, event_type, channel)
);
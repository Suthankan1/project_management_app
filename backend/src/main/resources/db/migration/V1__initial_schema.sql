-- V1 Baseline: Initial Schema Setup
-- Contains all tables and constraints as they existed before Flyway migration V2.

CREATE TABLE IF NOT EXISTS users (
    user_id             BIGSERIAL PRIMARY KEY,
    username            VARCHAR(50) NOT NULL,
    email               VARCHAR(255) NOT NULL UNIQUE,
    password            VARCHAR(128) NOT NULL,
    full_name           VARCHAR(255),
    profile_picture_url VARCHAR(255),
    verified            BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    last_active         TIMESTAMP
);

CREATE TABLE IF NOT EXISTS teams (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(255) NOT NULL UNIQUE,
    owner_id   BIGINT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
    id        BIGSERIAL PRIMARY KEY,
    team_id   BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id   BIGINT NOT NULL REFERENCES users(user_id),
    role      VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_team_member UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS projects (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    project_key VARCHAR(255) UNIQUE,
    description VARCHAR(1500),
    type        VARCHAR(50) NOT NULL,
    user_id     BIGINT NOT NULL REFERENCES users(user_id),
    team_id     BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_access (
    id               BIGSERIAL PRIMARY KEY,
    project_id       BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id          BIGINT NOT NULL REFERENCES users(user_id),
    last_accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_project_access UNIQUE (project_id, user_id)
);

CREATE TABLE IF NOT EXISTS project_favorites (
    id         BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL REFERENCES users(user_id),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_project_favorite UNIQUE (user_id, project_id)
);

CREATE TABLE IF NOT EXISTS project_pages (
    id                 BIGSERIAL PRIMARY KEY,
    project_id         BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title              VARCHAR(255) NOT NULL,
    content            TEXT,
    created_by_user_id BIGINT REFERENCES users(user_id),
    updated_by_user_id BIGINT REFERENCES users(user_id),
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sprints (
    id         BIGSERIAL PRIMARY KEY,
    pro_id     BIGINT,
    name       VARCHAR(255) NOT NULL,
    start_date DATE,
    end_date   DATE,
    status     VARCHAR(50) NOT NULL DEFAULT 'NOT_STARTED',
    goal       VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS sprintboards (
    id         BIGSERIAL PRIMARY KEY,
    sprint_id  BIGINT NOT NULL REFERENCES sprints(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS springcolumns (
    id              BIGSERIAL PRIMARY KEY,
    sprintboard_id  BIGINT NOT NULL REFERENCES sprintboards(id) ON DELETE CASCADE,
    column_name     VARCHAR(255) NOT NULL,
    column_status   VARCHAR(255) NOT NULL,
    position        INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
    id                  BIGSERIAL PRIMARY KEY,
    project_id          BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    title               VARCHAR(255) NOT NULL,
    description         VARCHAR(2000),
    status              VARCHAR(255),
    priority            VARCHAR(50),
    story_point         INTEGER NOT NULL DEFAULT 0,
    due_date            DATE,
    start_date          DATE,
    assignee_id         BIGINT REFERENCES team_members(id) ON DELETE SET NULL,
    reporter_id         BIGINT REFERENCES team_members(id) ON DELETE SET NULL,
    last_modified_by_id BIGINT REFERENCES users(user_id),
    completed_at        TIMESTAMP,
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    parent_id           BIGINT REFERENCES tasks(id) ON DELETE CASCADE,
    sprint_id           BIGINT REFERENCES sprints(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS labels (
    id         BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name       VARCHAR(255) NOT NULL,
    color      VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS task_labels (
    task_id  BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    label_id BIGINT NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, label_id)
);

CREATE TABLE IF NOT EXISTS task_dependencies (
    blocked_task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    blocker_task_id BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    PRIMARY KEY (blocked_task_id, blocker_task_id)
);

CREATE TABLE IF NOT EXISTS task_attachments (
    id           BIGSERIAL PRIMARY KEY,
    task_id      BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    file_name    VARCHAR(255) NOT NULL,
    content_type VARCHAR(255) NOT NULL,
    file_size    BIGINT NOT NULL,
    object_key   VARCHAR(255) NOT NULL,
    uploaded_by  BIGINT NOT NULL REFERENCES users(user_id),
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_activities (
    id            BIGSERIAL PRIMARY KEY,
    task_id       BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    actor_name    VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description   VARCHAR(500),
    created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS task_access (
    id               BIGSERIAL PRIMARY KEY,
    task_id          BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id          BIGINT NOT NULL REFERENCES users(user_id),
    last_accessed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_task_access UNIQUE (task_id, user_id)
);

CREATE TABLE IF NOT EXISTS team_invitations (
    id         BIGSERIAL PRIMARY KEY,
    team_id    BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    email      VARCHAR(255) NOT NULL,
    role       VARCHAR(255) NOT NULL,
    token      VARCHAR(255) NOT NULL,
    status     VARCHAR(255) NOT NULL DEFAULT 'PENDING',
    invited_at TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comments (
    id         BIGSERIAL PRIMARY KEY,
    task_id    BIGINT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    author_id  BIGINT NOT NULL REFERENCES users(user_id),
    content    TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id           BIGSERIAL PRIMARY KEY,
    recipient_id BIGINT NOT NULL REFERENCES users(user_id),
    message      VARCHAR(255) NOT NULL,
    link         VARCHAR(255) NOT NULL,
    is_read      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_room (
    id                BIGSERIAL PRIMARY KEY,
    project_id        BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    name              VARCHAR(255),
    topic             VARCHAR(255),
    description       VARCHAR(1000),
    created_by        VARCHAR(255),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    archived          BOOLEAN NOT NULL DEFAULT FALSE,
    archived_at       TIMESTAMP,
    pinned_message_id BIGINT
);

CREATE TABLE IF NOT EXISTS chat_room_member (
    id      BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES chat_room(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(user_id),
    role    VARCHAR(50) NOT NULL,
    CONSTRAINT uk_chat_room_member UNIQUE (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS chat_message (
    id                BIGSERIAL PRIMARY KEY,
    project_id        BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    room_id           BIGINT REFERENCES chat_room(id) ON DELETE CASCADE,
    sender            VARCHAR(255),
    recipient         VARCHAR(255),
    content           TEXT,
    timestamp         TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted           BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at        TIMESTAMP,
    edited_at         TIMESTAMP,
    chat_type         VARCHAR(20),
    type              VARCHAR(20),
    parent_message_id BIGINT REFERENCES chat_message(id) ON DELETE SET NULL,
    format_type       VARCHAR(20) DEFAULT 'PLAIN'
);

CREATE TABLE IF NOT EXISTS chat_thread (
    id              BIGSERIAL PRIMARY KEY,
    project_id      BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    room_id         BIGINT REFERENCES chat_room(id) ON DELETE CASCADE,
    root_message_id BIGINT REFERENCES chat_message(id) ON DELETE CASCADE,
    created_by      VARCHAR(255),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT idx_chat_thread_project_root UNIQUE (project_id, root_message_id)
);

CREATE TABLE IF NOT EXISTS chat_read_state (
    id                    BIGSERIAL PRIMARY KEY,
    project_id            BIGINT REFERENCES projects(id) ON DELETE CASCADE,
    room_id               BIGINT REFERENCES chat_room(id) ON DELETE CASCADE,
    user_id               BIGINT NOT NULL REFERENCES users(user_id),
    last_read_message_id  BIGINT,
    other_participant     VARCHAR(255),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_reaction (
    id         BIGSERIAL PRIMARY KEY,
    message_id BIGINT NOT NULL REFERENCES chat_message(id) ON DELETE CASCADE,
    user_id    BIGINT NOT NULL REFERENCES users(user_id),
    emoji      VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_chat_reaction_message_user_emoji UNIQUE (message_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS document_folders (
    id               BIGSERIAL PRIMARY KEY,
    project_id       BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    parent_folder_id BIGINT REFERENCES document_folders(id) ON DELETE CASCADE,
    name             VARCHAR(255) NOT NULL,
    created_by       BIGINT NOT NULL REFERENCES users(user_id),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at       TIMESTAMP
);

CREATE TABLE IF NOT EXISTS documents (
    id                    BIGSERIAL PRIMARY KEY,
    project_id            BIGINT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    folder_id             BIGINT REFERENCES document_folders(id) ON DELETE SET NULL,
    name                  VARCHAR(255) NOT NULL,
    content_type          VARCHAR(255) NOT NULL,
    file_size             BIGINT NOT NULL,
    latest_object_key     VARCHAR(255) NOT NULL,
    latest_version_number INT NOT NULL,
    uploaded_by           BIGINT NOT NULL REFERENCES users(user_id),
    status                VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at            TIMESTAMP
);

CREATE TABLE IF NOT EXISTS document_versions (
    id             BIGSERIAL PRIMARY KEY,
    document_id    BIGINT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    version_number INT NOT NULL,
    content_type   VARCHAR(255) NOT NULL,
    file_size      BIGINT NOT NULL,
    object_key     VARCHAR(255) NOT NULL UNIQUE,
    uploaded_by    BIGINT NOT NULL REFERENCES users(user_id),
    created_at     TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_document_version UNIQUE (document_id, version_number)
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    token      VARCHAR(255),
    token_type VARCHAR(50),
    used       BOOLEAN NOT NULL DEFAULT FALSE,
    attempts   INTEGER NOT NULL DEFAULT 0,
    expiry     TIMESTAMP WITH TIME ZONE,
    CONSTRAINT uk_user_token_type UNIQUE (user_id, token_type)
);

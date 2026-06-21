CREATE TABLE IF NOT EXISTS github_automation_rules (
    id BIGSERIAL PRIMARY KEY,
    project_id BIGINT NOT NULL REFERENCES projects (id) ON DELETE CASCADE,
    trigger VARCHAR(40) NOT NULL,
    action VARCHAR(40) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_github_automation_rules_project_trigger
    ON github_automation_rules (project_id, trigger);

CREATE TABLE IF NOT EXISTS github_automation_rule_config (
    rule_id BIGINT NOT NULL REFERENCES github_automation_rules (id) ON DELETE CASCADE,
    config_key VARCHAR(255) NOT NULL,
    config_value VARCHAR(255) NOT NULL,
    PRIMARY KEY (rule_id, config_key)
);

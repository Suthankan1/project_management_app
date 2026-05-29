CREATE TABLE IF NOT EXISTS github_automation_logs (
    id BIGSERIAL PRIMARY KEY,
    rule_id BIGINT NOT NULL REFERENCES github_automation_rules (id) ON DELETE CASCADE,
    trigger VARCHAR(40) NOT NULL,
    action VARCHAR(40) NOT NULL,
    event_context TEXT NOT NULL,
    outcome VARCHAR(20) NOT NULL,
    message VARCHAR(1000) NOT NULL,
    executed_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_github_automation_logs_rule_executed
    ON github_automation_logs (rule_id, executed_at DESC);

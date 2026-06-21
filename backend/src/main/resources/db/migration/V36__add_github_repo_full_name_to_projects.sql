ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_repo_full_name VARCHAR(255);

CREATE INDEX IF NOT EXISTS idx_projects_github_repo_full_name
    ON projects (LOWER(github_repo_full_name));

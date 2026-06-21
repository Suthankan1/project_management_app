import api from '../api/axios';

export type GithubAutomationTrigger = 'PR_MERGED' | 'CI_FAILED' | 'PR_OPENED' | string;
export type GithubAutomationAction = 'MOVE_TASK_TO_COLUMN' | 'CREATE_TASK' | string;

export interface GithubAutomationRule {
  id: number;
  trigger: GithubAutomationTrigger;
  action: GithubAutomationAction;
  config: Record<string, string>;
  enabled?: boolean;
}

export interface CreateAutomationRulePayload {
  trigger: GithubAutomationTrigger;
  action: GithubAutomationAction;
  config: Record<string, string>;
}

export const githubAutomationService = {
  getRules: (projectId: number | string): Promise<GithubAutomationRule[]> =>
    api.get<GithubAutomationRule[]>(`/api/projects/${projectId}/automations/github`).then((r) => r.data ?? []),

  createRule: (projectId: number | string, payload: CreateAutomationRulePayload): Promise<GithubAutomationRule> =>
    api.post<GithubAutomationRule>(`/api/projects/${projectId}/automations/github`, payload).then((r) => r.data),

  deleteRule: (projectId: number | string, ruleId: number): Promise<void> =>
    api.delete(`/api/projects/${projectId}/automations/github/${ruleId}`).then(() => undefined),
};

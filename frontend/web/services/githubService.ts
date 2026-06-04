import { gitHubApi, tasksApi } from './api-contract';
import api from '@/lib/axios';

export interface GitHubOwner {
  login: string;
}

export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubOwner;
  default_branch: string;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
}

export interface GitHubLabel {
  id?: number;
  name: string;
  color: string;
}

export interface GitHubIssueAssignee {
  login: string;
  avatar_url: string;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  labels: GitHubLabel[];
  assignees: Array<GitHubIssueAssignee | string>;
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  comments: number;
  body?: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  merged_at: string | null;
  created_at: string;
  updated_at: string;
  html_url: string;
  draft: boolean;
  user: { login: string; avatar_url: string; html_url: string };
  labels: GitHubLabel[];
  head: { ref: string };
  base: { ref: string };
}

export interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  author: { login: string; avatar_url: string; html_url: string } | null;
}

export interface ProjectGitHubConnection {
  repoId: number;
  repoName: string;
  repoFullName: string;
  private: boolean;
  defaultBranch: string;
  ownerLogin: string;
  connectedAt: string;
}

export type GithubAutomationTrigger =
  | 'PR_MERGED'
  | 'PR_OPENED'
  | 'CI_FAILED'
  | 'ISSUE_OPENED'
  | 'ISSUE_LABELED'
  | 'RELEASE_PUBLISHED';

export type GithubAutomationAction =
  | 'MOVE_TASK_TO_COLUMN'
  | 'CREATE_TASK'
  | 'SEND_NOTIFICATION';

export interface GithubAutomationRule {
  id: number;
  projectId: number;
  trigger: GithubAutomationTrigger;
  action: GithubAutomationAction;
  enabled: boolean;
  config: Record<string, string>;
}

export type GithubAutomationOutcome = 'SUCCESS' | 'SKIPPED' | 'ERROR';

export interface GithubAutomationLog {
  id: number;
  ruleId: number;
  trigger: GithubAutomationTrigger;
  action: GithubAutomationAction;
  context: string;
  outcome: GithubAutomationOutcome;
  message: string;
  executedAt: string;
}


interface GitHubApiIssue {
  id: number;
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  labels: Array<{ name: string; color: string }>;
  assignees: Array<{ login: string; avatar_url: string }>;
  created_at: string;
  updated_at: string;
  html_url: string;
  comments: number;
}

export async function fetchRepositories(): Promise<GitHubRepository[]> {
  return gitHubApi.fetchRepositories() as Promise<GitHubRepository[]>;
}

export async function fetchIssues(
  repoFullName: string,
  state: 'open' | 'closed' | 'all' = 'all',
  label?: string,
): Promise<GitHubIssue[]> {
  const response = await api.get<any[]>('/api/github/issues', {
    params: {
      repoFullName,
      state,
      label: label?.trim() || undefined,
    },
  });

  return response.data.map(issue => ({
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body ?? undefined,
    state: issue.state,
    labels: issue.labels,
    assignees: issue.assignees,
    createdAt: issue.created_at || issue.createdAt,
    updatedAt: issue.updated_at || issue.updatedAt,
    htmlUrl: issue.html_url || issue.htmlUrl,
    comments: issue.comments,
  }));
}

export async function fetchGitHubUser(): Promise<GitHubUser> {
  const { data } = await api.get<GitHubUser>('/api/github/user');
  return data;
}

export async function fetchPullRequests(
  owner: string,
  repo: string,
): Promise<GitHubPullRequest[]> {
  const { data } = await api.get<GitHubPullRequest[]>('/api/github/pull-requests', {
    params: { owner, repo },
  });
  return data;
}

export async function fetchPullRequest(
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  const { data } = await api.get<GitHubPullRequest>(`/api/github/pull-requests/${prNumber}`, {
    params: { owner, repo },
  });
  return data;
}

export async function fetchCommits(
  owner: string,
  repo: string,
): Promise<GitHubCommit[]> {
  const { data } = await api.get<GitHubCommit[]>('/api/github/commits', {
    params: { owner, repo },
  });
  return data;
}

// ── GitHub account connection status ────────────────────────────────────────

export function hasConnectedGitHubAccount(): boolean {
  if (typeof window === 'undefined') return false;
  const profile = localStorage.getItem('userProfile');
  if (profile) {
    try {
      const parsed = JSON.parse(profile);
      if (parsed && parsed.githubUsername) {
        return true;
      }
    } catch {
      // ignore
    }
  }
  return false;
}

// ── Per-project GitHub repo connection ───────────────────────────────────────

export function getProjectGitHubRepo(projectId: string | number): ProjectGitHubConnection | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(`github_project_${projectId}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ProjectGitHubConnection;
  } catch {
    return null;
  }
}

export function setProjectGitHubRepo(projectId: string | number, repo: GitHubRepository): void {
  if (typeof window === 'undefined') return;
  const connection: ProjectGitHubConnection = {
    repoId: repo.id,
    repoName: repo.name,
    repoFullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
    ownerLogin: repo.owner.login,
    connectedAt: new Date().toISOString(),
  };
  localStorage.setItem(`github_project_${projectId}`, JSON.stringify(connection));
}

export function clearProjectGitHubRepo(projectId: string | number): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`github_project_${projectId}`);
}

export async function fetchGitHubAutomationRules(projectId: string | number): Promise<GithubAutomationRule[]> {
  const data = await gitHubApi.getAutomationRules(projectId);
  return data as GithubAutomationRule[];
}

export async function fetchGitHubAutomationLogs(projectId: string | number): Promise<GithubAutomationLog[]> {
  const data = await gitHubApi.getAutomationLogs(projectId);
  return data as GithubAutomationLog[];
}

export async function fetchImportedGitHubIssueNumbers(
  projectId: string | number,
  repoFullName: string,
): Promise<number[]> {
  const data = await tasksApi.listByProject(projectId);
  const content = data.content || [];
  const normalizedRepoName = repoFullName.toLowerCase();

  const tasks = content as Array<{ githubRepoFullName?: string; githubIssueNumber?: number }>;
  return tasks
    .filter(task => task.githubRepoFullName?.toLowerCase() === normalizedRepoName)
    .map(task => task.githubIssueNumber)
    .filter((n): n is number => typeof n === 'number');
}

export async function createGitHubAutomationRule(
  projectId: string | number,
  payload: {
    trigger: GithubAutomationTrigger;
    action: GithubAutomationAction;
    config: Record<string, string>;
  },
): Promise<GithubAutomationRule> {
  const data = await gitHubApi.createAutomationRule(projectId, payload);
  return data as GithubAutomationRule;
}

export async function deleteGitHubAutomationRule(projectId: string | number, ruleId: number): Promise<void> {
  await gitHubApi.deleteAutomationRule(projectId, ruleId);
}

export async function setGitHubAutomationRuleEnabled(
  projectId: string | number,
  ruleId: number,
  enabled: boolean,
): Promise<GithubAutomationRule> {
  const data = await gitHubApi.setAutomationRuleEnabled(projectId, ruleId, enabled);
  return data as GithubAutomationRule;
}

// ── Saved GitHub accounts (account picker) ────────────────────────────────────

export interface SavedGitHubAccount {
  login: string;
  name: string | null;
  avatarUrl: string;
}

const SAVED_ACCOUNTS_KEY = 'planora:github:saved-accounts';

export function getSavedGitHubAccounts(): SavedGitHubAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(SAVED_ACCOUNTS_KEY) || '[]');
  } catch {
    return [];
  }
}

export function upsertSavedGitHubAccount(account: SavedGitHubAccount): void {
  const accounts = getSavedGitHubAccounts();
  const idx = accounts.findIndex(a => a.login === account.login);
  if (idx >= 0) accounts[idx] = account;
  else accounts.unshift(account); // most-recently-used first
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts));
}

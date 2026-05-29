import api from '@/lib/axios'

export interface GitHubOwner {
  login: string
}

export interface GitHubRepository {
  id: number
  name: string
  full_name: string
  private: boolean
  owner: GitHubOwner
  default_branch: string
}

export interface GitHubUser {
  login: string
  name: string | null
  avatar_url: string
  html_url: string
  public_repos: number
  followers: number
}

export interface GitHubLabel {
  id?: number
  name: string
  color: string
}

export interface GitHubIssueAssignee {
  login: string
  avatar_url: string
}

export interface GitHubIssue {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  labels: GitHubLabel[]
  assignees: Array<GitHubIssueAssignee | string>
  createdAt: string
  updatedAt: string
  htmlUrl: string
  comments: number
  body?: string
}

export interface GitHubPullRequest {
  id: number
  number: number
  title: string
  state: 'open' | 'closed'
  merged_at: string | null
  created_at: string
  updated_at: string
  html_url: string
  draft: boolean
  user: { login: string; avatar_url: string; html_url: string }
  labels: GitHubLabel[]
  head: { ref: string }
  base: { ref: string }
}

export interface GitHubCommit {
  sha: string
  html_url: string
  commit: {
    message: string
    author: { name: string; date: string }
  }
  author: { login: string; avatar_url: string; html_url: string } | null
}

export interface ProjectGitHubConnection {
  repoId: number
  repoName: string
  repoFullName: string
  private: boolean
  defaultBranch: string
  ownerLogin: string
  connectedAt: string
}

export type GithubAutomationTrigger =
  | 'PR_MERGED'
  | 'PR_OPENED'
  | 'CI_FAILED'
  | 'ISSUE_OPENED'
  | 'ISSUE_LABELED'
  | 'RELEASE_PUBLISHED'

export type GithubAutomationAction =
  | 'MOVE_TASK_TO_COLUMN'
  | 'CREATE_TASK'
  | 'SEND_NOTIFICATION'

export interface GithubAutomationRule {
  id: number
  projectId: number
  trigger: GithubAutomationTrigger
  action: GithubAutomationAction
  enabled: boolean
  config: Record<string, string>
}

export type GithubAutomationOutcome = 'SUCCESS' | 'SKIPPED' | 'ERROR'

export interface GithubAutomationLog {
  id: number
  ruleId: number
  trigger: GithubAutomationTrigger
  action: GithubAutomationAction
  context: string
  outcome: GithubAutomationOutcome
  message: string
  executedAt: string
}

interface TaskGithubIssueLink {
  githubIssueNumber?: number | null
  githubRepoFullName?: string | null
}

interface GitHubApiIssue {
  id: number
  number: number
  title: string
  body: string | null
  state: 'open' | 'closed'
  labels: Array<{ name: string; color: string }>
  assignees: Array<{ login: string; avatar_url: string }>
  created_at: string
  updated_at: string
  html_url: string
  comments: number
}

export async function fetchRepositories(): Promise<GitHubRepository[]> {
  const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080'

  const response = await fetch(`${baseUrl}/api/github/repositories`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (response.status === 401) {
    throw new Error('Unauthorized: Please log in again.')
  }

  if (response.status === 429) {
    throw new Error('Rate limit exceeded. Please try again later.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    throw new Error(body.error || 'Failed to fetch repositories')
  }

  return response.json()
}

export async function fetchIssues(
  repoFullName: string,
  state: 'open' | 'closed' | 'all' = 'all',
  label?: string,
): Promise<GitHubIssue[]> {
  const token = getGitHubToken()
  if (!token) {
    throw new Error('Connect GitHub to view issues.')
  }

  const response = await fetch(
    `https://api.github.com/repos/${repoFullName}/issues?state=${state}&per_page=100${label?.trim() ? `&labels=${encodeURIComponent(label.trim())}` : ''}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    },
  )

  if (response.status === 401) {
    throw new Error('Connect GitHub to view issues.')
  }

  if (response.status === 404) {
    throw new Error('Repository not found or unavailable.')
  }

  if (response.status === 429) {
    throw new Error('GitHub rate limit exceeded. Try again later.')
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string }
    throw new Error(body.message || 'Failed to load issues.')
  }

  const issues = await response.json() as GitHubApiIssue[]
  return issues.map(issue => ({
    id: issue.id,
    number: issue.number,
    title: issue.title,
    body: issue.body ?? undefined,
    state: issue.state,
    labels: issue.labels,
    assignees: issue.assignees,
    createdAt: issue.created_at,
    updatedAt: issue.updated_at,
    htmlUrl: issue.html_url,
    comments: issue.comments,
  }))
}

export async function fetchRepositoriesWithToken(token: string): Promise<GitHubRepository[]> {
  const response = await fetch('https://api.github.com/user/repos?per_page=100&sort=updated', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })

  if (response.status === 401) {
    throw new Error('Invalid GitHub token. Please reconnect your account.')
  }

  if (!response.ok) {
    throw new Error('Failed to fetch repositories from GitHub')
  }

  return response.json()
}

export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  const response = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  })
  if (!response.ok) throw new Error('Failed to fetch GitHub user')
  return response.json()
}

export async function fetchPullRequests(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubPullRequest[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls?state=all&per_page=50&sort=updated&direction=desc`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    },
  )
  if (response.status === 404) throw new Error('Repository not found or no access')
  if (!response.ok) throw new Error('Failed to fetch pull requests')
  return response.json()
}

export async function fetchPullRequest(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<GitHubPullRequest> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    },
  )
  if (response.status === 404) throw new Error('Pull request not found or no access')
  if (!response.ok) throw new Error('Failed to fetch pull request')
  return response.json()
}

export async function fetchCommits(
  token: string,
  owner: string,
  repo: string,
): Promise<GitHubCommit[]> {
  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/commits?per_page=50`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    },
  )
  if (response.status === 404) throw new Error('Repository not found or no access')
  if (!response.ok) throw new Error('Failed to fetch commits')
  return response.json()
}

// ── GitHub token (stored per browser session) ────────────────────────────────

export function getGitHubToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('github_access_token')
}

export function setGitHubToken(token: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem('github_access_token', token)
}

export function clearGitHubToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('github_access_token')
}

// ── Per-project GitHub repo connection ───────────────────────────────────────

export function getProjectGitHubRepo(projectId: string | number): ProjectGitHubConnection | null {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(`github_project_${projectId}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as ProjectGitHubConnection
  } catch {
    return null
  }
}

export function setProjectGitHubRepo(projectId: string | number, repo: GitHubRepository): void {
  if (typeof window === 'undefined') return
  const connection: ProjectGitHubConnection = {
    repoId: repo.id,
    repoName: repo.name,
    repoFullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch,
    ownerLogin: repo.owner.login,
    connectedAt: new Date().toISOString(),
  }
  localStorage.setItem(`github_project_${projectId}`, JSON.stringify(connection))
}

export function clearProjectGitHubRepo(projectId: string | number): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(`github_project_${projectId}`)
}

export async function fetchGitHubAutomationRules(projectId: string | number): Promise<GithubAutomationRule[]> {
  const response = await api.get(`/api/projects/${projectId}/automations/github`)
  return response.data || []
}

export async function fetchGitHubAutomationLogs(projectId: string | number): Promise<GithubAutomationLog[]> {
  const response = await api.get(`/api/projects/${projectId}/automations/github/logs`)
  return response.data || []
}

export async function fetchImportedGitHubIssueNumbers(
  projectId: string | number,
  repoFullName: string,
): Promise<number[]> {
  const response = await api.get<TaskGithubIssueLink[]>(`/api/tasks/project/${projectId}`)
  const normalizedRepoName = repoFullName.toLowerCase()

  return response.data
    .filter(task => task.githubRepoFullName?.toLowerCase() === normalizedRepoName)
    .map(task => task.githubIssueNumber)
    .filter((issueNumber): issueNumber is number => typeof issueNumber === 'number')
}

export async function createGitHubAutomationRule(
  projectId: string | number,
  payload: {
    trigger: GithubAutomationTrigger
    action: GithubAutomationAction
    config: Record<string, string>
  },
): Promise<GithubAutomationRule> {
  const response = await api.post(`/api/projects/${projectId}/automations/github`, payload)
  return response.data
}

export async function deleteGitHubAutomationRule(projectId: string | number, ruleId: number): Promise<void> {
  await api.delete(`/api/projects/${projectId}/automations/github/${ruleId}`)
}

export async function setGitHubAutomationRuleEnabled(
  projectId: string | number,
  ruleId: number,
  enabled: boolean,
): Promise<GithubAutomationRule> {
  const response = await api.patch(`/api/projects/${projectId}/automations/github/${ruleId}/enabled`, null, {
    params: { enabled },
  })
  return response.data
}

// ── Saved GitHub accounts (account picker) ────────────────────────────────────

export interface SavedGitHubAccount {
  login: string
  name: string | null
  avatarUrl: string
}

const SAVED_ACCOUNTS_KEY = 'planora:github:saved-accounts'

export function getSavedGitHubAccounts(): SavedGitHubAccount[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(SAVED_ACCOUNTS_KEY) || '[]')
  } catch {
    return []
  }
}

export function upsertSavedGitHubAccount(account: SavedGitHubAccount): void {
  const accounts = getSavedGitHubAccounts()
  const idx = accounts.findIndex(a => a.login === account.login)
  if (idx >= 0) accounts[idx] = account
  else accounts.unshift(account) // most-recently-used first
  localStorage.setItem(SAVED_ACCOUNTS_KEY, JSON.stringify(accounts))
}

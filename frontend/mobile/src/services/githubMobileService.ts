import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'github_token';
const REPO_PREFIX = 'github_repo_';
const GH_API = 'https://api.github.com';

// ── Token ──────────────────────────────────────────────────────────────────────
export async function getGitHubToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}
export async function saveGitHubToken(token: string): Promise<void> {
  await AsyncStorage.setItem(TOKEN_KEY, token);
}
export async function clearGitHubToken(): Promise<void> {
  await AsyncStorage.removeItem(TOKEN_KEY);
}

// ── Project repo connection ────────────────────────────────────────────────────
export interface ProjectGitHubConnection {
  repoFullName: string;
  ownerLogin: string;
  repoName: string;
  defaultBranch: string;
  private: boolean;
}

export async function getProjectGitHubRepo(projectId: string): Promise<ProjectGitHubConnection | null> {
  const json = await AsyncStorage.getItem(`${REPO_PREFIX}${projectId}`);
  return json ? (JSON.parse(json) as ProjectGitHubConnection) : null;
}

export async function setProjectGitHubRepo(projectId: string, repo: GitHubRepository): Promise<void> {
  const conn: ProjectGitHubConnection = {
    repoFullName: repo.full_name,
    ownerLogin: repo.full_name.split('/')[0],
    repoName: repo.name,
    defaultBranch: repo.default_branch,
    private: repo.private,
  };
  await AsyncStorage.setItem(`${REPO_PREFIX}${projectId}`, JSON.stringify(conn));
}

export async function clearProjectGitHubRepo(projectId: string): Promise<void> {
  await AsyncStorage.removeItem(`${REPO_PREFIX}${projectId}`);
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface GitHubRepository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
}

export interface GitHubPullRequest {
  id: number;
  number: number;
  title: string;
  state: string;
  merged_at: string | null;
  draft: boolean;
  updated_at: string;
  html_url: string;
  head: { ref: string };
  base: { ref: string };
  user: { login: string; avatar_url: string };
  labels: { id: number; name: string; color: string }[];
}

export interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author: { name: string; date: string };
  };
  author: { login: string; avatar_url: string } | null;
}

export interface GitHubIssue {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  html_url: string;
  updated_at: string;
  user: { login: string; avatar_url: string };
  labels: { id: number; name: string; color: string }[];
  comments: number;
}

// ── GitHub API helpers ─────────────────────────────────────────────────────────
async function ghFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`${GH_API}${path}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `GitHub API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchGitHubUser(token: string): Promise<GitHubUser> {
  return ghFetch<GitHubUser>('/user', token);
}

export async function fetchRepositoriesWithToken(token: string): Promise<GitHubRepository[]> {
  return ghFetch<GitHubRepository[]>('/user/repos?sort=updated&per_page=100&type=all', token);
}

export async function fetchPullRequests(token: string, owner: string, repo: string): Promise<GitHubPullRequest[]> {
  return ghFetch<GitHubPullRequest[]>(`/repos/${owner}/${repo}/pulls?state=all&per_page=30`, token);
}

export async function fetchCommits(token: string, owner: string, repo: string): Promise<GitHubCommit[]> {
  return ghFetch<GitHubCommit[]>(`/repos/${owner}/${repo}/commits?per_page=30`, token);
}

export async function fetchIssues(repoFullName: string, token?: string): Promise<GitHubIssue[]> {
  if (token) {
    return ghFetch<GitHubIssue[]>(`/repos/${repoFullName}/issues?state=open&per_page=30`, token);
  }
  const res = await fetch(`${GH_API}/repos/${repoFullName}/issues?state=open&per_page=30`, {
    headers: { Accept: 'application/vnd.github.v3+json' },
  });
  if (!res.ok) throw new Error(`GitHub API error ${res.status}`);
  return res.json() as Promise<GitHubIssue[]>;
}

// ── Token exchange (via web frontend API) ─────────────────────────────────────
export async function exchangeCodeForToken(code: string): Promise<string | null> {
  const webUrl = process.env.EXPO_PUBLIC_WEB_URL ?? 'http://localhost:3000';
  const res = await fetch(`${webUrl}/api/github/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { access_token?: string };
  return data.access_token ?? null;
}

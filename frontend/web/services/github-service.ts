import { gitHubApi } from './api-contract';
import type {
  GithubRepository,
  GithubPr,
  GithubCommit,
  GithubIssue,
  GithubStats,
  PageResponse,
  LinkRepositoryRequest,
  CreateIssueRequest,
} from './api-contract';

export type {
  GithubRepository,
  GithubPr,
  GithubCommit,
  GithubIssue,
  GithubStats,
  PageResponse,
  LinkRepositoryRequest,
  CreateIssueRequest,
};

// ── Repository endpoints ────────────────────────────────────────────────────

export async function linkRepository(request: LinkRepositoryRequest): Promise<GithubRepository> {
  return gitHubApi.linkRepository(request);
}

export async function unlinkRepository(integrationId: number, projectId: number): Promise<void> {
  return gitHubApi.unlinkRepository(integrationId, projectId);
}

export async function getLinkedRepositories(projectId: number): Promise<GithubRepository[]> {
  return gitHubApi.getLinkedRepositories(projectId);
}

// ── Pull Request endpoints ──────────────────────────────────────────────────

export async function getPullRequests(
  projectId: number,
  options: { state?: 'open' | 'closed' | 'merged' | 'all'; page?: number; size?: number } = {}
): Promise<PageResponse<GithubPr>> {
  return gitHubApi.getPullRequests(projectId, options);
}

export async function linkTaskToPr(
  projectId: number,
  prId: number,
  taskId: number
): Promise<void> {
  return gitHubApi.linkTaskToPr(projectId, prId, taskId);
}

// ── Commit endpoints ────────────────────────────────────────────────────────

export async function getCommits(
  projectId: number,
  options: { page?: number; size?: number } = {}
): Promise<PageResponse<GithubCommit>> {
  return gitHubApi.getCommits(projectId, options);
}

// ── Issue endpoints ─────────────────────────────────────────────────────────

export async function getIssues(
  projectId: number,
  options: { state?: 'open' | 'closed' | 'all'; page?: number; size?: number } = {}
): Promise<PageResponse<GithubIssue>> {
  return gitHubApi.getIssues(projectId, options);
}

export async function createIssue(
  projectId: number,
  request: CreateIssueRequest
): Promise<GithubIssue> {
  return gitHubApi.createIssue(projectId, request);
}

// ── Stats & Sync ────────────────────────────────────────────────────────────

export async function getStats(projectId: number): Promise<GithubStats> {
  return gitHubApi.getStats(projectId);
}

export async function syncProject(projectId: number): Promise<void> {
  return gitHubApi.syncProject(projectId);
}

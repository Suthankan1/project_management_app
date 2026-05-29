import api from '@/lib/axios';

// ── Types ──────────────────────────────────────────────────────────────────

export interface GithubRepository {
  integrationId: number;
  projectId: number;
  repositoryFullName: string;
  repositoryUrl: string;
  tokenType: string;
  active: boolean;
}

export interface GithubPr {
  id: number;
  integrationId: number;
  githubPrNumber: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed' | 'merged';
  authorLogin: string | null;
  headBranch: string | null;
  baseBranch: string | null;
  githubUrl: string | null;
  linkedTaskId: number | null;
  githubCreatedAt: string | null;
  githubUpdatedAt: string | null;
  mergedAt: string | null;
}

export interface GithubCommit {
  id: number;
  integrationId: number;
  sha: string;
  shortSha: string;
  message: string | null;
  authorName: string | null;
  authorEmail: string | null;
  commitUrl: string | null;
  linkedTaskId: number | null;
  authoredAt: string | null;
}

export interface GithubIssue {
  id: number;
  integrationId: number;
  githubIssueNumber: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  authorLogin: string | null;
  githubUrl: string | null;
  labels: string[];
  linkedTaskId: number | null;
  githubCreatedAt: string | null;
  githubUpdatedAt: string | null;
}

export interface GithubStats {
  linkedRepositories: number;
  totalPullRequests: number;
  openPullRequests: number;
  mergedPullRequests: number;
  closedPullRequests: number;
  totalCommits: number;
  totalIssues: number;
  openIssues: number;
  closedIssues: number;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface LinkRepositoryRequest {
  projectId: number;
  repositoryFullName: string;
  accessToken: string;
  tokenType?: 'PERSONAL_ACCESS_TOKEN' | 'OAUTH' | 'GITHUB_APP';
}

export interface CreateIssueRequest {
  integrationId: number;
  title: string;
  body?: string;
  labels?: string[];
}

// ── Repository endpoints ────────────────────────────────────────────────────

export async function linkRepository(request: LinkRepositoryRequest): Promise<GithubRepository> {
  const { data } = await api.post<GithubRepository>('/api/github/link', request);
  return data;
}

export async function unlinkRepository(integrationId: number, projectId: number): Promise<void> {
  await api.delete(`/api/github/link/${integrationId}`, { params: { projectId } });
}

export async function getLinkedRepositories(projectId: number): Promise<GithubRepository[]> {
  const { data } = await api.get<GithubRepository[]>(`/api/github/project/${projectId}/repos`);
  return data;
}

// ── Pull Request endpoints ──────────────────────────────────────────────────

export async function getPullRequests(
  projectId: number,
  options: { state?: 'open' | 'closed' | 'merged' | 'all'; page?: number; size?: number } = {}
): Promise<PageResponse<GithubPr>> {
  const { state = 'all', page = 0, size = 20 } = options;
  const { data } = await api.get<PageResponse<GithubPr>>(
    `/api/github/project/${projectId}/pull-requests`,
    { params: { state, page, size } }
  );
  return data;
}

export async function linkTaskToPr(
  projectId: number,
  prId: number,
  taskId: number
): Promise<void> {
  await api.post(`/api/github/project/${projectId}/pull-requests/${prId}/link-task`, { taskId });
}

// ── Commit endpoints ────────────────────────────────────────────────────────

export async function getCommits(
  projectId: number,
  options: { page?: number; size?: number } = {}
): Promise<PageResponse<GithubCommit>> {
  const { page = 0, size = 20 } = options;
  const { data } = await api.get<PageResponse<GithubCommit>>(
    `/api/github/project/${projectId}/commits`,
    { params: { page, size } }
  );
  return data;
}

// ── Issue endpoints ─────────────────────────────────────────────────────────

export async function getIssues(
  projectId: number,
  options: { state?: 'open' | 'closed' | 'all'; page?: number; size?: number } = {}
): Promise<PageResponse<GithubIssue>> {
  const { state = 'open', page = 0, size = 20 } = options;
  const { data } = await api.get<PageResponse<GithubIssue>>(
    `/api/github/project/${projectId}/issues`,
    { params: { state, page, size } }
  );
  return data;
}

export async function createIssue(
  projectId: number,
  request: CreateIssueRequest
): Promise<GithubIssue> {
  const { data } = await api.post<GithubIssue>(
    `/api/github/project/${projectId}/issues`,
    request
  );
  return data;
}

// ── Stats & Sync ────────────────────────────────────────────────────────────

export async function getStats(projectId: number): Promise<GithubStats> {
  const { data } = await api.get<GithubStats>(`/api/github/project/${projectId}/stats`);
  return data;
}

export async function syncProject(projectId: number): Promise<void> {
  await api.post(`/api/github/project/${projectId}/sync`);
}

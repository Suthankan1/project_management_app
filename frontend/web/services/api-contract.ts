import api from '@/lib/axios';
import type {
  User,
  UserProfile,
  Project,
  ProjectMetrics,
  TeamMemberInfo,
  Sprint,
  BurndownResponse,
  MilestoneResponse,
  MilestoneRequest,
  Task,
  Subtask,
  Label,
  TaskAttachmentSummary,
  TaskActivity,
  TaskTemplate,
} from '@/types';
import type {
  ChatMessage,
  ChatReactionSummary,
  ChatRoom,
  ChatSearchResult,
  PresenceResponse,
  UnreadBadgeSummary,
  ChatFeatureFlags,
  DirectChatSummary,
  RoomChatSummary,
  TeamChatSummary,
} from '@/app/(project)/project/[id]/chat/components/chat';

export interface ChatSummaries {
  directSummaries: DirectChatSummary[];
  roomSummaries: RoomChatSummary[];
  teamSummary: TeamChatSummary | null;
}

// ── Date Normalization Utilities ─────────────────────────────────────────────

export function normalizeDate(value: unknown): Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  if (Array.isArray(value)) {
    // Array: [year, month, day, hour, minute, second, ms]
    // Note: Java month is 1-12, JS month is 0-11
    const [year, month, day, hour = 0, minute = 0, second = 0, ms = 0] = value;
    if (year !== undefined && month !== undefined && day !== undefined) {
      const d = new Date(year, month - 1, day, hour, minute, second, ms);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function normalizeDateToISO(value: unknown): string | null {
  const d = normalizeDate(value);
  return d ? d.toISOString() : null;
}

export function formatLocalDate(value: unknown): string | null {
  const d = normalizeDate(value);
  if (!d) return null;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// ── Shared Types / DTOs ──────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface ProjectSummary {
  id: number;
  name: string;
  projectKey?: string;
  type?: 'AGILE' | 'KANBAN';
  teamId?: number;
  teamName?: string;
  ownerId?: number;
  ownerName?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
  isFavorite?: boolean;
  [key: string]: unknown;
}

export interface Member {
  id: number;
  userId: number;
  username: string;
  email: string;
  role: string;
  joinedAt: string;
}

export interface PendingInvite {
  id: number;
  email: string;
  role: string;
  invitedAt: string;
}

export interface TaskAttachment {
  id: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  downloadUrl: string;
  uploadedByName: string;
  createdAt: string;
}

export interface UploadInitRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface UploadInitResponse {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}

export interface UploadFinalizeRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
  objectKey: string;
}

export interface Comment {
  id: number;
  content: string;
  authorName: string;
  createdAt: string;
}

export interface PageSummaryDto {
  id: number;
  title: string;
}

export interface PageDetailDto {
  id: number;
  title: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface NotificationPreferenceRow {
  id?: number;
  projectId: number | null;
  eventType: string;
  channel: 'IN_APP' | 'EMAIL';
  enabled: boolean;
}

export interface UpdateNotificationPreferenceRequest {
  projectId: number | null;
  eventType: string;
  channel: 'IN_APP' | 'EMAIL';
  enabled: boolean;
}

export interface NotificationDto {
  id: number;
  message: string;
  type?: string;
  link?: string;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
}

export interface NotificationFeedResponse {
  notifications: NotificationDto[];
  unreadCount: number;
}

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

export interface GithubAutomationRule {
  id: number;
  projectId: number;
  trigger: string;
  action: string;
  enabled: boolean;
  config: Record<string, string>;
}

export interface GithubAutomationLog {
  id: number;
  ruleId: number;
  trigger: string;
  action: string;
  context: string;
  outcome: string;
  message: string;
  executedAt: string;
}

export interface ScheduledReportRequest {
  projectId: number;
  format: 'PDF' | 'EXCEL' | 'BOTH';
  scheduleType: 'ONE_TIME' | 'RECURRING';
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  customIntervalDays?: number;
  sendTime: string;
  sendDayOfWeek?: number;
  sendDayOfMonth?: number;
  scheduledDate?: string;
  timezone?: string;
  recipientsTo: string[];
  recipientsCc?: string[];
  recipientsBcc?: string[];
  subject?: string;
  bodyMessage?: string;
  endType?: 'AFTER_N' | 'UNTIL_DATE' | 'MANUAL';
  endAfterCount?: number;
  endDate?: string;
}

export interface ScheduledReportResponse {
  id: number;
  projectId: number;
  format: 'PDF' | 'EXCEL' | 'BOTH';
  scheduleType: 'ONE_TIME' | 'RECURRING';
  frequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
  customIntervalDays?: number;
  sendTime: string;
  sendDayOfWeek?: number;
  sendDayOfMonth?: number;
  scheduledDate?: string;
  timezone?: string;
  recipientsTo: string[];
  recipientsCc?: string[];
  recipientsBcc?: string[];
  subject?: string;
  bodyMessage?: string;
  endType?: 'AFTER_N' | 'UNTIL_DATE' | 'MANUAL';
  endAfterCount?: number;
  endDate?: string;
  sendCount: number;
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';
  nextSendAt?: string;
  lastSentAt?: string;
  createdAt: string;
}

export interface PortfolioProject {
  id: number;
  name: string;
  projectKey: string;
  description?: string;
  type: 'AGILE' | 'KANBAN';
  ownerId: number;
  ownerName: string;
  teamId: number;
  teamName: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Portfolio {
  id: number;
  name: string;
  description?: string;
  color: string;
  emoji?: string;
  ownerId: number;
  ownerName: string;
  projectCount: number;
  projects?: PortfolioProject[];
  totalTasks?: number;
  completedTasks?: number;
  overdueTasks?: number;
  totalMembers?: number;
  healthScore?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface CreatePortfolioPayload {
  name: string;
  description?: string;
  color?: string;
  emoji?: string;
  projectIds?: number[];
}

export interface ChatInboxActivity {
  projectId: number;
  projectName: string;
  chatType: 'TEAM' | 'ROOM' | 'DIRECT';
  roomId?: number | null;
  roomName?: string | null;
  username?: string | null;
  participantLabel?: string | null;
  lastMessage?: string | null;
  lastMessageSender?: string | null;
  lastMessageTimestamp?: string | null;
  unseenCount: number;
  unread: boolean;
  activityStatus: 'UNREAD' | 'READ';
}

export interface ChatInboxProjectGroup {
  projectId: number;
  projectName: string;
  unreadCount: number;
  totalItems: number;
  activities: ChatInboxActivity[];
}

export interface ChatInboxResponse {
  recentActivities: ChatInboxActivity[];
  projects: ChatInboxProjectGroup[];
  totalProjects: number;
  totalActivities: number;
  totalUnread: number;
}

export interface AuthUserSummary {
  email?: string;
  username?: string;
}

export interface KanbanColumnConfig {
  id: number;
  status: string;
  name: string;
  title: string;
  color: string;
  wipLimit: number;
}

export interface KanbanBoardResponse {
  kanbanId: number;
  name: string;
  projectId: number;
  columns: KanbanColumnConfig[];
}

export interface SprintboardTask {
  taskId: number;
  projectTaskNumber?: number;
  title: string;
  storyPoint: number;
  assigneeName?: string;
  assigneePhotoUrl?: string;
  status: string;
  priority: string;
  dueDate?: string;
  updatedAt?: string;
  attachmentCount?: number;
  commentCount?: number;
  labelName?: string;
  labelColor?: string;
  label?: { name: string; color?: string };
}

export interface SprintboardColumn {
  id: number;
  columnName: string;
  columnStatus: string;
  position: number;
  tasks: SprintboardTask[];
}

export interface Sprintboard {
  id: number;
  sprintId: number;
  sprintName: string;
  sprintStatus: string;
  createdAt?: string;
  updatedAt?: string;
  columns: SprintboardColumn[];
}

export interface SprintboardFullResponse extends Sprintboard {
  stats: {
    totalTasks: number;
    doneTasks: number;
    totalStoryPoints: number;
    doneStoryPoints: number;
    overdueTasks: number;
    unassignedTasks: number;
  };
}

// ── Domain API Interfaces ────────────────────────────────────────────────────

export const authApi = {
  login: async (credentials: Record<string, unknown>): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data } = await api.post('/api/auth/login', credentials);
    return data;
  },
  register: async (payload: Record<string, unknown>): Promise<void> => {
    await api.post('/api/auth/register', payload);
  },
  forgotPassword: async (payload: { email: string }): Promise<{ message?: string }> => {
    const { data } = await api.post('/api/auth/forgot', payload);
    return data;
  },
  resetPassword: async (payload: Record<string, unknown>): Promise<void> => {
    await api.post('/api/auth/reset', payload);
  },
  verifyEmail: async (payload: { email: string; otp: string }): Promise<void> => {
    await api.post('/api/auth/reg/verify', payload);
  },
  resendOtp: async (payload: { email: string }): Promise<{ message?: string }> => {
    const { data } = await api.post('/api/auth/resend', payload);
    return data;
  },
  getCurrentUser: async (): Promise<{ username: string; email?: string; fullName?: string }> => {
    const { data } = await api.get('/api/user/me');
    return data;
  },
  getAllUsers: async (): Promise<AuthUserSummary[]> => {
    const { data } = await api.get('/api/auth/users');
    return data;
  },
};

export const projectsApi = {
  list: async (): Promise<ProjectSummary[]> => {
    const { data } = await api.get('/api/projects');
    return data;
  },
  getRecent: async (limit = 10): Promise<ProjectSummary[]> => {
    const { data } = await api.get('/api/projects/recent', { params: { limit } });
    return data;
  },
  getFavorites: async (): Promise<ProjectSummary[]> => {
    const { data } = await api.get('/api/projects/favorites');
    return data;
  },
  get: async (projectId: number | string): Promise<ProjectSummary> => {
    const { data } = await api.get(`/api/projects/${projectId}`);
    return data;
  },
  getMetrics: async (projectId: number | string): Promise<ProjectMetrics> => {
    const { data } = await api.get(`/api/projects/${projectId}/metrics`);
    return data;
  },
  recordAccess: async (projectId: number | string): Promise<void> => {
    await api.post(`/api/projects/${projectId}/access`);
  },
  toggleFavorite: async (projectId: number | string): Promise<void> => {
    await api.post(`/api/projects/${projectId}/favorite`);
  },
  update: async (projectId: number | string, payload: Record<string, unknown>): Promise<ProjectSummary> => {
    const { data } = await api.put(`/api/projects/${projectId}`, payload);
    return data;
  },
  delete: async (projectId: number | string, teamId: number | string): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/team/${teamId}`);
  },
  leave: async (projectId: number | string): Promise<void> => {
    await api.post(`/api/projects/${projectId}/leave`);
  },
  getMembers: async (projectId: number | string): Promise<Member[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/members`);
    return data;
  },
  getPendingInvites: async (projectId: number | string): Promise<PendingInvite[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/pending-invites`);
    return data;
  },
  changeMemberRole: async (projectId: number | string, userId: number, role: string): Promise<void> => {
    await api.patch(`/api/projects/${projectId}/members/${userId}/role`, { role, userId });
  },
  removeMember: async (projectId: number | string, userId: number): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/members/${userId}`);
  },
  sendInvite: async (projectId: number | string, email: string, role: string): Promise<void> => {
    await api.post(`/api/projects/${projectId}/invitations`, { email, role });
  },
  acceptInvitation: async (token: string): Promise<void> => {
    await api.post('/api/projects/invitations/accept', { token });
  },
  checkKey: async (key: string): Promise<boolean> => {
    const { data } = await api.get(`/api/projects/check-key?key=${encodeURIComponent(key)}`);
    return data;
  },
  checkTeamName: async (name: string): Promise<{ exists: boolean; isMember: boolean }> => {
    const { data } = await api.get(`/api/teams/check-name?name=${encodeURIComponent(name)}`);
    return data;
  },
  create: async (payload: Record<string, unknown>): Promise<ProjectSummary> => {
    const { data } = await api.post('/api/projects', payload);
    return data;
  },
  getCustomFields: async (projectId: number | string): Promise<any[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/custom-fields`);
    return data;
  },
  createCustomField: async (projectId: number | string, payload: Record<string, unknown>): Promise<any> => {
    const { data } = await api.post(`/api/projects/${projectId}/custom-fields`, payload);
    return data;
  },
  getTeamMembers: async (teamId: number | string): Promise<any> => {
    const { data } = await api.get(`/api/teams/${teamId}/members`);
    return data;
  },
};

export const tasksApi = {
  listByProject: async (projectId: number | string, params?: Record<string, unknown>): Promise<PageResponse<Task>> => {
    const { data } = await api.get(`/api/tasks/project/${projectId}`, { params });
    return data;
  },
  listAllByProject: async (projectId: number | string, params?: Record<string, unknown>): Promise<Task[]> => {
    const { data } = await api.get(`/api/tasks/project/${projectId}/all`, { params });
    return data;
  },
  get: async (taskId: number | string): Promise<Task> => {
    const { data } = await api.get(`/api/tasks/${taskId}`);
    return data;
  },
  create: async (payload: Record<string, unknown>): Promise<Task> => {
    const { data } = await api.post('/api/tasks', payload);
    return data;
  },
  update: async (taskId: number | string, payload: Record<string, unknown>): Promise<Task> => {
    const { data } = await api.put(`/api/tasks/${taskId}`, payload);
    return data;
  },
  delete: async (taskId: number | string): Promise<void> => {
    await api.delete(`/api/tasks/${taskId}`);
  },
  archive: async (taskId: number | string): Promise<Task> => {
    const { data } = await api.patch(`/api/tasks/${taskId}/archive`);
    return data;
  },
  unarchive: async (taskId: number | string): Promise<Task> => {
    const { data } = await api.patch(`/api/tasks/${taskId}/unarchive`);
    return data;
  },
  getArchived: async (projectId: number | string): Promise<Task[]> => {
    const { data } = await api.get(`/api/tasks/project/${projectId}/archived`);
    return data;
  },
  updateStatus: async (taskId: number | string, status: string): Promise<Task> => {
    const { data } = await api.patch(`/api/tasks/${taskId}/status`, { status });
    return data;
  },
  updateDates: async (taskId: number | string, payload: { startDate?: string | null; dueDate?: string | null }): Promise<void> => {
    await api.patch(`/api/tasks/${taskId}/dates`, payload);
  },
  saveAsTemplate: async (taskId: number | string, payload: { templateName: string }): Promise<void> => {
    await api.post(`/api/tasks/${taskId}/save-as-template`, payload);
  },
  createSubtask: async (taskId: number | string, payload: { title: string; status: string }): Promise<Subtask> => {
    const { data } = await api.post(`/api/tasks/${taskId}/subtasks`, payload);
    return data;
  },
  getComments: async (taskId: number | string): Promise<Comment[]> => {
    const { data } = await api.get(`/api/tasks/${taskId}/comments`);
    return data;
  },
  postComment: async (taskId: number | string, payload: { content: string }): Promise<Comment> => {
    const { data } = await api.post(`/api/tasks/${taskId}/comments`, payload);
    return data;
  },
  addDependency: async (taskId: number | string, blockerId: number): Promise<void> => {
    await api.post(`/api/tasks/${taskId}/dependencies/${blockerId}`);
  },
  getAttachments: async (taskId: number | string): Promise<TaskAttachment[]> => {
    const { data } = await api.get(`/api/tasks/${taskId}/attachments`);
    return data;
  },
  initAttachmentUpload: async (taskId: number | string, payload: UploadInitRequest): Promise<UploadInitResponse> => {
    const { data } = await api.post(`/api/tasks/${taskId}/attachments/upload/init`, payload);
    return data;
  },
  finalizeAttachmentUpload: async (taskId: number | string, payload: UploadFinalizeRequest): Promise<TaskAttachment> => {
    const { data } = await api.post(`/api/tasks/${taskId}/attachments/upload/finalize`, payload);
    return data;
  },
  uploadAttachmentFallback: async (taskId: number | string, formData: FormData): Promise<TaskAttachment> => {
    const { data } = await api.post(`/api/tasks/${taskId}/attachments/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteAttachment: async (taskId: number | string, attachmentId: number): Promise<void> => {
    await api.delete(`/api/tasks/${taskId}/attachments/${attachmentId}`);
  },
  bulkUpdateStatus: async (payload: { taskIds: number[]; status: string }): Promise<void> => {
    await api.patch('/api/tasks/bulk/status', payload);
  },
  bulkDelete: async (payload: { taskIds: number[] }): Promise<void> => {
    await api.delete('/api/tasks/bulk', { data: payload });
  },
  assignTaskSingle: async (taskId: number | string, userId: number): Promise<void> => {
    await api.patch(`/api/tasks/${taskId}/assign/${userId}`);
  },
  assignTaskMultiple: async (taskId: number | string, payload: { assigneeIds: number[] }): Promise<void> => {
    await api.patch(`/api/tasks/${taskId}/assignees`, payload);
  },
  getCalendarEvents: async (projectId: number | string): Promise<any[]> => {
    const { data } = await api.get(`/api/calendar/events?projectId=${projectId}`);
    return data;
  },
};

export const sprintsApi = {
  listByProject: async (projectId: number | string): Promise<Sprint[]> => {
    const { data } = await api.get(`/api/sprints/project/${projectId}`);
    return data;
  },
  create: async (payload: Record<string, unknown>): Promise<Sprint> => {
    const { data } = await api.post('/api/sprints', payload);
    return data;
  },
  update: async (sprintId: number | string, payload: Record<string, unknown>): Promise<Sprint> => {
    const { data } = await api.put(`/api/sprints/${sprintId}`, payload);
    return data;
  },
  delete: async (sprintId: number | string): Promise<void> => {
    await api.delete(`/api/sprints/${sprintId}`);
  },
  complete: async (sprintId: number | string): Promise<void> => {
    await api.put(`/api/sprints/${sprintId}/complete`);
  },
  getBurndown: async (sprintId: number | string): Promise<BurndownResponse> => {
    const { data } = await api.get(`/api/burndown/sprint/${sprintId}`);
    return data;
  },
};

export const sprintboardsApi = {
  get: async (sprintId: number | string): Promise<Sprintboard> => {
    const { data } = await api.get(`/api/sprintboards/sprint/${sprintId}`);
    return {
      ...data,
      columns: data.columns?.map((col: any) => ({
        ...col,
        tasks: []
      }))
    };
  },
  getFull: async (sprintId: number | string): Promise<SprintboardFullResponse> => {
    const { data } = await api.get(`/api/sprintboards/sprint/${sprintId}/full`);
    return {
      ...data,
      columns: data.columns?.map((col: any) => ({
        ...col,
        tasks: col.tasks?.map((t: any) => ({
          ...t,
          label: t.labelName ? { name: t.labelName, color: t.labelColor } : undefined
        })) || []
      }))
    };
  },
  getRecent: async (limit = 20): Promise<any> => {
    const { data } = await api.get('/api/sprintboards/user/recent', { params: { limit } });
    return data;
  },
  getTasksInColumn: async (sprintboardId: number | string, columnStatus: string): Promise<SprintboardTask[]> => {
    const { data } = await api.get(`/api/sprintboards/${sprintboardId}/columns/${columnStatus}/tasks`);
    return data.map((t: any) => ({
      ...t,
      label: t.labelName ? { name: t.labelName, color: t.labelColor } : undefined
    }));
  },
  moveTask: async (taskId: number | string, payload: { sprintboardId: number; newColumnStatus: string }): Promise<void> => {
    await api.put(`/api/sprintboards/tasks/${taskId}/move`, payload);
  },
  addColumn: async (sprintboardId: number | string, payload: { name: string; status: string }): Promise<any> => {
    const { data } = await api.post(`/api/sprintboards/${sprintboardId}/columns`, payload);
    return data;
  },
  reorderColumns: async (sprintboardId: number | string, reorderRequest: Array<{ id: number; position: number }>): Promise<void> => {
    await api.patch(`/api/sprintboards/${sprintboardId}/columns/reorder`, reorderRequest);
  },
};

export const kanbanApi = {
  getBoard: async (projectId: number | string): Promise<KanbanBoardResponse> => {
    const { data } = await api.get(`/api/kanbans/project/${projectId}/board`);
    return {
      ...data,
      columns: data.columns?.map((col: any) => ({
        ...col,
        name: col.name || col.title || '',
        title: col.title || col.name || '',
      })) || [],
    };
  },
  createColumn: async (payload: { kanbanId: number; name: string; position: number }): Promise<any> => {
    const { data } = await api.post('/api/kanban-columns', payload);
    return data;
  },
  deleteColumn: async (columnId: number | string): Promise<void> => {
    await api.delete(`/api/kanban-columns/${columnId}`);
  },
  reorderColumns: async (reorderRequest: Array<{ id: number; position: number }>): Promise<void> => {
    await api.patch('/api/kanban-columns/reorder', reorderRequest);
  },
  renameColumn: async (columnId: number | string, payload: { name: string }): Promise<void> => {
    await api.patch(`/api/kanban-columns/${columnId}/rename`, payload);
  },
  updateColumnSettings: async (columnId: number | string, settings: { color?: string; wipLimit?: number }): Promise<void> => {
    await api.patch(`/api/kanban-columns/${columnId}/settings`, settings);
  },
};

export const labelsApi = {
  listByProject: async (projectId: number | string): Promise<Label[]> => {
    const { data } = await api.get(`/api/labels/project/${projectId}`);
    return data;
  },
  create: async (payload: { projectId: number; name: string; color: string }): Promise<Label> => {
    const { data } = await api.post('/api/labels', payload);
    return data;
  },
  update: async (id: number | string, payload: { name: string; color: string }): Promise<Label> => {
    const { data } = await api.put(`/api/labels/${id}`, payload);
    return data;
  },
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/labels/${id}`);
  },
};

export const milestonesApi = {
  listByProject: async (projectId: number | string): Promise<MilestoneResponse[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/milestones`);
    return data;
  },
  get: async (milestoneId: number | string): Promise<MilestoneResponse> => {
    const { data } = await api.get(`/api/milestones/${milestoneId}`);
    return data;
  },
  create: async (projectId: number | string, payload: MilestoneRequest): Promise<MilestoneResponse> => {
    const { data } = await api.post(`/api/projects/${projectId}/milestones`, payload);
    return data;
  },
  update: async (milestoneId: number | string, payload: MilestoneRequest): Promise<MilestoneResponse> => {
    const { data } = await api.put(`/api/milestones/${milestoneId}`, payload);
    return data;
  },
  delete: async (milestoneId: number | string): Promise<void> => {
    await api.delete(`/api/milestones/${milestoneId}`);
  },
  assignTask: async (taskId: number | string, milestoneId: number | null): Promise<void> => {
    await api.patch(`/api/tasks/${taskId}/milestone`, { milestoneId });
  },
};

export const documentsApi = {
  listByProject: async (projectId: number | string, includeDeleted = false): Promise<any[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/documents`, {
      params: { includeDeleted },
    });
    return data;
  },
};

export const pagesApi = {
  listByProject: async (projectId: number | string): Promise<PageSummaryDto[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/pages`);
    return data;
  },
  get: async (pageId: number | string): Promise<PageDetailDto> => {
    const { data } = await api.get(`/api/pages/${pageId}`);
    return data;
  },
  create: async (projectId: number | string, payload: { title: string; content: string }): Promise<PageDetailDto> => {
    const { data } = await api.post(`/api/projects/${projectId}/pages`, payload);
    return data;
  },
  update: async (pageId: number | string, payload: { title: string; content: string }): Promise<PageDetailDto> => {
    const { data } = await api.put(`/api/pages/${pageId}`, payload);
    return data;
  },
  delete: async (pageId: number | string): Promise<void> => {
    await api.delete(`/api/pages/${pageId}`);
  },
};

export const chatApi = {
  getSummaries: async (projectId: number | string): Promise<ChatSummaries> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/summaries`);
    return data;
  },
  markTeamRead: async (projectId: number | string): Promise<void> => {
    await api.post(`/api/projects/${projectId}/chat/team/read`);
  },
  markRoomRead: async (projectId: number | string, roomId: number): Promise<void> => {
    await api.post(`/api/projects/${projectId}/chat/rooms/${roomId}/read`);
  },
  markDirectRead: async (projectId: number | string, withUser: string): Promise<void> => {
    await api.post(`/api/projects/${projectId}/chat/direct/read`, null, {
      params: { with: withUser },
    });
  },
  getPresence: async (projectId: number | string): Promise<PresenceResponse> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/presence`);
    return data;
  },
  postTelemetry: async (projectId: number | string, payload: { action: string; target: string; details?: string }): Promise<void> => {
    await api.post(`/api/projects/${projectId}/chat/telemetry`, payload);
  },
  getFeatureFlags: async (projectId: number | string): Promise<ChatFeatureFlags> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/features`);
    return data;
  },
  getUnreadBadge: async (projectId: number | string): Promise<UnreadBadgeSummary> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/unread-badge`);
    return data;
  },
  searchMessages: async (projectId: number | string, query: string): Promise<ChatSearchResult[]> => {
    const { data } = await api.get<{ messages: ChatSearchResult[] }>('/api/search', {
      params: { q: query, projectId },
    });
    return data.messages || [];
  },
  getMembers: async (projectId: number | string): Promise<string[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/members`);
    return data;
  },
  getInbox: async (params?: { projectLimit?: number; activityLimit?: number; status?: 'all' | 'unread' }): Promise<ChatInboxResponse> => {
    const { data } = await api.get('/api/chat/inbox', { params });
    return data;
  },
  getTeamMessages: async (projectId: number | string): Promise<ChatMessage[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/messages`);
    return data;
  },
  getRoomMessages: async (projectId: number | string, roomId: number): Promise<ChatMessage[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/messages`, {
      params: { roomId },
    });
    return data;
  },
  getPrivateMessages: async (projectId: number | string, currentUser: string, withUser: string): Promise<ChatMessage[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/messages`, {
      params: { recipient: currentUser, with: withUser },
    });
    return data;
  },
  editMessage: async (projectId: number | string, messageId: number, content: string): Promise<ChatMessage> => {
    const { data } = await api.patch(`/api/projects/${projectId}/chat/messages/${messageId}`, {
      content,
      formatType: 'PLAIN',
    });
    return data;
  },
  deleteMessage: async (projectId: number | string, messageId: number): Promise<ChatMessage> => {
    const { data } = await api.delete(`/api/projects/${projectId}/chat/messages/${messageId}`);
    return data;
  },
  getThreadMessages: async (projectId: number | string, parentMessageId: number): Promise<ChatMessage[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/messages/${parentMessageId}/thread`);
    return data;
  },
  postThreadReply: async (projectId: number | string, parentMessageId: number, content: string): Promise<ChatMessage> => {
    const { data } = await api.post(`/api/projects/${projectId}/chat/messages/${parentMessageId}/thread/replies`, {
      content,
      formatType: 'PLAIN',
    });
    return data;
  },
  getMessageReactions: async (projectId: number | string, messageId: number): Promise<ChatReactionSummary[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/messages/${messageId}/reactions`);
    return data;
  },
  toggleReaction: async (projectId: number | string, messageId: number, emoji: string): Promise<ChatReactionSummary[]> => {
    const { data } = await api.post(`/api/projects/${projectId}/chat/messages/${messageId}/reactions/toggle`, {
      emoji,
    });
    return data;
  },
  getRooms: async (projectId: number | string): Promise<ChatRoom[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/rooms`);
    return data;
  },
  createRoom: async (projectId: number | string, payload: { name: string; members: string[] }): Promise<ChatRoom> => {
    const { data } = await api.post(`/api/projects/${projectId}/chat/rooms`, payload);
    return data;
  },
  deleteRoom: async (projectId: number | string, roomId: number): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/chat/rooms/${roomId}`);
  },
  updateRoomMeta: async (projectId: number | string, roomId: number, updates: { name?: string; topic?: string; description?: string }): Promise<ChatRoom> => {
    const { data } = await api.patch(`/api/projects/${projectId}/chat/rooms/${roomId}/meta`, updates);
    return data;
  },
  pinRoomMessage: async (projectId: number | string, roomId: number, messageId: number | null): Promise<ChatRoom> => {
    const { data } = await api.patch(`/api/projects/${projectId}/chat/rooms/${roomId}/pin`, { messageId });
    return data;
  },
};

export const notificationsApi = {
  list: async (): Promise<NotificationFeedResponse> => {
    const { data } = await api.get('/api/notifications');
    return data;
  },
  markRead: async (id: number | string): Promise<void> => {
    await api.patch(`/api/notifications/${id}/read`);
  },
  markAllRead: async (): Promise<void> => {
    await api.patch('/api/notifications/read-all');
  },
  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/api/notifications/${id}`);
  },
  getPreferences: async (projectId?: number): Promise<NotificationPreferenceRow[]> => {
    const { data } = await api.get('/api/notification-preferences', {
      params: projectId == null ? undefined : { projectId },
    });
    return data;
  },
  updatePreference: async (payload: UpdateNotificationPreferenceRequest): Promise<NotificationPreferenceRow> => {
    const { data } = await api.put('/api/notification-preferences', payload);
    return data;
  },
};

export const gitHubApi = {
  getAutomationRules: async (projectId: number | string): Promise<GithubAutomationRule[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/automations/github`);
    return data || [];
  },
  getAutomationLogs: async (projectId: number | string): Promise<GithubAutomationLog[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/automations/github/logs`);
    return data || [];
  },
  createAutomationRule: async (projectId: number | string, payload: Record<string, unknown>): Promise<GithubAutomationRule> => {
    const { data } = await api.post(`/api/projects/${projectId}/automations/github`, payload);
    return data;
  },
  deleteAutomationRule: async (projectId: number | string, ruleId: number): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/automations/github/${ruleId}`);
  },
  setAutomationRuleEnabled: async (projectId: number | string, ruleId: number, enabled: boolean): Promise<GithubAutomationRule> => {
    const { data } = await api.patch(`/api/projects/${projectId}/automations/github/${ruleId}/enabled`, null, {
      params: { enabled },
    });
    return data;
  },
  linkRepository: async (payload: LinkRepositoryRequest): Promise<GithubRepository> => {
    const { data } = await api.post('/api/github/link', payload);
    return data;
  },
  unlinkRepository: async (integrationId: number, projectId: number): Promise<void> => {
    await api.delete(`/api/github/link/${integrationId}`, { params: { projectId } });
  },
  getLinkedRepositories: async (projectId: number): Promise<GithubRepository[]> => {
    const { data } = await api.get(`/api/github/project/${projectId}/repos`);
    return data;
  },
  getPullRequests: async (projectId: number, options: { state?: string; page?: number; size?: number } = {}): Promise<PageResponse<GithubPr>> => {
    const { state = 'all', page = 0, size = 20 } = options;
    const { data } = await api.get(`/api/github/project/${projectId}/pull-requests`, {
      params: { state, page, size },
    });
    return data;
  },
  linkTaskToPr: async (projectId: number, prId: number, taskId: number): Promise<void> => {
    await api.post(`/api/github/project/${projectId}/pull-requests/${prId}/link-task`, { taskId });
  },
  getCommits: async (projectId: number, options: { page?: number; size?: number } = {}): Promise<PageResponse<GithubCommit>> => {
    const { page = 0, size = 20 } = options;
    const { data } = await api.get(`/api/github/project/${projectId}/commits`, {
      params: { page, size },
    });
    return data;
  },
  getIssues: async (projectId: number, options: { state?: string; page?: number; size?: number } = {}): Promise<PageResponse<GithubIssue>> => {
    const { state = 'open', page = 0, size = 20 } = options;
    const { data } = await api.get(`/api/github/project/${projectId}/issues`, {
      params: { state, page, size },
    });
    return data;
  },
  createIssue: async (projectId: number, payload: CreateIssueRequest): Promise<GithubIssue> => {
    const { data } = await api.post(`/api/github/project/${projectId}/issues`, payload);
    return data;
  },
  getStats: async (projectId: number): Promise<GithubStats> => {
    const { data } = await api.get(`/api/github/project/${projectId}/stats`);
    return data;
  },
  syncProject: async (projectId: number): Promise<void> => {
    await api.post(`/api/github/project/${projectId}/sync`);
  },
  fetchRepositories: async (): Promise<any[]> => {
    const { data } = await api.get('/api/github/repositories');
    return data;
  },
};

export const reportsApi = {
  createScheduled: async (payload: ScheduledReportRequest): Promise<ScheduledReportResponse> => {
    const { data } = await api.post('/api/scheduled-reports', payload);
    return data;
  },
  listScheduled: async (projectId: number): Promise<ScheduledReportResponse[]> => {
    const { data } = await api.get(`/api/scheduled-reports/project/${projectId}`);
    return data;
  },
  deleteScheduled: async (id: number): Promise<void> => {
    await api.delete(`/api/scheduled-reports/${id}`);
  },
  pauseScheduled: async (id: number): Promise<ScheduledReportResponse> => {
    const { data } = await api.patch(`/api/scheduled-reports/${id}/pause`);
    return data;
  },
  resumeScheduled: async (id: number): Promise<ScheduledReportResponse> => {
    const { data } = await api.patch(`/api/scheduled-reports/${id}/resume`);
    return data;
  },
  download: async (projectId: number, format: 'PDF' | 'EXCEL'): Promise<any> => {
    return api.get(`/api/projects/${projectId}/reports/download`, {
      params: { format },
      responseType: 'arraybuffer',
    });
  },
};

export const portfoliosApi = {
  list: async (): Promise<Portfolio[]> => {
    const { data } = await api.get('/api/portfolios');
    return data;
  },
  get: async (id: number): Promise<Portfolio> => {
    const { data } = await api.get(`/api/portfolios/${id}`);
    return data;
  },
  create: async (payload: CreatePortfolioPayload): Promise<Portfolio> => {
    const { data } = await api.post('/api/portfolios', payload);
    return data;
  },
  update: async (id: number, payload: Partial<CreatePortfolioPayload>): Promise<Portfolio> => {
    const { data } = await api.put(`/api/portfolios/${id}`, payload);
    return data;
  },
  remove: async (id: number): Promise<void> => {
    await api.delete(`/api/portfolios/${id}`);
  },
  addProject: async (portfolioId: number, projectId: number): Promise<Portfolio> => {
    const { data } = await api.post(`/api/portfolios/${portfolioId}/projects/${projectId}`);
    return data;
  },
  removeProject: async (portfolioId: number, projectId: number): Promise<void> => {
    await api.delete(`/api/portfolios/${portfolioId}/projects/${projectId}`);
  },
};

export const apiContract = {
  auth: authApi,
  projects: projectsApi,
  tasks: tasksApi,
  sprints: sprintsApi,
  sprintboards: sprintboardsApi,
  kanban: kanbanApi,
  labels: labelsApi,
  milestones: milestonesApi,
  documents: documentsApi,
  pages: pagesApi,
  chat: chatApi,
  notifications: notificationsApi,
  GitHub: gitHubApi,
  reports: reportsApi,
  portfolios: portfoliosApi,
};

export default apiContract;

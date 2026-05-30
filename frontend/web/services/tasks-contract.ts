import api from '@/lib/axios';
import { formatLocalDate } from './contract-common';
import type { PageResponse } from './contract-common';
import type {
  Sprint,
  BurndownResponse,
  MilestoneResponse,
  MilestoneRequest,
  Task,
  Subtask,
  Label,
} from '@/types';

export interface TaskCommentDto {
  id: number;
  text: string;
  authorName: string;
  createdAt: string;
}

export interface AssignedTaskQueryParams {
  limit?: number;
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
    await api.patch(`/api/tasks/${taskId}/dates`, {
      startDate: payload.startDate == null ? payload.startDate : formatLocalDate(payload.startDate),
      dueDate: payload.dueDate == null ? payload.dueDate : formatLocalDate(payload.dueDate),
    });
  },
  saveAsTemplate: async (taskId: number | string, payload: { templateName: string }): Promise<void> => {
    await api.post(`/api/tasks/${taskId}/save-as-template`, payload);
  },
  createSubtask: async (taskId: number | string, payload: { title: string; status: string }): Promise<Subtask> => {
    const { data } = await api.post(`/api/tasks/${taskId}/subtasks`, payload);
    return data;
  },
  getComments: async (taskId: number | string): Promise<TaskCommentDto[]> => {
    const { data } = await api.get(`/api/tasks/${taskId}/comments`);
    return data;
  },
  postComment: async (taskId: number | string, payload: { content: string }): Promise<TaskCommentDto> => {
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
  reorderTasks: async (payload: Record<string, unknown>): Promise<void> => {
    await api.patch('/api/tasks/reorder', payload);
  },
  assignTaskSingle: async (taskId: number | string, userId: number): Promise<void> => {
    await api.patch(`/api/tasks/${taskId}/assign/${userId}`);
  },
  assignTaskMultiple: async (taskId: number | string, payload: { assigneeIds: number[] }): Promise<void> => {
    await api.patch(`/api/tasks/${taskId}/assignees`, payload);
  },
  getCalendarEvents: async (projectId: number | string): Promise<Record<string, unknown>[]> => {
    const { data } = await api.get(`/api/calendar/events?projectId=${projectId}`);
    return data;
  },
  getAssigned: async (params?: AssignedTaskQueryParams): Promise<Task[]> => {
    const { data } = await api.get('/api/tasks/assigned', {
      params,
    });
    return data;
  },
  getWorkedOn: async (params?: AssignedTaskQueryParams): Promise<Task[]> => {
    const { data } = await api.get('/api/tasks/worked-on', {
      params,
    });
    return data;
  },
  getRecent: async (params?: AssignedTaskQueryParams): Promise<Task[]> => {
    const { data } = await api.get('/api/tasks/recent', {
      params,
    });
    return data;
  },
  addLabel: async (taskId: number | string, labelId: number | string): Promise<void> => {
    await api.post(`/api/tasks/${taskId}/label/${labelId}`);
  },
  removeLabel: async (taskId: number | string, labelId: number | string): Promise<void> => {
    await api.delete(`/api/tasks/${taskId}/label/${labelId}`);
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
      columns: data.columns?.map((col: Record<string, unknown>) => ({
        ...col,
        tasks: []
      }))
    };
  },
  getFull: async (sprintId: number | string): Promise<SprintboardFullResponse> => {
    const { data } = await api.get(`/api/sprintboards/sprint/${sprintId}/full`);
    return {
      ...data,
      columns: data.columns?.map((col: Record<string, unknown> & { tasks?: Record<string, unknown>[] }) => ({
        ...col,
        tasks: col.tasks?.map((t: Record<string, unknown> & { labelName?: string; labelColor?: string }) => ({
          ...t,
          label: t.labelName ? { name: t.labelName, color: t.labelColor } : undefined
        })) || []
      }))
    };
  },
  getRecent: async (limit = 20): Promise<unknown> => {
    const { data } = await api.get('/api/sprintboards/user/recent', { params: { limit } });
    return data;
  },
  getTasksInColumn: async (sprintboardId: number | string, columnStatus: string): Promise<SprintboardTask[]> => {
    const { data } = await api.get(`/api/sprintboards/${sprintboardId}/columns/${columnStatus}/tasks`);
    return data.map((t: Record<string, unknown> & { labelName?: string; labelColor?: string }) => ({
      ...t,
      label: t.labelName ? { name: t.labelName, color: t.labelColor } : undefined
    }));
  },
  moveTask: async (taskId: number | string, payload: { sprintboardId: number; newColumnStatus: string }): Promise<void> => {
    await api.put(`/api/sprintboards/tasks/${taskId}/move`, payload);
  },
  addColumn: async (sprintboardId: number | string, payload: { name: string; status: string }): Promise<unknown> => {
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
      columns: data.columns?.map((col: Record<string, unknown> & { name?: string; title?: string }) => ({
        ...col,
        name: col.name || col.title || '',
        title: col.title || col.name || '',
      })) || [],
    };
  },
  createColumn: async (payload: { kanbanId: number; name: string; position: number }): Promise<unknown> => {
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

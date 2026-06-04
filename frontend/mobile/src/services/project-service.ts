import api from '../api/axios';

export type ProjectType = 'AGILE' | 'KANBAN';

export interface ProjectDetails {
  id: number;
  name: string;
  projectKey?: string;
  description?: string;
  type?: ProjectType;
  createdAt?: string;
  updatedAt?: string;
  ownerId?: number;
  ownerName?: string;
  teamId?: number;
  teamName?: string;
  isFavorite?: boolean;
}

export interface UpdateProjectPayload {
  name?: string;
  description?: string;
  type?: ProjectType;
}

export const projectService = {
  get: (projectId: number | string): Promise<ProjectDetails> =>
    api.get<ProjectDetails>(`/api/projects/${projectId}`).then(r => r.data),

  update: (projectId: number | string, payload: UpdateProjectPayload): Promise<ProjectDetails> =>
    api.put<ProjectDetails>(`/api/projects/${projectId}`, payload).then(r => r.data),

  remove: (projectId: number | string, teamId: number | string): Promise<void> =>
    api.delete(`/api/projects/${projectId}/team/${teamId}`).then(() => undefined),

  leave: (projectId: number | string): Promise<void> =>
    api.post(`/api/projects/${projectId}/leave`).then(() => undefined),

  getMembers: (projectId: number | string): Promise<any[]> =>
    api.get<any[]>(`/api/projects/${projectId}/members`).then(r => r.data),

  getMetrics: (projectId: number | string): Promise<any> =>
    api.get(`/api/projects/${projectId}/metrics`).then(r => r.data),

  getMilestones: (projectId: number | string): Promise<any[]> =>
    api.get<any[]>(`/api/projects/${projectId}/milestones`).then(r => r.data),
};

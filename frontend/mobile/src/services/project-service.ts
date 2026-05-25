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
};

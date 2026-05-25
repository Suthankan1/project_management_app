import api from '../api/axios';

export interface PortfolioProject {
  id: number;
  name: string;
  projectKey: string;
  description?: string;
  type: 'AGILE' | 'KANBAN';
  ownerName: string;
  teamName: string;
  createdAt: string;
}

export interface Portfolio {
  id: number;
  name: string;
  description?: string;
  color: string;
  emoji?: string;
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

export const portfolioService = {
  list: (): Promise<Portfolio[]> =>
    api.get<Portfolio[]>('/api/portfolios').then(r => r.data),

  get: (id: number): Promise<Portfolio> =>
    api.get<Portfolio>(`/api/portfolios/${id}`).then(r => r.data),

  create: (payload: CreatePortfolioPayload): Promise<Portfolio> =>
    api.post<Portfolio>('/api/portfolios', payload).then(r => r.data),

  update: (id: number, payload: Partial<CreatePortfolioPayload>): Promise<Portfolio> =>
    api.put<Portfolio>(`/api/portfolios/${id}`, payload).then(r => r.data),

  remove: (id: number): Promise<void> =>
    api.delete(`/api/portfolios/${id}`).then(() => undefined),
};

import api from '@/lib/axios';

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

export const portfolioService = {
  list: async (): Promise<Portfolio[]> => {
    const { data } = await api.get<Portfolio[]>('/api/portfolios');
    return data;
  },

  get: async (id: number): Promise<Portfolio> => {
    const { data } = await api.get<Portfolio>(`/api/portfolios/${id}`);
    return data;
  },

  create: async (payload: CreatePortfolioPayload): Promise<Portfolio> => {
    const { data } = await api.post<Portfolio>('/api/portfolios', payload);
    return data;
  },

  update: async (id: number, payload: Partial<CreatePortfolioPayload>): Promise<Portfolio> => {
    const { data } = await api.put<Portfolio>(`/api/portfolios/${id}`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await api.delete(`/api/portfolios/${id}`);
  },

  addProject: async (portfolioId: number, projectId: number): Promise<Portfolio> => {
    const { data } = await api.post<Portfolio>(`/api/portfolios/${portfolioId}/projects/${projectId}`);
    return data;
  },

  removeProject: async (portfolioId: number, projectId: number): Promise<void> => {
    await api.delete(`/api/portfolios/${portfolioId}/projects/${projectId}`);
  },
};

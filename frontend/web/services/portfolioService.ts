import { portfoliosApi } from './api-contract';
import type { Portfolio, PortfolioProject, CreatePortfolioPayload } from './api-contract';

export type { Portfolio, PortfolioProject, CreatePortfolioPayload };

export const portfolioService = {
  list: async (): Promise<Portfolio[]> => {
    return portfoliosApi.list();
  },

  get: async (id: number): Promise<Portfolio> => {
    return portfoliosApi.get(id);
  },

  create: async (payload: CreatePortfolioPayload): Promise<Portfolio> => {
    return portfoliosApi.create(payload);
  },

  update: async (id: number, payload: Partial<CreatePortfolioPayload>): Promise<Portfolio> => {
    return portfoliosApi.update(id, payload);
  },

  remove: async (id: number): Promise<void> => {
    return portfoliosApi.remove(id);
  },

  addProject: async (portfolioId: number, projectId: number): Promise<Portfolio> => {
    return portfoliosApi.addProject(portfolioId, projectId);
  },

  removeProject: async (portfolioId: number, projectId: number): Promise<void> => {
    return portfoliosApi.removeProject(portfolioId, projectId);
  },
};

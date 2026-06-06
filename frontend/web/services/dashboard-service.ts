import api from '@/lib/axios';
import type { ProjectSummary } from './projects-contract';
import type { RawTask, RawBoard } from '@/app/dashboard/components/table/types';

export async function fetchRecentProjects(limit = 5): Promise<ProjectSummary[]> {
  const { data } = await api.get('/api/dashboard/recent', { params: { limit } });
  return data;
}

export async function fetchFavoriteProjects(): Promise<ProjectSummary[]> {
  const { data } = await api.get('/api/dashboard/favorites');
  return data;
}

export async function fetchWorkedOnTasks(): Promise<RawTask[]> {
  const { data } = await api.get('/api/dashboard/table/worked-on');
  return data;
}

export async function fetchViewedTasks(): Promise<RawTask[]> {
  const { data } = await api.get('/api/dashboard/table/viewed');
  return data;
}

export async function fetchAssignedTasks(): Promise<RawTask[]> {
  const { data } = await api.get('/api/dashboard/table/assigned');
  return data;
}

export async function fetchTableFavorites(): Promise<ProjectSummary[]> {
  const { data } = await api.get('/api/dashboard/table/favorites');
  return data;
}

export async function fetchRecentBoards(): Promise<RawBoard[]> {
  const { data } = await api.get('/api/dashboard/table/boards');
  return data;
}

export interface ProjectSummary {
  id: number;
  name: string;
  projectKey?: string;
  isFavorite?: boolean;
  type: 'AGILE' | 'KANBAN' | string;
  lastAccessedAt?: string;
  completedTasks?: number;
  totalTasks?: number;
}

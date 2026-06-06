export interface ProjectSummary {
  id: number;
  name: string;
  projectKey?: string;
  isFavorite?: boolean;
  type?: string;
  lastAccessedAt?: string;
  completedTasks?: number;
  totalTasks?: number;
}

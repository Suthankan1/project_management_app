import { useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: number;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
  updatedAt?: string;
  assigneeName?: string;
  assigneePhotoUrl?: string;
  projectId?: number;
}

export interface Sprint {
  id: number;
  name: string;
  startDate?: string;
  endDate?: string;
  status?: string;
}

export interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  inProgressTasks?: number;
}

export interface MilestoneItem {
  id: number;
  name: string;
  status: string;
  dueDate?: string;
  taskCount?: number;
}

export interface SummaryData {
  tasks: Task[];
  sprints: Sprint[];
  metrics: ProjectMetrics;
  projectDetails: { name?: string; description?: string; type?: string } | null;
  isAgile: boolean;
}

// ─── useProjectSummary Hook ────────────────────────────────────────────────────

export function useProjectSummary(projectId: number) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const AGILE_TYPES = ['AGILE', 'SCRUM'];

  const fetchAll = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, milestonesRes] = await Promise.all([
        api.get(`/api/projects/${projectId}/dashboard-summary`),
        api.get(`/api/projects/${projectId}/milestones`).catch(() => ({ data: [] })),
      ]);

      const raw = summaryRes.data;
      const isAgile = AGILE_TYPES.includes(raw.projectDetails?.type?.toUpperCase() || '');

      setData({
        tasks: raw.tasks || [],
        sprints: raw.sprints || [],
        metrics: raw.metrics || { totalTasks: 0, completedTasks: 0, overdueTasks: 0 },
        projectDetails: raw.projectDetails || null,
        isAgile,
      });
      setMilestones(milestonesRes.data || []);
    } catch (e) {
      setError('Failed to load project summary. Pull down to retry.');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  return { data, milestones, loading, error, refresh: fetchAll };
}

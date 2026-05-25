import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

export interface TimelineLabel {
  id: number;
  name: string;
  color?: string | null;
}

export interface TimelineTask {
  id: number;
  title: string;
  status?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  createdAt?: string | null;
  assigneeName?: string | null;
  projectTaskNumber?: number | null;
  milestoneId?: number | null;
  milestoneName?: string | null;
  milestoneTitle?: string | null;
  labels?: TimelineLabel[];
}

export interface TimelineMilestone {
  id: number;
  name: string;
  status?: string | null;
  dueDate?: string | null;
}

export function useMobileTimeline(projectId: number) {
  const [tasks, setTasks] = useState<TimelineTask[]>([]);
  const [milestones, setMilestones] = useState<TimelineMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async (background = false) => {
    if (!projectId) return;
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [tasksRes, milestonesRes] = await Promise.all([
        api.get(`/api/tasks/project/${projectId}`),
        api.get(`/api/projects/${projectId}/milestones`).catch(() => ({ data: [] })),
      ]);

      setTasks(Array.isArray(tasksRes.data) ? tasksRes.data : []);
      setMilestones(Array.isArray(milestonesRes.data) ? milestonesRes.data : []);
    } catch {
      setError('Failed to load timeline. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchTimeline(false);
  }, [fetchTimeline]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const scheduled = tasks.filter((task) => task.startDate || task.dueDate).length;
    const overdue = tasks.filter((task) => {
      if (!task.dueDate || (task.status ?? '').toUpperCase() === 'DONE') return false;
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return !Number.isNaN(due.getTime()) && due < today;
    }).length;

    return {
      total: tasks.length,
      scheduled,
      overdue,
      milestones: milestones.length,
    };
  }, [milestones.length, tasks]);

  return {
    tasks,
    milestones,
    stats,
    loading,
    refreshing,
    error,
    refresh: () => fetchTimeline(true),
  };
}

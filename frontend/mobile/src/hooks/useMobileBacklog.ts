import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import api from '../api/axios';
import { apiErrorMessage } from '../utils/apiError';

export type BacklogGroupBy = 'none' | 'status' | 'priority' | 'assignee';

export interface MobileLabel {
  id: number;
  name: string;
  color?: string | null;
}

export interface MobileTask {
  id: number;
  projectTaskNumber?: number | null;
  title: string;
  status?: string | null;
  priority?: string | null;
  dueDate?: string | null;
  sprintId?: number | null;
  storyPoint?: number | null;
  assigneeName?: string | null;
  assigneePhotoUrl?: string | null;
  labels?: MobileLabel[];
  selected?: boolean;
}

export interface MobileSprint {
  id: number;
  name?: string;
  sprintName?: string;
  status?: string;
  startDate?: string | null;
  endDate?: string | null;
  goal?: string | null;
  tasks: MobileTask[];
}

export interface MobileBacklogFilters {
  search: string;
  status: string;
  priority: string;
  assignee: string;
  label: string;
  groupBy: BacklogGroupBy;
}

const DEFAULT_FILTERS: MobileBacklogFilters = {
  search: '',
  status: 'ALL',
  priority: 'ALL',
  assignee: 'ALL',
  label: 'ALL',
  groupBy: 'none',
};

function normalizeTask(raw: MobileTask): MobileTask {
  return {
    ...raw,
    status: raw.status || 'TODO',
    priority: raw.priority || 'MEDIUM',
    storyPoint: raw.storyPoint ?? 0,
    sprintId: raw.sprintId ?? null,
    labels: raw.labels ?? [],
    selected: false,
  };
}

function sprintName(sprint: MobileSprint) {
  return sprint.sprintName || sprint.name || `Sprint #${sprint.id}`;
}

export function useMobileBacklog(projectId: number) {
  const [tasks, setTasks] = useState<MobileTask[]>([]);
  const [sprints, setSprints] = useState<MobileSprint[]>([]);
  const [projectKey, setProjectKey] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
  const [filters, setFilters] = useState<MobileBacklogFilters>(DEFAULT_FILTERS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBacklog = useCallback(async (background = false) => {
    if (!projectId) return;
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const [tasksRes, sprintsRes, projectRes, membersRes] = await Promise.all([
        api.get(`/api/tasks/project/${projectId}`),
        api.get(`/api/sprints/project/${projectId}`).catch(() => ({ data: [] })),
        api.get(`/api/projects/${projectId}`).catch(() => ({ data: null })),
        api.get(`/api/projects/${projectId}/members`).catch(() => ({ data: [] })),
      ]);

      const normalizedTasks = Array.isArray(tasksRes.data)
        ? (tasksRes.data as MobileTask[]).map(normalizeTask)
        : [];
      const rawSprints = Array.isArray(sprintsRes.data) ? sprintsRes.data as MobileSprint[] : [];

      const tasksBySprint = new Map<number, MobileTask[]>();
      normalizedTasks.forEach((task) => {
        if (!task.sprintId) return;
        if (!tasksBySprint.has(task.sprintId)) tasksBySprint.set(task.sprintId, []);
        tasksBySprint.get(task.sprintId)!.push(task);
      });

      setTasks(normalizedTasks);
      setSprints(rawSprints.map((sprint) => ({
        ...sprint,
        tasks: tasksBySprint.get(sprint.id) ?? [],
      })));
      setProjectKey(projectRes.data?.projectKey || projectRes.data?.key || '');

      const members = Array.isArray(membersRes.data) ? membersRes.data : [];
      const role = members.find((member: { currentUser?: boolean; me?: boolean }) => member.currentUser || member.me)?.role;
      if (role) setCurrentUserRole(role);
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to load backlog. Pull down to retry.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchBacklog(false);
  }, [fetchBacklog]);

  const allAssigneeNames = useMemo(() => {
    const names = new Set<string>();
    tasks.forEach((task) => {
      if (task.assigneeName?.trim() && task.assigneeName !== 'Unassigned') names.add(task.assigneeName.trim());
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [tasks]);

  const allLabels = useMemo(() => {
    const byId = new Map<number, MobileLabel>();
    tasks.forEach((task) => {
      task.labels?.forEach((label) => {
        byId.set(label.id, label);
      });
    });
    return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  const applyFilters = useCallback((source: MobileTask[]) => {
    const term = filters.search.trim().toLowerCase();
    return source.filter((task) => {
      if (term) {
        const matches = [
          task.title,
          task.assigneeName || '',
          task.priority || '',
          task.status || '',
          `tsk-${task.projectTaskNumber ?? task.id}`,
          ...(task.labels || []).map((label) => label.name),
        ].some((value) => value.toLowerCase().includes(term));
        if (!matches) return false;
      }
      if (filters.status !== 'ALL' && (task.status || 'TODO') !== filters.status) return false;
      if (filters.priority !== 'ALL' && (task.priority || 'MEDIUM') !== filters.priority) return false;
      if (filters.assignee !== 'ALL' && (task.assigneeName || 'Unassigned') !== filters.assignee) return false;
      if (filters.label !== 'ALL' && !task.labels?.some((label) => String(label.id) === filters.label)) return false;
      return true;
    });
  }, [filters]);

  const productTasks = useMemo(
    () => tasks.filter((task) => !task.sprintId),
    [tasks]
  );

  const filteredProductTasks = useMemo(
    () => applyFilters(productTasks),
    [applyFilters, productTasks]
  );

  const filteredSprints = useMemo(
    () => sprints
      .filter((sprint) => sprint.status !== 'COMPLETED')
      .map((sprint) => ({ ...sprint, tasks: applyFilters(sprint.tasks) })),
    [applyFilters, sprints]
  );

  const groupedProductTasks = useMemo(() => {
    const groupBy = filters.groupBy;
    if (groupBy === 'none') return [{ label: 'Backlog', tasks: filteredProductTasks }];

    const groups: Record<string, MobileTask[]> = {};
    filteredProductTasks.forEach((task) => {
      const key = groupBy === 'status'
        ? (task.status || 'TODO').replace(/_/g, ' ')
        : groupBy === 'priority'
          ? task.priority || 'NONE'
          : task.assigneeName || 'Unassigned';
      if (!groups[key]) groups[key] = [];
      groups[key].push(task);
    });

    return Object.entries(groups).map(([label, grouped]) => ({ label, tasks: grouped }));
  }, [filteredProductTasks, filters.groupBy]);

  const selectedIds = useMemo(
    () => tasks.filter((task) => task.selected).map((task) => task.id),
    [tasks]
  );

  const selectedCount = selectedIds.length;

  const clearSelection = useCallback(() => {
    setTasks((current) => current.map((task) => ({ ...task, selected: false })));
  }, []);

  const toggleTaskSelection = useCallback((taskId: number) => {
    setTasks((current) => current.map((task) => (
      task.id === taskId ? { ...task, selected: !task.selected } : task
    )));
  }, []);

  const createTask = useCallback(async (title: string, sprintId?: number | null) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    try {
      await api.post('/api/tasks', {
        projectId,
        title: cleanTitle,
        sprintId: sprintId ?? undefined,
        priority: 'MEDIUM',
        storyPoint: 0,
      });
      await fetchBacklog(true);
    } catch (err) {
      Alert.alert('Task not created', apiErrorMessage(err, 'Please try again.'));
    }
  }, [fetchBacklog, projectId]);

  const createSprint = useCallback(async (name?: string) => {
    const fallback = projectKey ? `${projectKey} Sprint ${sprints.length + 1}` : `Sprint ${sprints.length + 1}`;
    const cleanName = (name || fallback).trim();
    try {
      await api.post('/api/sprints', { proId: projectId, name: cleanName });
      await fetchBacklog(true);
    } catch (err) {
      Alert.alert('Sprint not created', apiErrorMessage(err, 'Please try again.'));
    }
  }, [fetchBacklog, projectId, projectKey, sprints.length]);

  const updateStatus = useCallback(async (taskId: number, status: string) => {
    const previous = tasks;
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, status } : task));
    try {
      await api.patch(`/api/tasks/${taskId}/status`, { status });
      await fetchBacklog(true);
    } catch (err) {
      setTasks(previous);
      Alert.alert('Status not updated', apiErrorMessage(err, 'Please try again.'));
    }
  }, [fetchBacklog, tasks]);

  const updateStoryPoints = useCallback(async (taskId: number, storyPoint: number) => {
    const value = Math.max(0, Number.isNaN(storyPoint) ? 0 : storyPoint);
    const previous = tasks;
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, storyPoint: value } : task));
    try {
      await api.put(`/api/tasks/${taskId}`, { storyPoint: value });
      await fetchBacklog(true);
    } catch (err) {
      setTasks(previous);
      Alert.alert('Points not updated', apiErrorMessage(err, 'Please try again.'));
    }
  }, [fetchBacklog, tasks]);

  const moveTaskToSprint = useCallback(async (taskId: number, sprintId: number | null) => {
    const previous = tasks;
    setTasks((current) => current.map((task) => task.id === taskId ? { ...task, sprintId, selected: false } : task));
    try {
      await api.put(`/api/tasks/${taskId}`, { sprintId });
      await fetchBacklog(true);
    } catch (err) {
      setTasks(previous);
      Alert.alert('Task not moved', apiErrorMessage(err, 'Please try again.'));
    }
  }, [fetchBacklog, tasks]);

  const deleteTask = useCallback(async (taskId: number) => {
    const previous = tasks;
    setTasks((current) => current.filter((task) => task.id !== taskId));
    try {
      await api.delete(`/api/tasks/${taskId}`);
      await fetchBacklog(true);
    } catch (err) {
      setTasks(previous);
      Alert.alert('Delete failed', apiErrorMessage(err, 'Only Project Owners or Admins can delete tasks.'));
    }
  }, [fetchBacklog, tasks]);

  const bulkStatus = useCallback(async (status: string) => {
    if (!selectedIds.length) return;
    try {
      await api.patch('/api/tasks/bulk/status', { taskIds: selectedIds, status });
      clearSelection();
      await fetchBacklog(true);
    } catch (err) {
      Alert.alert('Bulk update failed', apiErrorMessage(err, 'Please try again.'));
    }
  }, [clearSelection, fetchBacklog, selectedIds]);

  const bulkDelete = useCallback(async () => {
    if (!selectedIds.length) return;
    try {
      await api.delete('/api/tasks/bulk', { data: { taskIds: selectedIds } });
      clearSelection();
      await fetchBacklog(true);
    } catch (err) {
      Alert.alert('Bulk delete failed', apiErrorMessage(err, 'Only Project Owners or Admins can delete tasks.'));
    }
  }, [clearSelection, fetchBacklog, selectedIds]);

  const bulkMoveToSprint = useCallback(async (sprintId: number | null) => {
    if (!selectedIds.length) return;
    try {
      await Promise.all(selectedIds.map((taskId) => api.put(`/api/tasks/${taskId}`, { sprintId })));
      clearSelection();
      await fetchBacklog(true);
    } catch (err) {
      Alert.alert('Bulk move failed', apiErrorMessage(err, 'Please try again.'));
    }
  }, [clearSelection, fetchBacklog, selectedIds]);

  const stats = useMemo(() => {
    const visible = [...filteredProductTasks, ...filteredSprints.flatMap((sprint) => sprint.tasks)];
    const total = visible.length;
    const done = visible.filter((task) => task.status === 'DONE').length;
    const points = visible.reduce((sum, task) => sum + (task.storyPoint ?? 0), 0);
    return { total, done, points, sprints: filteredSprints.length };
  }, [filteredProductTasks, filteredSprints]);

  return {
    tasks,
    sprints,
    filteredSprints,
    filteredProductTasks,
    groupedProductTasks,
    allAssigneeNames,
    allLabels,
    currentUserRole,
    filters,
    setFilters,
    loading,
    refreshing,
    error,
    stats,
    selectedCount,
    selectedIds,
    refresh: () => fetchBacklog(true),
    clearSelection,
    toggleTaskSelection,
    createTask,
    createSprint,
    updateStatus,
    updateStoryPoints,
    moveTaskToSprint,
    deleteTask,
    bulkStatus,
    bulkDelete,
    bulkMoveToSprint,
    sprintName,
  };
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/axios';

export interface SprintSummary {
  id: number;
  name?: string;
  sprintName?: string;
  status?: string;
}

export interface SprintboardTask {
  taskId: number;
  projectTaskNumber?: number | null;
  title: string;
  storyPoint?: number | null;
  assigneeName?: string | null;
  status: string;
  priority?: string | null;
  dueDate?: string | null;
  labelName?: string | null;
  labelColor?: string | null;
}

export interface Sprintcolumn {
  id: number;
  position: number;
  columnName: string;
  columnStatus: string;
  tasks: SprintboardTask[];
}

export interface SprintboardStats {
  totalTasks: number;
  doneTasks: number;
  totalStoryPoints: number;
  doneStoryPoints: number;
  overdueTasks: number;
  unassignedTasks: number;
}

export interface Sprintboard {
  id: number;
  sprintId: number;
  sprintName: string;
  sprintStatus: string;
  stats?: SprintboardStats;
  columns: Sprintcolumn[];
}

export function useProjectSprintBoard(projectId: number) {
  const [sprints, setSprints] = useState<SprintSummary[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [board, setBoard] = useState<Sprintboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedSprint = useMemo(
    () => sprints.find((sprint) => sprint.id === selectedSprintId) ?? null,
    [selectedSprintId, sprints]
  );

  const fetchBoard = useCallback(async (background = false, sprintIdOverride?: number | null) => {
    if (!projectId) return;
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const sprintsRes = await api.get(`/api/sprints/project/${projectId}`);
      const sprintList = Array.isArray(sprintsRes.data) ? sprintsRes.data as SprintSummary[] : [];
      const activeSprint = sprintList.find((sprint) => sprint.status === 'ACTIVE') ?? sprintList[0] ?? null;
      const sprintId = sprintIdOverride ?? selectedSprintId ?? activeSprint?.id ?? null;

      setSprints(sprintList);
      setSelectedSprintId(sprintId);

      if (!sprintId) {
        setBoard(null);
        return;
      }

      const boardRes = await api.get(`/api/sprintboards/sprint/${sprintId}/full`);
      const raw = boardRes.data as Sprintboard;
      setBoard({
        ...raw,
        columns: [...(raw.columns || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
      });
    } catch {
      setError('Failed to load sprint board. Pull down to retry.');
      setBoard(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, selectedSprintId]);

  useEffect(() => {
    void fetchBoard(false);
  }, [fetchBoard]);

  const selectSprint = useCallback((sprintId: number) => {
    setSelectedSprintId(sprintId);
    void fetchBoard(false, sprintId);
  }, [fetchBoard]);

  return {
    sprints,
    selectedSprint,
    selectedSprintId,
    board,
    loading,
    refreshing,
    error,
    refresh: () => fetchBoard(true),
    selectSprint,
  };
}

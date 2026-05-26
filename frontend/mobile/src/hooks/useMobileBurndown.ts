import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axios';

export interface BurndownSprint {
  id: number;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
}

export interface BurndownPoint {
  date: string;
  remainingPoints: number;
  idealPoints: number;
}

export interface BurndownResponse {
  sprintId: number;
  sprintName: string;
  startDate: string;
  endDate: string;
  totalStoryPoints: number;
  dataPoints: BurndownPoint[];
}

export function useMobileBurndown(projectId: number) {
  const [sprints, setSprints] = useState<BurndownSprint[]>([]);
  const [selectedSprintId, setSelectedSprintId] = useState<number | null>(null);
  const [burndown, setBurndown] = useState<BurndownResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const selectedSprintIdRef = useRef<number | null>(null);

  const selectedSprint = useMemo(
    () => sprints.find((sprint) => sprint.id === selectedSprintId) ?? null,
    [selectedSprintId, sprints]
  );

  const load = useCallback(async (background = false, sprintOverride?: number | null) => {
    if (!projectId) return;
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const sprintsRes = await api.get(`/api/sprints/project/${projectId}`);
      const sprintList = Array.isArray(sprintsRes.data) ? sprintsRes.data as BurndownSprint[] : [];
      const fallbackSprint = sprintList.find((sprint) => sprint.status === 'ACTIVE') ?? sprintList[0] ?? null;
      const sprintId = sprintOverride ?? selectedSprintIdRef.current ?? fallbackSprint?.id ?? null;
      const sprint = sprintList.find((item) => item.id === sprintId) ?? fallbackSprint;

      if (!isMounted.current) return;
      setSprints(sprintList);
      selectedSprintIdRef.current = sprint?.id ?? null;
      setSelectedSprintId(selectedSprintIdRef.current);

      if (!sprint?.id) {
        setBurndown(null);
        return;
      }

      if (!sprint.startDate || !sprint.endDate) {
        setBurndown(null);
        return;
      }

      const params = new URLSearchParams();
      params.set('from', sprint.startDate.slice(0, 10));
      params.set('to', sprint.endDate.slice(0, 10));

      const chartRes = await api.get<BurndownResponse>(
        `/api/burndown/sprint/${sprint.id}?${params.toString()}`
      );
      if (!isMounted.current) return;
      setBurndown(chartRes.data);
    } catch {
      if (!isMounted.current) return;
      setError('Failed to load burndown. Pull down to retry.');
      setBurndown(null);
    } finally {
      if (!isMounted.current) return;
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    isMounted.current = true;
    void load(false);
    return () => { isMounted.current = false; };
  }, [load]);

  const selectSprint = useCallback((sprintId: number) => {
    selectedSprintIdRef.current = sprintId;
    setSelectedSprintId(sprintId);
    void load(false, sprintId);
  }, [load]);

  return {
    sprints,
    selectedSprint,
    selectedSprintId,
    burndown,
    loading,
    refreshing,
    error,
    refresh: () => load(true, selectedSprintIdRef.current),
    selectSprint,
  };
}

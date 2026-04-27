'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import api from '@/lib/axios';
import {
  DashboardItem,
  mapBoardToDashboard,
  mapProjectToDashboard,
  mapTaskToDashboard,
  RawBoard,
  RawProject,
  RawTask,
} from './types';

interface UseDashboardDataProps {
  activeTab: string;
  setDashboardAssignedCount?: (count: number) => void;
}

interface UseDashboardDataReturn {
  items: DashboardItem[];
  loading: boolean;
  mutate: () => void;
}

async function fetchTabData(activeTab: string): Promise<DashboardItem[]> {
  switch (activeTab) {
    case 'boards': {
      const res = await api.get('/api/sprintboards/user/recent?limit=20');
      return (res.data as RawBoard[]).map(mapBoardToDashboard);
    }
    case 'favorites': {
      const res = await api.get('/api/projects/favorites');
      return (res.data as RawProject[]).map(mapProjectToDashboard);
    }
    case 'assigned-to-me': {
      const res = await api.get('/api/tasks/assigned');
      return (res.data as RawTask[]).map(mapTaskToDashboard);
    }
    case 'worked-on': {
      const res = await api.get('/api/tasks/worked-on');
      return (res.data as RawTask[]).map(mapTaskToDashboard);
    }
    case 'viewed': {
      const [pRes, tRes] = await Promise.all([
        api.get('/api/projects/recent?limit=20').catch(() => ({ data: [] })),
        api.get('/api/tasks/recent?limit=20').catch(() => ({ data: [] })),
      ]);
      return [
        ...(pRes.data as RawProject[]).map(mapProjectToDashboard),
        ...(tRes.data as RawTask[]).map(mapTaskToDashboard),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    default:
      return [];
  }
}

export function useDashboardData({
  activeTab,
  setDashboardAssignedCount,
}: UseDashboardDataProps): UseDashboardDataReturn {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ── Assigned count (independent fetch, always runs when prop exists) ─────────
  const { data: assignedData } = useSWR(
    setDashboardAssignedCount ? '/api/tasks/assigned?limit=100' : null,
    (url: string) => api.get(url).then((res) => res.data as RawTask[]),
    { revalidateOnFocus: false, dedupingInterval: 60_000 },
  );

  useEffect(() => {
    if (assignedData && setDashboardAssignedCount) {
      const pendingCount = assignedData.filter((t) => t.status !== 'DONE').length;
      setDashboardAssignedCount(pendingCount);
    }
  }, [assignedData, setDashboardAssignedCount]);

  // ── Active tab data ───────────────────────────────────────────────────────────
  const { data: tabData, isLoading, mutate } = useSWR<DashboardItem[]>(
    activeTab ? `dashboardTab:${activeTab}` : null,
    () => fetchTabData(activeTab),
    { revalidateOnFocus: false, dedupingInterval: 30_000, keepPreviousData: true },
  );

  // ── Listen for external task updates ─────────────────────────────────────────
  useEffect(() => {
    let timer: number | undefined;

    const onTaskUpdated = () => {
      setIsRefreshing(true);
      void mutate();
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => setIsRefreshing(false), 300);
    };

    window.addEventListener('planora:task-updated', onTaskUpdated);
    return () => {
      window.removeEventListener('planora:task-updated', onTaskUpdated);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [mutate]);

  return {
    items: tabData ?? [],
    loading: (isLoading && !tabData) || isRefreshing,
    mutate,
  };
}

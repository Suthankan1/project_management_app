import { useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/axios';

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface Task {
  id: number;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
  updatedAt?: string;
  createdAt?: string;
  completedAt?: string;
  assigneeName?: string;
  assigneePhotoUrl?: string;
  projectId?: number;
  sprintId?: number;
  storyPoint?: number;
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

interface CacheEntry {
  data: SummaryData;
  milestones: MilestoneItem[];
  fetchedAt: number;
}

// ─── Module-level cache (survives re-renders, cleared on app restart) ──────────
// TTL: 60 seconds — data is fresh enough, re-fetch in background if stale
const CACHE: Map<number, CacheEntry> = new Map();
const CACHE_TTL_MS = 60_000;

function getCached(projectId: number): CacheEntry | null {
  const entry = CACHE.get(projectId);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    CACHE.delete(projectId);
    return null;
  }
  return entry;
}

// ─── useProjectSummary Hook ────────────────────────────────────────────────────

const AGILE_TYPES = ['AGILE', 'SCRUM'];

export function useProjectSummary(projectId: number) {
  // Seed state from cache immediately — zero loading time on revisit
  const cached = projectId ? getCached(projectId) : null;

  const [data, setData] = useState<SummaryData | null>(cached?.data ?? null);
  const [milestones, setMilestones] = useState<MilestoneItem[]>(cached?.milestones ?? []);
  // If we have a valid cache hit, skip the loading state entirely
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);

  const fetchAll = useCallback(async (background = false) => {
    if (!projectId) return;
    if (!background) setLoading(true);
    setError(null);
    try {
      const [summaryRes, milestonesRes] = await Promise.all([
        api.get(`/api/projects/${projectId}/dashboard-summary`, { timeout: 15000 }),
        api.get(`/api/projects/${projectId}/milestones`).catch(() => ({ data: [] })),
      ]);

      if (!isMounted.current) return;

      const raw = summaryRes.data;
      const isAgile = AGILE_TYPES.includes(raw.projectDetails?.type?.toUpperCase() || '');

      const newData: SummaryData = {
        tasks: raw.tasks || [],
        sprints: raw.sprints || [],
        metrics: raw.metrics || { totalTasks: 0, completedTasks: 0, overdueTasks: 0 },
        projectDetails: raw.projectDetails || null,
        isAgile,
      };



      const newMilestones: MilestoneItem[] = milestonesRes.data || [];

      // Update cache
      CACHE.set(projectId, { data: newData, milestones: newMilestones, fetchedAt: Date.now() });

      setData(newData);
      setMilestones(newMilestones);
    } catch (e) {
      if (!isMounted.current) return;
      if (!background) setError('Failed to load project summary. Pull down to retry.');
    } finally {
      if (isMounted.current) setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    isMounted.current = true;
    const cached = projectId ? getCached(projectId) : null;
    if (cached) {
      // Cache hit: show data immediately, re-fetch silently in background
      void fetchAll(true);
    } else {
      // Cache miss: full load
      void fetchAll(false);
    }
    return () => { isMounted.current = false; };
  }, [fetchAll]);

  return { data, milestones, loading, error, refresh: () => fetchAll(false) };
}

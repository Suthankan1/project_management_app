'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ensureValidToken, getUserFromToken, User } from '@/lib/auth';
import {
  buildSessionCacheKey,
  getSessionCache,
  setSessionCache,
} from '@/lib/session-cache';
import { projectsApi } from '@/services/api-contract';
import { fetchRecentProjects, fetchFavoriteProjects } from '@/services/dashboard-service';
import type { ProjectSummary as ApiProjectSummary } from '@/services/projects-contract';

// Data will stay fresh in cache for 2 minutes
const DASHBOARD_PROJECTS_CACHE_TTL = 2 * 60_000;

// Structure for a single project summary
export type ProjectSummary = ApiProjectSummary & {
  completedTasks?: number;
  totalTasks?: number;
};

// Return type for this hook
interface UseDashboardProjectsReturn {
  user: User | null;
  projects: { recent: ProjectSummary[]; favorites: ProjectSummary[] };
  loading: boolean;
}

export function useDashboardProjects(): UseDashboardProjectsReturn {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null); // State to store logged-in user info
  const [projects, setProjects] = useState<{
    recent: ProjectSummary[];
    favorites: ProjectSummary[];
  }>({ recent: [], favorites: [] }); // State to store recent and favorite projects
  const [loading, setLoading] = useState(true); // Loading indicator state

  useEffect(() => {
    let isMounted = true;
    let currentUser: User | null = null;

    // Main function to fetch projects from API
    const fetchProjects = async (checkCache = false) => {
      if (!currentUser) return;
      const cacheKey = buildSessionCacheKey('dashboard_projects', [currentUser.userId]);

      // Try to load data from local session cache first for instant UI response
      if (checkCache && cacheKey) {
        const cached = getSessionCache<{ recent: ProjectSummary[]; favorites: ProjectSummary[] }>(cacheKey, { allowStale: true });
        if (cached.data) {
          if (!isMounted) return;
          setProjects(cached.data);
          setLoading(false);
          // If it's not stale (expired), we can stop here
          if (!cached.isStale) return;
        }
      }

      try {
        // Fetch both recent and favorite projects in parallel
        const [recent, favorites] = await Promise.all([
          fetchRecentProjects(5),
          fetchFavoriteProjects(),
        ]);

        // Collect unique project IDs across both lists
        const uniqueIds = [...new Set([...recent, ...favorites].map((p) => p.id))];

        // Fetch task completion metrics for all projects in parallel (best-effort)
        const metricsResults = await Promise.allSettled(
          uniqueIds.map((id) =>
            projectsApi.getMetrics(id).then((data) => ({ id, data }))
          )
        );
        const metricsMap = new Map<number, { completedTasks: number; totalTasks: number }>();
        metricsResults.forEach((result) => {
          if (result.status === 'fulfilled') {
            const { id, data } = result.value;
            metricsMap.set(id, {
              completedTasks: data.completedTasks ?? 0,
              totalTasks: data.totalTasks ?? 0,
            });
          }
        });

        const mergeMetrics = (list: ProjectSummary[]): ProjectSummary[] =>
          list.map((p) => ({ ...p, ...metricsMap.get(p.id) }));

        const fresh = {
          recent: mergeMetrics(recent),
          favorites: mergeMetrics(favorites),
        };
        if (!isMounted) return;
        setProjects(fresh);

        // Save fresh data to cache for next time
        if (cacheKey) {
          setSessionCache(cacheKey, fresh, DASHBOARD_PROJECTS_CACHE_TTL);
        }
      } catch (error: unknown) {
        // Handle API errors silently if it's just a network issue on dashboard
        console.error("Dashboard data fetch failed", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const initializeProjects = async () => {
      const token = await ensureValidToken({ allowCookieRefresh: true });
      if (!token || !isMounted) {
        if (isMounted) router.push('/login');
        return;
      }

      currentUser = getUserFromToken();
      if (!currentUser) {
        router.push('/login');
        return;
      }

      setUser(currentUser);
      await fetchProjects(true);
    };

    void initializeProjects(); // Initial fetch with cache check

    // Listen for global events to refresh data when a project is updated elsewhere
    const handleFavToggled = () => { void fetchProjects(); };
    const handleProjectAccessed = () => { void fetchProjects(); };
    window.addEventListener('planora:favorite-toggled', handleFavToggled);
    window.addEventListener('planora:project-accessed', handleProjectAccessed);
    
    // Clean up event listeners when component is removed
    return () => {
      isMounted = false;
      window.removeEventListener('planora:favorite-toggled', handleFavToggled);
      window.removeEventListener('planora:project-accessed', handleProjectAccessed);
    };
  }, [router]);

  return { user, projects, loading }; // Return the processed data and state
}

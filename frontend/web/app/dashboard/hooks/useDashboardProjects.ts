'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { getUserFromToken, User } from '@/lib/auth';
import {
  buildSessionCacheKey,
  getSessionCache,
  setSessionCache,
} from '@/lib/session-cache';

// Data will stay fresh in cache for 2 minutes
const DASHBOARD_PROJECTS_CACHE_TTL = 2 * 60_000;

// Structure for a single project summary
export interface ProjectSummary {
  id: number;
  name: string;
  projectKey?: string;
  isFavorite?: boolean;
  type: 'AGILE' | 'KANBAN' | string;
}

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
    // Get user details from JWT token stored in cookies
    const currentUser = getUserFromToken();
    if (!currentUser) {
      router.push('/login'); // If no user, redirect to login page
      return;
    }
    setUser(currentUser);

    // Main function to fetch projects from API
    const fetchProjects = async (checkCache = false) => {
      const cacheKey = buildSessionCacheKey('dashboard_projects', currentUser.userId);

      // Try to load data from local session cache first for instant UI response
      if (checkCache) {
        const cached = getSessionCache<{ recent: ProjectSummary[]; favorites: ProjectSummary[] }>(cacheKey, { allowStale: true });
        if (cached.data) {
          setProjects(cached.data);
          setLoading(false);
          // If it's not stale (expired), we can stop here
          if (!cached.isStale) return;
        }
      }

      try {
        // Fetch both recent and favorite projects in parallel
        const [recentRes, favRes] = await Promise.all([
          api.get('/api/projects/recent'),
          api.get('/api/projects/favorites'),
        ]);
        const fresh = {
          recent: recentRes.data || [],
          favorites: favRes.data || [],
        };
        setProjects(fresh);

        // Save fresh data to cache for next time
        if (cacheKey) {
          setSessionCache(cacheKey, fresh, DASHBOARD_PROJECTS_CACHE_TTL);
        }
      } catch (error: unknown) {
        // Handle API errors silently if it's just a network issue on dashboard
        console.error("Dashboard data fetch failed", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects(true); // Initial fetch with cache check

    // Listen for global events to refresh data when a project is updated elsewhere
    const handleFavToggled = () => { void fetchProjects(); };
    const handleProjectAccessed = () => { void fetchProjects(); };
    window.addEventListener('planora:favorite-toggled', handleFavToggled);
    window.addEventListener('planora:project-accessed', handleProjectAccessed);
    
    // Clean up event listeners when component is removed
    return () => {
      window.removeEventListener('planora:favorite-toggled', handleFavToggled);
      window.removeEventListener('planora:project-accessed', handleProjectAccessed);
    };
  }, [router]);

  return { user, projects, loading }; // Return the processed data and state
}

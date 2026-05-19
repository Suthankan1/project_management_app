import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import api from '../api/axios';
import { getValidToken } from '../auth/storage';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProjectSummary {
  id: number;
  name: string;
  projectKey?: string;
  isFavorite?: boolean;
  type: 'AGILE' | 'KANBAN' | string;
}

export interface DashboardItem {
  id: string;
  realId: number;
  projectId?: number;
  type: 'TASK' | 'PROJECT_AGILE' | 'PROJECT_KANBAN' | 'BOARD';
  name: string;
  location: string;
  status?: string;
  timestamp: string;
}

export type TabKey = 'assigned-to-me' | 'worked-on' | 'viewed' | 'favorites' | 'boards';

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapProject(p: {
  id: number; type?: string; name: string; projectKey?: string; updatedAt?: string; createdAt?: string;
}): DashboardItem {
  return {
    id: `P-${p.id}`,
    realId: p.id,
    type: p.type === 'KANBAN' ? 'PROJECT_KANBAN' : 'PROJECT_AGILE',
    name: p.name,
    location: p.projectKey || 'Workspace',
    timestamp: p.updatedAt || p.createdAt || new Date().toISOString(),
  };
}

function mapTask(t: {
  id: number; projectId?: number; title: string; projectName?: string; status?: string;
  updatedAt?: string; createdAt?: string;
}): DashboardItem {
  const VALID = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
  const normalized = t.status?.toUpperCase() ?? 'TODO';
  const status = VALID.includes(normalized) ? normalized : 'TODO';
  return {
    id: `T-${t.id}`,
    realId: t.id,
    projectId: t.projectId,
    type: 'TASK',
    name: t.title,
    location: t.projectName || 'Project',
    status,
    timestamp: t.updatedAt || t.createdAt || new Date().toISOString(),
  };
}

function mapBoard(b: {
  id: number; projectId: number; name: string; projectName: string; updatedAt?: string;
}): DashboardItem {
  return {
    id: `B-${b.id}`,
    realId: b.projectId,
    type: 'BOARD',
    name: b.name,
    location: b.projectName,
    timestamp: b.updatedAt || new Date().toISOString(),
  };
}

// ─── Tab Data Fetcher ─────────────────────────────────────────────────────────

async function fetchTabData(tab: TabKey): Promise<DashboardItem[]> {
  switch (tab) {
    case 'boards': {
      const res = await api.get('/api/sprintboards/user/recent?limit=20');
      return res.data.map(mapBoard);
    }
    case 'favorites': {
      const res = await api.get('/api/projects/favorites');
      return res.data.map(mapProject);
    }
    case 'assigned-to-me': {
      const res = await api.get('/api/tasks/assigned');
      return res.data.map(mapTask);
    }
    case 'worked-on': {
      const res = await api.get('/api/tasks/worked-on');
      return res.data.map(mapTask);
    }
    case 'viewed': {
      const [pRes, tRes] = await Promise.all([
        api.get('/api/projects/recent?limit=20').catch(() => ({ data: [] })),
        api.get('/api/tasks/recent?limit=20').catch(() => ({ data: [] })),
      ]);
      return [
        ...pRes.data.map(mapProject),
        ...tRes.data.map(mapTask),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
    default:
      return [];
  }
}

// ─── useDashboard Hook ────────────────────────────────────────────────────────

interface UseDashboardReturn {
  user: { username?: string; email?: string } | null;
  projects: { recent: ProjectSummary[]; favorites: ProjectSummary[] };
  tabItems: DashboardItem[];
  assignedCount: number;
  loadingProjects: boolean;
  loadingTab: boolean;
  activeTab: TabKey;
  setActiveTab: (tab: TabKey) => void;
  refreshProjects: () => void;
  refreshTab: () => void;
  toggleFavorite: (id: number) => Promise<void>;
  recordAccess: (id: number) => Promise<void>;
}

export function useDashboard(): UseDashboardReturn {
  const router = useRouter();

  const [user, setUser]                       = useState<{ username?: string; email?: string } | null>(null);
  const [projects, setProjects]               = useState<{ recent: ProjectSummary[]; favorites: ProjectSummary[] }>({ recent: [], favorites: [] });
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [activeTab, setActiveTab]             = useState<TabKey>('assigned-to-me');
  const [tabItems, setTabItems]               = useState<DashboardItem[]>([]);
  const [loadingTab, setLoadingTab]           = useState(false);
  const [assignedCount, setAssignedCount]     = useState(0);

  // ── Check auth ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const token = await getValidToken();
      if (!token) {
        router.replace('/(auth)/login');
        return;
      }
      // Decode username from JWT payload
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ username: payload.sub || payload.username, email: payload.email });
      } catch {
        setUser({});
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Fetch recent & favorite projects ────────────────────────────────────────
  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const [recentRes, favRes] = await Promise.all([
        api.get('/api/projects/recent'),
        api.get('/api/projects/favorites'),
      ]);
      setProjects({ recent: recentRes.data || [], favorites: favRes.data || [] });
    } catch (e) {
      console.error('Dashboard fetchProjects error', e);
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  useEffect(() => { void fetchProjects(); }, [fetchProjects]);

  // ── Fetch assigned count (always) ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/api/tasks/assigned?limit=100');
        const pending = res.data.filter((t: { status?: string }) => t.status !== 'DONE').length;
        setAssignedCount(pending);
      } catch { /* silent */ }
    })();
  }, []);

  // ── Fetch tab data ───────────────────────────────────────────────────────────
  const fetchTab = useCallback(async (tab: TabKey) => {
    setLoadingTab(true);
    try {
      const items = await fetchTabData(tab);
      setTabItems(items);
    } catch (e) {
      console.error('Dashboard fetchTab error', e);
      setTabItems([]);
    } finally {
      setLoadingTab(false);
    }
  }, []);

  useEffect(() => { void fetchTab(activeTab); }, [activeTab, fetchTab]);

  // ── Toggle favorite ──────────────────────────────────────────────────────────
  const toggleFavorite = useCallback(async (id: number) => {
    try {
      await api.post(`/api/projects/${id}/favorite`);
      void fetchProjects();
    } catch (e) {
      console.error('toggleFavorite error', e);
    }
  }, [fetchProjects]);

  // ── Record project access ────────────────────────────────────────────────────
  const recordAccess = useCallback(async (id: number) => {
    try { await api.post(`/api/projects/${id}/access`); } catch { /* silent */ }
  }, []);

  return {
    user,
    projects,
    tabItems,
    assignedCount,
    loadingProjects,
    loadingTab,
    activeTab,
    setActiveTab,
    refreshProjects: fetchProjects,
    refreshTab: () => fetchTab(activeTab),
    toggleFavorite,
    recordAccess,
  };
}

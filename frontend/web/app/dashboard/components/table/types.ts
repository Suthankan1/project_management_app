// ─── Dashboard Item Types ─────────────────────────────────────────────────────

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

export interface DashboardTableProps {
  activeTab: string;
  searchQuery: string;
  setDashboardAssignedCount?: (count: number) => void;
}

// ─── Raw API response shapes ──────────────────────────────────────────────────

export interface RawProject {
  id: number;
  type?: string;
  name: string;
  projectKey?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface RawTask {
  id: number;
  projectId?: number;
  title: string;
  projectName?: string;
  status?: string;
  updatedAt?: string;
  createdAt?: string;
}

export interface RawBoard {
  id: number;
  projectId: number;
  name: string;
  projectName: string;
  updatedAt?: string;
}

// ─── Mapper functions ─────────────────────────────────────────────────────────

export const VALID_STATUSES = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;

export function mapProjectToDashboard(p: RawProject): DashboardItem {
  return {
    id: `P-${p.id}`,
    realId: p.id,
    type: p.type === 'KANBAN' ? 'PROJECT_KANBAN' : 'PROJECT_AGILE',
    name: p.name,
    location: p.projectKey || 'Workspace',
    timestamp: p.updatedAt || p.createdAt || new Date().toISOString(),
  };
}

export function mapTaskToDashboard(t: RawTask): DashboardItem {
  const normalized = t.status?.toUpperCase() ?? 'TODO';
  const status = (VALID_STATUSES as readonly string[]).includes(normalized) ? normalized : 'TODO';
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

export function mapBoardToDashboard(b: RawBoard): DashboardItem {
  return {
    id: `B-${b.id}`,
    realId: b.projectId,
    type: 'BOARD',
    name: b.name,
    location: b.projectName,
    timestamp: b.updatedAt || new Date().toISOString(),
  };
}

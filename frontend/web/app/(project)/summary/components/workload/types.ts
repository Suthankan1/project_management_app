// Defines the data types and formatting logic used across the workload components.
export interface WorkloadEntry {
  isMember: boolean;
  id?: number;
  name: string;
  role?: string;
  avatar?: string | null;
  initials?: string;
  tasks: number;
  completed: number;
  overdue: number;
  value: number;
  color: string;
}

export function formatRole(role?: string) {
  if (!role) return 'Team Member';
  const mapping: Record<string, string> = {
    'OWNER': 'Project Owner',
    'ADMIN': 'Admin',
    'MEMBER': 'Team Member',
    'VIEWER': 'Viewer'
  };
  if (mapping[role.toUpperCase()]) return mapping[role.toUpperCase()];

  return role.split('_').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

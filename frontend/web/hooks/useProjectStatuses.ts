'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/axios';

export interface ProjectStatus {
  name: string;
  status: string;
  color: string;
}

const DEFAULT_STATUSES: ProjectStatus[] = [
  { name: 'To Do', status: 'TODO', color: 'bg-gray-100 text-gray-700' },
  { name: 'In Progress', status: 'IN_PROGRESS', color: 'bg-blue-50 text-blue-700' },
  { name: 'In Review', status: 'IN_REVIEW', color: 'bg-amber-50 text-amber-700' },
  { name: 'Done', status: 'DONE', color: 'bg-green-50 text-green-700' },
];

export function useProjectStatuses(projectId?: number) {
  const [statuses, setStatuses] = useState<ProjectStatus[]>(DEFAULT_STATUSES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchStatuses = async () => {
      setLoading(true);
      try {
        const response = await api.get(`/api/kanbans/project/${projectId}/board`);
        const columns = response.data.columns || [];
        
        if (columns.length > 0) {
          const dynamicStatuses = columns.map((col: { name: string; status: string; color?: string }) => ({
            name: col.name,
            status: col.status,
            color: getStatusStyles(col.status, col.color),
          }));
          setStatuses(dynamicStatuses);
        }
      } catch (err) {
        console.error('Failed to fetch project statuses:', err);
        // Fallback to defaults
      } finally {
        setLoading(false);
      }
    };

    void fetchStatuses();
  }, [projectId]);

  return { statuses, loading };
}

function getStatusStyles(status: string, customColor?: string): string {
  if (customColor && (customColor.startsWith('#') || customColor.startsWith('rgb') || customColor.startsWith('hsl'))) {
    // If it's a hex color, we can't easily map it to a tailwind class, 
    // but we can return it as a style object. 
    // For now, let's keep using tailwind classes but map them better.
  }

  const upper = status.toUpperCase().replace(/\s+/g, '_');
  
  if (upper === 'TODO' || upper === 'TO_DO') return 'bg-gray-100 text-gray-700';
  if (upper === 'IN_PROGRESS') return 'bg-blue-50 text-blue-700';
  if (upper === 'IN_REVIEW') return 'bg-amber-50 text-amber-700';
  if (upper === 'DONE') return 'bg-green-50 text-green-700';
  
  // Custom status fallback colors based on some keywords
  if (upper.includes('BLOCK') || upper.includes('STOP')) return 'bg-red-50 text-red-700';
  if (upper.includes('WAIT') || upper.includes('HOLD')) return 'bg-orange-50 text-orange-700';
  if (upper.includes('TEST') || upper.includes('QA')) return 'bg-purple-50 text-purple-700';
  if (upper.includes('DEPLOY') || upper.includes('LIVE')) return 'bg-emerald-50 text-emerald-700';
  
  return 'bg-slate-100 text-slate-700';
}

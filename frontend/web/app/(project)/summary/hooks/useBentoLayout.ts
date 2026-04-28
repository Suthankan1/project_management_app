'use client';

import { useState, useCallback, useRef } from 'react';
import { Layouts, WidgetLayout } from '../components/layoutConfig';

const LAYOUT_VERSION = 'v26';

/**
 * Storage key generator for project-specific layout persistence.
 */
function getStorageKey(projectId: number) {
  return `summary-bento-layout:${projectId}:${LAYOUT_VERSION}`;
}

/**
 * Validates if the saved data matches the expected Layouts structure.
 */
function isValidLayouts(data: unknown): data is Layouts {
  if (!data || typeof data !== 'object') return false;
  return Object.values(data as object).some((v) => Array.isArray(v));
}

/**
 * Automatically fills horizontal gaps between widgets in a row to ensure a clean grid.
 */
function fillRowGaps(items: WidgetLayout[], totalCols: number): WidgetLayout[] {
  const result = items.map(it => ({ ...it }));
  const byRow = new Map<number, WidgetLayout[]>();

  items.forEach(item => {
    if (!byRow.has(item.y)) byRow.set(item.y, []);
    byRow.get(item.y)!.push(item);
  });

  for (const group of byRow.values()) {
    if (group.length !== 2) continue; // Only auto-fill for 2-column rows
    const [a, b] = [...group].sort((x, y) => x.x - y.x);
    const rightItem = result.find(r => r.i === b.i)!;
    rightItem.x = a.x + a.w;
    rightItem.w = totalCols - rightItem.x;
  }
  return result;
}

/**
 * Custom hook to manage the responsive Bento grid layout state and persistence.
 */
export function useBentoLayout(projectId: number, defaultLayouts: Layouts) {
  const [layouts, setLayouts] = useState<Layouts>(() => {
    if (typeof window === 'undefined') return defaultLayouts;
    try {
      const saved = localStorage.getItem(getStorageKey(projectId));
      if (saved) {
        const parsed = JSON.parse(saved);
        return isValidLayouts(parsed) ? parsed : defaultLayouts;
      }
    } catch (e) {
      console.error('Failed to load layout', e);
    }
    return defaultLayouts;
  });

  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const onLayoutChange = useCallback((_layout: unknown, allLayouts: Layouts) => {
    const adjusted = { ...allLayouts };
    if (adjusted.lg) {
      adjusted.lg = fillRowGaps(adjusted.lg as WidgetLayout[], 24);
    }
    setLayouts(adjusted);

    // Debounced save to localStorage
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      localStorage.setItem(getStorageKey(projectId), JSON.stringify(adjusted));
    }, 500);
  }, [projectId]);

  const resetLayouts = useCallback(() => {
    localStorage.removeItem(getStorageKey(projectId));
    setLayouts(defaultLayouts);
  }, [projectId, defaultLayouts]);

  return { layouts, onLayoutChange, resetLayouts, isHydrated: true };
}

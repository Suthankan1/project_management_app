import { useState, useEffect, useMemo, useSyncExternalStore } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import * as projectsApi from '@/services/projects-service';
import { buildSessionCacheKey, getSessionCache, setSessionCache } from '@/lib/session-cache';
import { AUTH_TOKEN_CHANGED_EVENT } from '@/lib/auth';
import { isAgileProjectType } from '@/components/shared/ProjectTypeIcon';

export const subscribeToBrowserStorage = (onStoreChange: () => void) => {
  if (typeof window === 'undefined') return () => { };
  const handler = () => onStoreChange();
  window.addEventListener('storage', handler);
  window.addEventListener('focus', handler);
  window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, handler);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('focus', handler);
    window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, handler);
  };
};

export const getScopedProjectValue = (key: 'currentProjectName' | 'currentProjectId' | 'currentProjectType') => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(key) || localStorage.getItem(key);
};

export const setScopedProjectValue = (key: 'currentProjectName' | 'currentProjectId' | 'currentProjectType', value: string) => {
  sessionStorage.setItem(key, value);
  localStorage.setItem(key, value);
};

export const removeScopedProjectValue = (key: 'currentProjectName' | 'currentProjectId' | 'currentProjectType') => {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
};

export function useProjectContext() {
  const params = useParams();
  const searchParams = useSearchParams();

  const projectName = useSyncExternalStore(
    subscribeToBrowserStorage,
    () => getScopedProjectValue('currentProjectName') || 'Project Name',
    () => 'Project Name'
  );
  
  const storedProjectId = useSyncExternalStore(
    subscribeToBrowserStorage,
    () => getScopedProjectValue('currentProjectId'),
    () => null
  );
  
  const storedProjectType = useSyncExternalStore(
    subscribeToBrowserStorage,
    () => getScopedProjectValue('currentProjectType'),
    () => null
  );

  const [isFavorite, setIsFavorite] = useState(false);
  const [projectType, setProjectType] = useState<string | null>(storedProjectType);

  const projectId = useMemo(() => {
    const queryProjectId = searchParams.get('projectId');
    const routeProjectId =
      (typeof params?.id === 'string' ? params.id : null) ||
      (typeof (params as Record<string, string | string[] | undefined>)?.projectId === 'string'
        ? ((params as Record<string, string | string[] | undefined>).projectId as string)
        : null);
    return queryProjectId || routeProjectId || storedProjectId;
  }, [params, searchParams, storedProjectId]);

  const effectiveProjectType = projectType || storedProjectType;
  const isAgile = useMemo(() => isAgileProjectType(effectiveProjectType), [effectiveProjectType]);

  useEffect(() => {
    const storedId = getScopedProjectValue('currentProjectId');
    if (projectId && storedId !== projectId) {
      setScopedProjectValue('currentProjectId', projectId);
      removeScopedProjectValue('currentProjectType');
      // Do not call setProjectType synchronously here to avoid cascading renders.
    }

    let cancelled = false;
    const fetchProjectStatus = async () => {
      if (!projectId) { setIsFavorite(false); return; }

      const cacheKey = buildSessionCacheKey('topbar-project', [projectId]);
      if (cacheKey) {
        const cached = getSessionCache<{ isFavorite: boolean; type: string; name: string }>(cacheKey);
        if (cached.data) {
          setIsFavorite(cached.data.isFavorite);
          setProjectType(cached.data.type);
          return;
        }
      }

      try {
        const projectData = await projectsApi.fetchProjectDetails(projectId);
        if (cancelled) return;
        const resolvedProjectType = projectData?.type || 'KANBAN';
        const isFav = Boolean(projectData?.isFavorite);
        setIsFavorite(isFav);
        setProjectType(resolvedProjectType);
        setScopedProjectValue('currentProjectType', resolvedProjectType);

        if (projectData?.name && getScopedProjectValue('currentProjectName') !== projectData.name) {
          setScopedProjectValue('currentProjectName', projectData.name);
          window.dispatchEvent(new Event('storage'));
        }

        if (cacheKey && projectData?.name) {
          setSessionCache(cacheKey, { isFavorite: isFav, type: resolvedProjectType, name: projectData.name }, 2 * 60_000);
        }
      } catch { setIsFavorite(false); }
    };
    void fetchProjectStatus();
    return () => { cancelled = true; };
  }, [projectId, storedProjectType]);

  const toggleFavorite = async () => {
    if (!projectId) return;
    const nextState = !isFavorite;
    setIsFavorite(nextState);
    try {
      await projectsApi.toggleFavorite(projectId);
      window.dispatchEvent(new CustomEvent('planora:favorite-toggled'));
    } catch { setIsFavorite(!nextState); }
  };

  const switchProject = (proj: { id: number; name: string }) => {
    setScopedProjectValue('currentProjectName', proj.name);
    setScopedProjectValue('currentProjectId', proj.id.toString());
    removeScopedProjectValue('currentProjectType');
    setProjectType(null);
    window.dispatchEvent(new CustomEvent('planora:project-accessed'));
    window.dispatchEvent(new Event('storage'));
  };

  return {
    projectId,
    projectName,
    projectType: effectiveProjectType,
    isAgile,
    isFavorite,
    toggleFavorite,
    switchProject
  };
}

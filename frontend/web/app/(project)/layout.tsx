'use client';

import { useEffect, useRef } from 'react';
import { useParams, usePathname, useRouter, useSearchParams } from 'next/navigation';
import FullLayout from '@/components/layout/FullLayout';
import api from '@/lib/axios';
import { AUTH_TOKEN_CHANGED_EVENT, ensureValidToken } from '@/lib/auth';

/**
 * Unified Project Layout
 * 
 * Provides a shared Sidebar + TopBar shell for all project tools:
 * - summary/[projectId]
 * - project/[id]/chat
 * - backlog
 * - timeline
 * - calendar
 * - members
 * - pages
 * 
 * This ensures that navigating between project tabs does not re-mount the FullLayout,
 * providing a smooth SPA feel.
 */
export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const searchParams = useSearchParams();
  const isChatRoute = pathname?.includes('/chat');
  const isInboxRoute = pathname?.startsWith('/inbox');
  const isMembersRoute = pathname?.startsWith('/members');

  // Try to resolve projectId from path params or query params
  const projectId = (params?.projectId || params?.id || searchParams.get('projectId')) as string | undefined;

  // Guard: only run syncProjectContext once per projectId
  const syncedProjectIdRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const ensureAuthenticated = async () => {
      const token = await ensureValidToken({ allowCookieRefresh: true });
      if (!token && isMounted) {
        router.replace('/login');
      }
      return token;
    };

    const syncProjectContext = async () => {
      const token = await ensureAuthenticated();
      if (!token) return;

      if (!projectId) return;
      // Skip if we already synced this project
      if (syncedProjectIdRef.current === projectId) return;
      syncedProjectIdRef.current = projectId;

      // Keep project context scoped to this tab while preserving global fallback.
      sessionStorage.setItem('currentProjectId', projectId);
      localStorage.setItem('currentProjectId', projectId);

      try {
        const projectRes = await api.get(`/api/projects/${projectId}`);
        if (projectRes?.data?.name) {
          sessionStorage.setItem('currentProjectName', projectRes.data.name);
          localStorage.setItem('currentProjectName', projectRes.data.name);
          // Update project type for TopBar logic
          if (projectRes.data.type) {
            sessionStorage.setItem('currentProjectType', projectRes.data.type);
            localStorage.setItem('currentProjectType', projectRes.data.type);
          }
        }
      } catch {
        // ignore fetch failures
      }

      try {
        await api.post(`/api/projects/${projectId}/access`);
        window.dispatchEvent(new CustomEvent('planora:project-accessed'));
      } catch {
        // ignore access record failures
      }
    };

    const handleAuthTokenChanged = () => {
      void ensureAuthenticated();
    };

    void syncProjectContext();
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, handleAuthTokenChanged);

    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, handleAuthTokenChanged);
    };
  }, [projectId, router]);

  return (
    <FullLayout>
      <main
        className={
          isChatRoute
            ? 'h-full min-h-0 flex flex-col overflow-hidden'
            : isInboxRoute || isMembersRoute
              ? 'flex flex-col min-h-full'
              : 'flex flex-col min-h-full'
        }
      >
        {children}
      </main>
    </FullLayout>
  );
}

'use client';

import { useEffect, useRef } from 'react';
import { useStomp } from '@/ws/stomp-provider';

export interface GithubCIUpdate {
  workflow: string;
  branch: string;
  status: 'success' | 'failure' | 'running';
  commitSha: string;
}

export function useGithubCISocket(
  projectId: string,
  onUpdate: (update: GithubCIUpdate) => void,
): void {
  const { connected, subscribe } = useStomp();
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!projectId || !connected) return;

    const subscription = subscribe(`/topic/projects/${projectId}/github/ci`, (message) => {
      try {
        onUpdateRef.current(JSON.parse(message.body) as GithubCIUpdate);
      } catch {
        // Ignore malformed payloads without disrupting live activity.
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, projectId, subscribe]);
}

'use client';

import { useEffect, useRef } from 'react';
import { useStomp } from '@/ws/stomp-provider';

export interface GithubPRUpdate {
  type: 'opened' | 'merged' | 'closed';
  prNumber: number;
  prTitle: string;
  prUrl: string;
  authorLogin: string;
}

export function useGithubPRSocket(
  projectId: string,
  onUpdate: (update: GithubPRUpdate) => void,
): void {
  const { connected, subscribe } = useStomp();
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!projectId || !connected) return;

    const subscription = subscribe(`/topic/projects/${projectId}/github/prs`, (message) => {
      try {
        const update = JSON.parse(message.body) as GithubPRUpdate;
        onUpdateRef.current(update);
      } catch {
        // Ignore malformed event payloads without disrupting the live subscription.
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, projectId, subscribe]);
}

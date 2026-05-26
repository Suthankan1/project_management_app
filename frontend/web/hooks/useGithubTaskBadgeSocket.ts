'use client';

import { useEffect, useRef } from 'react';
import { useStomp } from '@/ws/stomp-provider';

export interface GithubTaskBadgeUpdate {
  taskId: number;
  githubIssueNumber: number;
  githubRepoFullName: string;
  issueState: 'open' | 'closed';
}

export function useGithubTaskBadgeSocket(
  projectId: string,
  onUpdate: (update: GithubTaskBadgeUpdate) => void,
): void {
  const { connected, subscribe } = useStomp();
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!projectId || !connected) return;

    const subscription = subscribe(`/topic/projects/${projectId}/github/task-badges`, (message) => {
      try {
        const update = JSON.parse(message.body) as GithubTaskBadgeUpdate;
        onUpdateRef.current(update);
      } catch {
        // Ignore malformed payloads without interrupting live activity.
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, projectId, subscribe]);
}

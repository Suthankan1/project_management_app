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
  onError?: (message: string) => void,
): void {
  const { connected, subscribe } = useStomp();
  const onUpdateRef = useRef(onUpdate);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    if (!projectId || !connected) return;

    let subscription: { unsubscribe: () => void } | null = null;

    try {
      subscription = subscribe(`/topic/projects/${projectId}/github/task-badges`, (message) => {
        try {
          const update = JSON.parse(message.body) as GithubTaskBadgeUpdate;
          onUpdateRef.current(update);
        } catch {
          onErrorRef.current?.('Unable to parse a GitHub task badge update.');
        }
      });
    } catch {
      onErrorRef.current?.('Failed to subscribe to GitHub task badge updates.');
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, projectId, subscribe]);
}

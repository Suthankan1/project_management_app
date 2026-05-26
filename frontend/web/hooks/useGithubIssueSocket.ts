'use client';

import { useEffect, useRef } from 'react';
import { useStomp } from '@/ws/stomp-provider';

export interface GithubIssueUpdate {
  action: 'opened' | 'closed' | 'labeled' | 'assigned';
  issueNumber: number;
  issueTitle: string;
  actorLogin: string;
}

export function useGithubIssueSocket(
  projectId: string,
  onUpdate: (update: GithubIssueUpdate) => void,
): void {
  const { connected, subscribe } = useStomp();
  const onUpdateRef = useRef(onUpdate);

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    if (!projectId || !connected) return;

    const subscription = subscribe(`/topic/projects/${projectId}/github/issues`, (message) => {
      try {
        onUpdateRef.current(JSON.parse(message.body) as GithubIssueUpdate);
      } catch {
        // Ignore malformed payloads without disrupting live activity.
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, projectId, subscribe]);
}

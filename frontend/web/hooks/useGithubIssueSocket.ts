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
      subscription = subscribe(`/topic/projects/${projectId}/github/issues`, (message) => {
        try {
          onUpdateRef.current(JSON.parse(message.body) as GithubIssueUpdate);
        } catch {
          onErrorRef.current?.('Unable to parse a GitHub issue update.');
        }
      });
    } catch {
      onErrorRef.current?.('Failed to subscribe to GitHub issue updates.');
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, projectId, subscribe]);
}

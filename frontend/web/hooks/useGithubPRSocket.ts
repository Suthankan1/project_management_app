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
      subscription = subscribe(`/topic/projects/${projectId}/github/prs`, (message) => {
        try {
          const update = JSON.parse(message.body) as GithubPRUpdate;
          onUpdateRef.current(update);
        } catch {
          onErrorRef.current?.('Unable to parse a GitHub pull request update.');
        }
      });
    } catch {
      onErrorRef.current?.('Failed to subscribe to GitHub pull request updates.');
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, projectId, subscribe]);
}

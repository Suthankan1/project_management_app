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
  onError?: (message: string) => void,
): void {
  const { connected, subscribe, reconnectCount } = useStomp();
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
      subscription = subscribe(`/topic/projects/${projectId}/github/ci`, (message) => {
        try {
          onUpdateRef.current(JSON.parse(message.body) as GithubCIUpdate);
        } catch {
          onErrorRef.current?.('Unable to parse a GitHub CI update.');
        }
      });
    } catch {
      onErrorRef.current?.('Failed to subscribe to GitHub CI updates.');
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [connected, projectId, reconnectCount, subscribe]);
}

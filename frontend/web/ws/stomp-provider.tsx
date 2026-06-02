'use client';

import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { CompatClient, Stomp, IMessage } from '@stomp/stompjs';
import { AUTH_TOKEN_CHANGED_EVENT, ensureValidToken, refreshAccessToken } from '@/lib/auth';
import { resolveWebSocketBaseUrl } from '@/lib/realtime-url';

// ── Types ──

interface StompContextValue {
  client: CompatClient | null;
  connected: boolean;
  reconnectCount: number;
  subscribe: (
    destination: string,
    callback: (message: IMessage) => void,
  ) => { unsubscribe: () => void } | null;
  send: (destination: string, body: string) => void;
}

interface StompProviderProps {
  token: string;
  children: React.ReactNode;
}

// ── Context ──

const StompContext = createContext<StompContextValue>({
  client: null,
  connected: false,
  reconnectCount: 0,
  subscribe: () => null,
  send: () => { },
});

export const useStomp = () => useContext(StompContext);

// ── Provider ──

export function StompProvider({ token, children }: StompProviderProps) {
  const clientRef = useRef<CompatClient | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const connectingRef = useRef(false);
  const [clientState, setClientState] = useState<CompatClient | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    let disposed = false;
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const wsUrl = resolveWebSocketBaseUrl(backendUrl);

    const clearReconnectTimer = () => {
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };

    const isAuthError = (error: unknown): boolean => {
      const text = typeof error === 'string'
        ? error
        : ((error as { headers?: { message?: string } })?.headers?.message || '');
      const normalized = text.toLowerCase();
      return normalized.includes('auth')
        || normalized.includes('jwt')
        || normalized.includes('token')
        || normalized.includes('expired')
        || normalized.includes('invalid');
    };

    const scheduleReconnect = (delayOverride?: number) => {
      if (disposed) return;
      clearReconnectTimer();
      const baseDelay = Math.min(30000, Math.pow(2, reconnectAttemptRef.current) * 1000);
      const jitter = delayOverride == null ? Math.floor(Math.random() * 250) : 0;
      const delay = (delayOverride ?? baseDelay) + jitter;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connectClient();
      }, delay);
    };

    const connectClient = async () => {
      if (disposed || connectingRef.current) return;
      connectingRef.current = true;

      try {
        const validToken = await ensureValidToken();
        if (!validToken) {
          setConnected(false);
          setClientState(null);
          clientRef.current = null;
          connectingRef.current = false;
          return;
        }

        const stompClient = Stomp.client(`${wsUrl}/ws-native`);
        stompClient.debug = () => { };
        stompClient.reconnect_delay = 0;

        stompClient.connect(
          { Authorization: `Bearer ${validToken}` },
          () => {
            if (disposed) {
              try {
                stompClient.disconnect();
              } catch {
                // ignore disconnect races on unmount
              }
              return;
            }

            reconnectAttemptRef.current = 0;
            clientRef.current = stompClient;
            setClientState(stompClient);
            setConnected(true);
            setReconnectCount((prev) => prev + 1);
            connectingRef.current = false;
          },
          async (error: unknown) => {
            setConnected(false);
            setClientState(null);
            clientRef.current = null;
            connectingRef.current = false;

            if (isAuthError(error)) {
              const refreshedToken = await refreshAccessToken().catch(() => null);
              if (refreshedToken) {
                reconnectAttemptRef.current = 0;
                scheduleReconnect(500);
                return;
              }
              reconnectAttemptRef.current += 1;
              scheduleReconnect();
              return;
            }

            reconnectAttemptRef.current += 1;
            scheduleReconnect();
          },
        );
      } catch {
        connectingRef.current = false;
        reconnectAttemptRef.current += 1;
        scheduleReconnect();
      }
    };

    const reconnectOnTokenChange = () => {
      reconnectAttemptRef.current = 0;
      clearReconnectTimer();
      const existing = clientRef.current;
      clientRef.current = null;
      setConnected(false);
      setClientState(null);
      if (existing?.connected) {
        existing.disconnect(() => {
          connectClient();
        });
        return;
      }
      connectClient();
    };

    connectClient();
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, reconnectOnTokenChange);

    return () => {
      disposed = true;
      connectingRef.current = false;
      clearReconnectTimer();
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, reconnectOnTokenChange);
      setConnected(false);
      setClientState(null);
      const existing = clientRef.current;
      if (existing?.connected) {
        existing.disconnect();
      }
      clientRef.current = null;
    };
  }, [token]);

  const subscribe = useCallback(
    (destination: string, callback: (message: IMessage) => void) => {
      if (!clientRef.current?.connected) return null;
      return clientRef.current.subscribe(destination, callback);
    },
    [],
  );

  const send = useCallback(
    (destination: string, body: string) => {
      if (!clientRef.current?.connected) return;
      clientRef.current.send(destination, {}, body);
    },
    [],
  );

  return (
    <StompContext.Provider value={{ client: clientState, connected, subscribe, send, reconnectCount }}>
      {children}
    </StompContext.Provider>
  );
}

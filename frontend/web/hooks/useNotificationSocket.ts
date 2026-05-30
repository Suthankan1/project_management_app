import { useEffect, useRef, useState } from 'react';
import { CompatClient, Stomp } from '@stomp/stompjs';
import { AUTH_TOKEN_CHANGED_EVENT, ensureValidToken } from '@/lib/auth';
import { resolveWebSocketBaseUrl } from '@/lib/realtime-url';

interface UseNotificationSocketOptions {
  token: string | null;
  enabled?: boolean;
  onNotification: () => void;
}

export default function useNotificationSocket({
  token,
  enabled = true,
  onNotification,
}: UseNotificationSocketOptions) {
  const clientRef = useRef<CompatClient | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const connectingRef = useRef(false);
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    if (!enabled || !token) return;

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
      const message = typeof error === 'string'
        ? error
        : ((error as { headers?: { message?: string } })?.headers?.message || '');
      const normalized = message.toLowerCase();
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
      const delay = delayOverride ?? baseDelay;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        connectClient();
      }, delay);
    };

    const connectClient = async () => {
      if (disposed || connectingRef.current) return;
      connectingRef.current = true;

      try {
        const refreshedToken = await ensureValidToken();
        if (!refreshedToken) {
          connectingRef.current = false;
          clientRef.current = null;
          return;
        }

        const client: CompatClient = Stomp.client(`${wsUrl}/ws-native`);
        client.debug = () => {};
        client.reconnect_delay = 0;
        clientRef.current = client;

        client.connect(
          { Authorization: `Bearer ${refreshedToken}` },
          () => {
            reconnectAttemptRef.current = 0;
            connectingRef.current = false;
            setReconnectCount((prev) => prev + 1);
          },
          async (error: unknown) => {
            connectingRef.current = false;
            clientRef.current = null;

            if (isAuthError(error)) {
              const nextToken = await ensureValidToken();
              if (nextToken) {
                reconnectAttemptRef.current = 0;
                scheduleReconnect(500);
              }
              return;
            }

            reconnectAttemptRef.current += 1;
            scheduleReconnect();
          }
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
      const existing = clientRef.current;
      clientRef.current = null;
      if (existing?.connected) {
        existing.disconnect(() => {});
      }
    };
  }, [enabled, token, onNotification]);

  useEffect(() => {
    if (!enabled || !token || !clientRef.current?.connected) return;

    const subscription = clientRef.current.subscribe('/user/queue/notifications', () => {
      onNotification();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [enabled, token, onNotification, reconnectCount]);
}

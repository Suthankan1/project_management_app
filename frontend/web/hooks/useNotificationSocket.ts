import { useEffect, useRef, useState } from 'react';
import { CompatClient, Stomp } from '@stomp/stompjs';
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
  const [reconnectCount, setReconnectCount] = useState(0);

  useEffect(() => {
    if (!enabled || !token) return;

    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';
    const wsUrl = resolveWebSocketBaseUrl(backendUrl);
    const client: CompatClient = Stomp.client(`${wsUrl}/ws-native`);
    client.debug = () => {};
    clientRef.current = client;

    client.connect(
      { Authorization: `Bearer ${token}` },
      () => {
        setReconnectCount((prev) => prev + 1);
      },
      () => {
        // no-op: sidebar can continue without live notification updates
      }
    );

    return () => {
      clientRef.current = null;
      if (client.connected) {
        client.disconnect(() => {});
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

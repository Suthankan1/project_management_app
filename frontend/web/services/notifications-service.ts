import api from '@/lib/axios';

// ── Types ──

export interface Notification {
  id: number;
  message: string;
  type?: string;
  link?: string;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
}

export interface NotificationFeedResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ── API ──

export async function fetchNotifications(): Promise<NotificationFeedResponse> {
  const { data } = await api.get<NotificationFeedResponse>('/api/notifications');
  return data;
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.patch(`/api/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.patch('/api/notifications/read-all');
}

export async function deleteNotification(id: number): Promise<void> {
  await api.delete(`/api/notifications/${id}`);
}

export async function deleteAllNotifications(ids: number[]): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(ids.map((id) => deleteNotification(id)));
}

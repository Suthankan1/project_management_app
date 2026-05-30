import { notificationsApi } from './api-contract';
import type { NotificationDto as Notification, NotificationFeedResponse } from './api-contract';

export type { Notification, NotificationFeedResponse };

export async function fetchNotifications(): Promise<NotificationFeedResponse> {
  return notificationsApi.list();
}

export async function markNotificationRead(id: number): Promise<void> {
  return notificationsApi.markRead(id);
}

export async function markAllNotificationsRead(): Promise<void> {
  return notificationsApi.markAllRead();
}

export async function deleteNotification(id: number): Promise<void> {
  return notificationsApi.delete(id);
}

export async function deleteAllNotifications(ids: number[]): Promise<PromiseSettledResult<void>[]> {
  return Promise.allSettled(ids.map((id) => deleteNotification(id)));
}

import { notificationsApi } from './api-contract';
import type { NotificationPreferenceRow, UpdateNotificationPreferenceRequest } from './api-contract';

export type NotificationChannel = 'IN_APP' | 'EMAIL';
export type { NotificationPreferenceRow, UpdateNotificationPreferenceRequest };

export async function fetchNotificationPreferences(projectId?: number): Promise<NotificationPreferenceRow[]> {
  return notificationsApi.getPreferences(projectId);
}

export async function updateNotificationPreference(
  payload: UpdateNotificationPreferenceRequest
): Promise<NotificationPreferenceRow> {
  return notificationsApi.updatePreference(payload);
}
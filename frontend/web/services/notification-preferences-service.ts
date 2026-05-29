import api from '@/lib/axios';

export type NotificationChannel = 'IN_APP' | 'EMAIL';

export interface NotificationPreferenceRow {
  id?: number;
  projectId: number | null;
  eventType: string;
  channel: NotificationChannel;
  enabled: boolean;
}

export interface UpdateNotificationPreferenceRequest {
  projectId: number | null;
  eventType: string;
  channel: NotificationChannel;
  enabled: boolean;
}

export async function fetchNotificationPreferences(projectId?: number): Promise<NotificationPreferenceRow[]> {
  const { data } = await api.get<NotificationPreferenceRow[]>('/api/notification-preferences', {
    params: projectId == null ? undefined : { projectId },
  });
  return data;
}

export async function updateNotificationPreference(
  payload: UpdateNotificationPreferenceRequest
): Promise<NotificationPreferenceRow> {
  const { data } = await api.put<NotificationPreferenceRow>('/api/notification-preferences', payload);
  return data;
}
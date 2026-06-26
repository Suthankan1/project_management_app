import api from '../api/axios';

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

export const notificationPreferencesService = {
  getPreferences: (projectId?: number | null): Promise<NotificationPreferenceRow[]> =>
    api
      .get<NotificationPreferenceRow[]>('/api/notification-preferences', {
        params: projectId == null ? undefined : { projectId },
      })
      .then((r) => r.data ?? []),

  updatePreference: (payload: UpdateNotificationPreferenceRequest): Promise<NotificationPreferenceRow> =>
    api.put<NotificationPreferenceRow>('/api/notification-preferences', payload).then((r) => r.data),
};

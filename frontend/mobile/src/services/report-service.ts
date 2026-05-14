/**
 * report-service.ts
 * Mobile API service for project reports — download + schedule management.
 * Mirrors web: report-download-service.ts + report-schedule-service.ts
 */

import api from '../api/axios';

// ── Download ──────────────────────────────────────────────────────────────────

export type ReportDownloadFormat = 'pdf' | 'excel';

function resolveFormatParam(format: ReportDownloadFormat): 'PDF' | 'EXCEL' {
  return format === 'pdf' ? 'PDF' : 'EXCEL';
}

/**
 * Downloads the project report and returns the blob URL so the
 * caller can open/share it via Expo's FileSystem + Sharing APIs.
 */
export async function downloadProjectReport(
  projectId: number,
  format: ReportDownloadFormat,
): Promise<{ blob: ArrayBuffer; contentType: string; fileName: string }> {
  const response = await api.get<ArrayBuffer>(
    `/api/projects/${projectId}/reports/download`,
    {
      params: { format: resolveFormatParam(format) },
      responseType: 'arraybuffer',
    },
  );

  const rawContentType = response.headers['content-type'];
  const contentType =
    typeof rawContentType === 'string'
      ? rawContentType
      : format === 'pdf'
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  // Try to extract filename from Content-Disposition header
  const cd = response.headers['content-disposition'] ?? '';
  const utf8Match = cd.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  const basicMatch = cd.match(/filename="?([^";]+)"?/i)?.[1];
  const fileName =
    (utf8Match ? decodeURIComponent(utf8Match) : basicMatch) ||
    (format === 'pdf' ? 'project_report.pdf' : 'project_report.xlsx');

  return { blob: response.data, contentType, fileName };
}

// ── Schedule types ─────────────────────────────────────────────────────────────

export type ReportFormat   = 'PDF' | 'EXCEL' | 'BOTH';
export type ScheduleType   = 'ONE_TIME' | 'RECURRING';
export type Frequency      = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type EndType        = 'AFTER_N' | 'UNTIL_DATE' | 'MANUAL';
export type ScheduleStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export interface ScheduledReportRequest {
  projectId:           number;
  format:              ReportFormat;
  scheduleType:        ScheduleType;
  frequency?:          Frequency;
  customIntervalDays?: number;
  sendTime:            string;           // "HH:mm"
  sendDayOfWeek?:      number;           // 0=Sun…6=Sat
  sendDayOfMonth?:     number;           // 1–31
  scheduledDate?:      string;           // "YYYY-MM-DD"
  timezone?:           string;
  recipientsTo:        string[];
  recipientsCc?:       string[];
  recipientsBcc?:      string[];
  subject?:            string;
  bodyMessage?:        string;
  endType?:            EndType;
  endAfterCount?:      number;
  endDate?:            string;           // "YYYY-MM-DD"
}

export interface ScheduledReportResponse {
  id:              number;
  projectId:       number;
  format:          ReportFormat;
  scheduleType:    ScheduleType;
  frequency?:      Frequency;
  customIntervalDays?: number;
  sendTime:        string;
  sendDayOfWeek?:  number;
  sendDayOfMonth?: number;
  scheduledDate?:  string;
  timezone?:       string;
  recipientsTo:    string[];
  recipientsCc?:   string[];
  recipientsBcc?:  string[];
  subject?:        string;
  bodyMessage?:    string;
  endType?:        EndType;
  endAfterCount?:  number;
  endDate?:        string;
  sendCount:       number;
  status:          ScheduleStatus;
  nextSendAt?:     string;
  lastSentAt?:     string;
  createdAt:       string;
}

// ── Schedule API ──────────────────────────────────────────────────────────────

export const createScheduledReport = (
  payload: ScheduledReportRequest,
): Promise<ScheduledReportResponse> =>
  api.post<ScheduledReportResponse>('/api/scheduled-reports', payload).then(r => r.data);

export const getProjectScheduledReports = (
  projectId: number,
): Promise<ScheduledReportResponse[]> =>
  api
    .get<ScheduledReportResponse[]>(`/api/scheduled-reports/project/${projectId}`)
    .then(r => r.data);

export const deleteScheduledReport = (id: number): Promise<void> =>
  api.delete(`/api/scheduled-reports/${id}`).then(() => undefined);

export const pauseScheduledReport = (id: number): Promise<ScheduledReportResponse> =>
  api.patch<ScheduledReportResponse>(`/api/scheduled-reports/${id}/pause`).then(r => r.data);

export const resumeScheduledReport = (id: number): Promise<ScheduledReportResponse> =>
  api.patch<ScheduledReportResponse>(`/api/scheduled-reports/${id}/resume`).then(r => r.data);

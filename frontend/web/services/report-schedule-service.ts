import { reportsApi } from './api-contract';
import type { ScheduledReportRequest, ScheduledReportResponse } from './api-contract';

export type ReportFormat    = 'PDF' | 'EXCEL' | 'BOTH';
export type ScheduleType    = 'ONE_TIME' | 'RECURRING';
export type Frequency       = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'CUSTOM';
export type EndType         = 'AFTER_N' | 'UNTIL_DATE' | 'MANUAL';
export type ScheduleStatus  = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED';

export type { ScheduledReportRequest, ScheduledReportResponse };

export const createScheduledReport = (payload: ScheduledReportRequest): Promise<ScheduledReportResponse> =>
  reportsApi.createScheduled(payload);

export const getProjectScheduledReports = (projectId: number): Promise<ScheduledReportResponse[]> =>
  reportsApi.listScheduled(projectId);

export const deleteScheduledReport = (id: number): Promise<void> =>
  reportsApi.deleteScheduled(id);

export const pauseScheduledReport = (id: number): Promise<ScheduledReportResponse> =>
  reportsApi.pauseScheduled(id);

export const resumeScheduledReport = (id: number): Promise<ScheduledReportResponse> =>
  reportsApi.resumeScheduled(id);

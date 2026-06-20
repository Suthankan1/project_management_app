// lib/report/index.ts — clean barrel export for all report utilities
export { buildReportData }       from './reportUtils';
export { generatePDFReport }     from './pdfReportGenerator';
export type { ReportData, TaskSummary, SprintStat, MemberStat, PriorityDist, StatusDist } from './reportUtils';

import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function ReportLoading() {
  return <RouteLoadingState title="Loading report" subtitle="Fetching metrics, tasks, milestones, and team data." variant="detail" />;
}
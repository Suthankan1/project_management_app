import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function TimelineLoading() {
  return <RouteLoadingState title="Loading timeline" subtitle="Fetching scheduled tasks and milestones." variant="cards" />;
}
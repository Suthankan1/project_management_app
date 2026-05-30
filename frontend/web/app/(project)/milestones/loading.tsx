import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function MilestonesLoading() {
  return <RouteLoadingState title="Loading milestones" subtitle="Fetching milestone cards and project progress." variant="cards" />;
}
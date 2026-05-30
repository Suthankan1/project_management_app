import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function BacklogLoading() {
  return <RouteLoadingState title="Loading backlog" subtitle="Fetching archived tasks and backlog filters." variant="cards" />;
}
import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function ListLoading() {
  return <RouteLoadingState title="Loading task list" subtitle="Fetching list data and filters." variant="table" />;
}
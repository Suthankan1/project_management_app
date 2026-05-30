import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function KanbanLoading() {
  return <RouteLoadingState title="Loading board" subtitle="Fetching the latest kanban columns and tasks." variant="board" />;
}
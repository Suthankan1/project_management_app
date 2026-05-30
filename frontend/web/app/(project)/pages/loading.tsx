import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function PagesLoading() {
  return <RouteLoadingState title="Loading pages" subtitle="Fetching page templates and document navigation." variant="detail" />;
}
import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function GitHubProjectLoading() {
  return <RouteLoadingState title="Loading GitHub view" subtitle="Fetching repository, PR, issue, and CI data." variant="detail" />;
}
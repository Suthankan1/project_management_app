import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function GitHubSettingsLoading() {
  return <RouteLoadingState title="Loading GitHub settings" subtitle="Fetching connected repositories and branch details." variant="detail" />;
}
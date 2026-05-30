import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function FoldersLoading() {
  return <RouteLoadingState title="Loading documents" subtitle="Fetching folders, files, and project context." variant="detail" />;
}
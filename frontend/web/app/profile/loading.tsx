import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function ProfileLoading() {
  return <RouteLoadingState title="Loading profile" subtitle="Fetching your account and profile details." variant="detail" />;
}
import { RouteLoadingState } from '@/components/shared/RouteBoundaryState';

export default function WorkloadLoading() {
  return <RouteLoadingState title="Loading workload" subtitle="Fetching team allocation and unassigned tasks." variant="detail" />;
}
'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function WorkloadError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('Workload route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load workload"
      subtitle="The workload view could not fetch project members and tasks. Retry to try again."
      onRetry={reset}
    />
  );
}
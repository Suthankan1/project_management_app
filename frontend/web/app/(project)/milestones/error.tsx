'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function MilestonesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('Milestones route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load milestones"
      subtitle="Milestone data failed to load. Retry to fetch the latest project milestones again."
      onRetry={reset}
    />
  );
}
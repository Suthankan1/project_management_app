'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function BacklogError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('Backlog route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load backlog"
      subtitle="The backlog data failed to load. Retry to fetch the latest tasks again."
      onRetry={reset}
    />
  );
}
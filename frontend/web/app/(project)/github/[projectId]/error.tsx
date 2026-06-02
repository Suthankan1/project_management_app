'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function GitHubProjectError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('GitHub project route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load GitHub view"
      subtitle="The GitHub project data failed to load. Retry to fetch the repository state again."
      onRetry={reset}
    />
  );
}
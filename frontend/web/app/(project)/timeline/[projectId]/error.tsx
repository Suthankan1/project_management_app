'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function TimelineError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('Timeline route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load timeline"
      subtitle="The timeline data failed to load. Retry to re-run the project fetches."
      onRetry={reset}
    />
  );
}
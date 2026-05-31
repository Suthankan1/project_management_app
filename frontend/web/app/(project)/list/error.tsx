'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function ListError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('List route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load task list"
      subtitle="The task list could not be rendered. Retry to run the data fetches again."
      onRetry={reset}
    />
  );
}
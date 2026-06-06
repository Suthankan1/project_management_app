'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function PagesError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('Pages route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load pages"
      subtitle="The pages view could not fetch the project pages. Retry to run the request again."
      onRetry={reset}
    />
  );
}
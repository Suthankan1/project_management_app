'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function ReportError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('Report route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load report"
      subtitle="The project report failed to load. Retry to fetch the report data again."
      onRetry={reset}
    />
  );
}
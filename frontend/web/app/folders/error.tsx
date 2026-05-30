'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function FoldersError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('Folders route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load documents"
      subtitle="Folder data failed to load. Retry to fetch the latest documents again."
      onRetry={reset}
    />
  );
}
'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function KanbanError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('Kanban route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load the board"
      subtitle="Something went wrong while fetching the kanban board. Retry to re-run the data requests."
      onRetry={reset}
    />
  );
}
'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function GitHubSettingsError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('GitHub settings route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load GitHub settings"
      subtitle="The connected repositories list could not be loaded. Retry to fetch it again."
      onRetry={reset}
    />
  );
}
'use client';

import { useEffect } from 'react';
import { RouteErrorState } from '@/components/shared/RouteBoundaryState';

export default function ProfileError({ error, reset }: { error: Error & { digest?: string }; reset: () => void; }) {
  useEffect(() => {
    console.error('Profile route error:', error);
  }, [error]);

  return (
    <RouteErrorState
      title="Unable to load profile"
      subtitle="Your profile details could not be loaded. Retry to fetch them again."
      onRetry={reset}
    />
  );
}
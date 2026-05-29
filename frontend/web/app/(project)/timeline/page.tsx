'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function TimelineRedirect() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const projectId = searchParams.get('projectId');
    if (projectId) {
      router.replace(`/timeline/${projectId}`);
    }
  }, [searchParams, router]);

  return null;
}

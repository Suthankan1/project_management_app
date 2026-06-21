'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import type { User } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';
import { resolveProfilePhotoUrl } from '@/lib/profile-photo';

// Fail early if configuration is invalid (e.g. in production)
getApiBaseUrl();

interface UseDashboardProfileReturn {
  resolvedProfilePicUrl: string;
}

export function useDashboardProfile(user: User | null): UseDashboardProfileReturn {
  const [profilePicUrl, setProfilePicUrl] = useState<string | null>(null);

  // Effect to fetch user profile data from the server
  useEffect(() => {
    if (!user?.email) return;
    api
      .get('/api/user/profile')
      .then((res) => {
        if (res.data?.profilePicUrl) setProfilePicUrl(res.data.profilePicUrl);
      })
      .catch(() => {});
  }, [user]);

  // Memoize the final URL construction to optimize performance
  const resolvedProfilePicUrl = useMemo(() => {
    return resolveProfilePhotoUrl(profilePicUrl, user?.userId) || '';
  }, [profilePicUrl, user?.userId]);

  return { resolvedProfilePicUrl };
}

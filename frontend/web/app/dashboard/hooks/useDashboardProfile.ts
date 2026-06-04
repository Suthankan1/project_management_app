'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import type { User } from '@/lib/auth';
import { getApiBaseUrl } from '@/lib/api-base-url';

// Fail early if configuration is invalid (e.g. in production)
getApiBaseUrl();

interface UserSummary {
  email: string;
  profilePicUrl?: string;
}

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
    if (!profilePicUrl) return '';
    // Check if the URL is absolute or relative
    if (profilePicUrl.startsWith('http://') || profilePicUrl.startsWith('https://'))
      return profilePicUrl;
    // Prefix relative URLs with the API base URL
    const baseUrl = getApiBaseUrl();
    return `${baseUrl || ''}${profilePicUrl}`;
  }, [profilePicUrl]);

  return { resolvedProfilePicUrl };
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/axios';
import type { User } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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
      .get('/api/auth/users')
      .then((res) => {
        const found = (res.data as UserSummary[]).find(
          (u) => u.email.toLowerCase() === user.email!.toLowerCase()
        );
        if (found?.profilePicUrl) setProfilePicUrl(found.profilePicUrl);
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
    return `${API_BASE_URL}${profilePicUrl}`;
  }, [profilePicUrl]);

  return { resolvedProfilePicUrl };
}

'use client';

import useSWR from 'swr';
import api from '@/lib/axios';
import { getApiBaseUrl } from '@/lib/api-base-url';

interface UserProfile {
    email?: string;
    username?: string;
    fullName?: string;
    profilePicUrl?: string;
    githubUsername?: string;
}

const API_BASE_URL = getApiBaseUrl();

function resolveUrl(url: string | undefined | null): string {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${API_BASE_URL}${url}`;
}

const fetcher = (url: string) => api.get<UserProfile>(url).then(r => r.data);

export function useCurrentUser() {
    const { data, error, isLoading } = useSWR<UserProfile>('/api/user/profile', fetcher, {
        dedupingInterval: 3_600_000, // 1 hour — re-use across Sidebar + TopBar
        revalidateOnFocus: false,
        onSuccess: (profileData) => {
            if (typeof window !== 'undefined' && profileData) {
                localStorage.setItem('userProfile', JSON.stringify(profileData));
            }
        }
    });

    return {
        user: data,
        profilePicUrl: resolveUrl(data?.profilePicUrl),
        error,
        isLoading,
    };
}

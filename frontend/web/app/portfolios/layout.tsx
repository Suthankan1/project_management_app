'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullLayout from '@/components/layout/FullLayout';
import { AUTH_TOKEN_CHANGED_EVENT, ensureValidToken } from '@/lib/auth';

export default function PortfoliosLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const ensureAuthenticated = async () => {
            const token = await ensureValidToken({ allowCookieRefresh: true });
            if (token || !isMounted) return;
            router.replace('/login');
        };
        const handleStorage = (e: StorageEvent) => {
            if (
                e.key === 'token'
                || e.key === 'planora:access_token'
                || e.key === 'planora:has_refresh_token'
                || e.key === 'planora:auth_sync'
                || e.key === 'rememberMe'
                || e.key === null
            ) {
                void ensureAuthenticated();
            }
        };
        void ensureAuthenticated();
        window.addEventListener('storage', handleStorage);
        window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, ensureAuthenticated);
        return () => {
            isMounted = false;
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, ensureAuthenticated);
        };
    }, [router]);

    return (
        <FullLayout>
            <main className="flex-1 flex flex-col min-h-full bg-cu-bg-secondary">
                {children}
            </main>
        </FullLayout>
    );
}

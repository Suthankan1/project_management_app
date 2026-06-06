'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullLayout from '@/components/layout/FullLayout';
import { AUTH_TOKEN_CHANGED_EVENT, ensureValidToken } from '@/lib/auth';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const ensureAuthenticated = async () => {
            const token = await ensureValidToken();
            if (token || !isMounted) return;
            router.replace('/login');
        };

        const handleStorage = (event: StorageEvent) => {
            if (
                event.key === 'token'
                || event.key === 'planora:access_token'
                || event.key === 'planora:refresh_token'
                || event.key === 'planora:has_refresh_token'
                || event.key === 'rememberMe'
                || event.key === null
            ) {
                void ensureAuthenticated();
            }
        };
        const handleAuthTokenChanged = () => {
            void ensureAuthenticated();
        };

        void ensureAuthenticated();

        window.addEventListener('storage', handleStorage);
        window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, handleAuthTokenChanged);
        return () => {
            isMounted = false;
            window.removeEventListener('storage', handleStorage);
            window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, handleAuthTokenChanged);
        };
    }, [router]);

    return (
        <FullLayout>
            <main className="flex-1 flex flex-col min-h-full bg-cu-bg px-4 md:px-8 pt-4 pb-0 md:pb-8">
                {children}
            </main>
        </FullLayout>
    );
}

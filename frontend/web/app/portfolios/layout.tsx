'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import FullLayout from '@/components/layout/FullLayout';
import { AUTH_TOKEN_CHANGED_EVENT, getValidToken } from '@/lib/auth';

export default function PortfoliosLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();

    useEffect(() => {
        const ensureAuthenticated = () => {
            if (getValidToken()) return;
            router.replace('/login');
        };
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'token' || e.key === 'rememberMe' || e.key === null) ensureAuthenticated();
        };
        ensureAuthenticated();
        window.addEventListener('storage', handleStorage);
        window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, ensureAuthenticated);
        return () => {
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

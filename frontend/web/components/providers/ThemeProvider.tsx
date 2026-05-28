'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ theme: 'light', toggleTheme: () => {} });

const AUTH_ROUTES = [
    '/',
    '/login',
    '/register',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
];

function isAuthRoute(pathname: string | null): boolean {
    return AUTH_ROUTES.some((route) => pathname === route || pathname?.startsWith(`${route}/`));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
    const pathname = usePathname();
    const forceLight = isAuthRoute(pathname);

    // Read the explicit user preference only; system dark mode does not auto-apply.
    const [theme, setTheme] = useState<Theme>(() => {
        if (typeof window === 'undefined') return 'light';
        const stored = localStorage.getItem('planora-theme') as Theme | null;
        return stored === 'dark' ? 'dark' : 'light';
    });

    // Keep auth pages light while preserving the saved preference for the app shell.
    useEffect(() => {
        document.documentElement.classList.toggle('dark', !forceLight && theme === 'dark');
    }, [forceLight, theme]);

    const toggleTheme = () => {
        setTheme((prev) => {
            const next: Theme = prev === 'light' ? 'dark' : 'light';
            localStorage.setItem('planora-theme', next);
            document.documentElement.classList.toggle('dark', !forceLight && next === 'dark');
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

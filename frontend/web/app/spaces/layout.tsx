'use client';

import React from 'react';
import FullLayout from '@/components/layout/FullLayout';

export default function SpacesLayout({ children }: { children: React.ReactNode }) {
    return (
        <FullLayout>
            <main className="flex-1 flex flex-col min-h-full bg-cu-bg-secondary">
                {children}
            </main>
        </FullLayout>
    );
}

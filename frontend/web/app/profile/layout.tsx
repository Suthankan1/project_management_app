'use client';

import React from 'react';
import FullLayout from '@/components/layout/FullLayout';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <FullLayout>
            <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-cu-bg-secondary">
                {children}
            </main>
        </FullLayout>
    );
}


'use client';

import { Suspense } from 'react';
import FullLayout from '@/components/layout/FullLayout';

export default function FoldersLayout({ children }: { children: React.ReactNode }) {
    return (
        <FullLayout>
            {/* overflow-x-hidden prevents horizontal scrollbar when tables or wide file names overflow momentarily */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F7F8FA] p-3 sm:p-6 pb-6">
                {/* Suspense is required because child pages call useSearchParams which suspends during SSR */}
                <Suspense fallback={null}>
                    {children}
                </Suspense>
            </main>
        </FullLayout>
    );
}

'use client';

import React from 'react';
import FullLayout from '@/components/layout/FullLayout';

export default function NotificationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FullLayout>
      <main className="flex-1 overflow-y-auto bg-[#F7F8FA]">
        {children}
      </main>
    </FullLayout>
  );
}

'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import NotificationPreferencesPanel from '@/components/settings/NotificationPreferencesPanel';

export default function NotificationSettingsPage() {
  return (
    <div className="mobile-page-padding max-w-[1200px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/profile" className="inline-flex items-center gap-2 text-sm font-semibold text-[#155DFC] hover:underline">
            <ArrowLeft size={14} />
            Back to profile
          </Link>
          <h1 className="mt-3 text-[26px] sm:text-[30px] font-bold tracking-tight text-[#101828]">Notification Settings</h1>
          <p className="mt-1 text-sm text-[#667085]">Choose how you want each type of notification delivered.</p>
        </div>
      </div>

      <NotificationPreferencesPanel
        title="Global notification defaults"
        description="These settings apply across your account unless a project override is defined in that project's settings."
        helperText="Turn channels on or off for each event type. In-app notifications still power the bell badge and notification feed."
      />
    </div>
  );
}
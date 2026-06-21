'use client';

import Image from 'next/image';
import type { User } from '@/lib/auth';
import WelcomeGreeting from '@/components/ui/WelcomeGreeting';
import { NotificationBell } from '@/components/layout/topbar/NotificationBell';

interface DashboardHeaderProps {
  user: User | null;
  resolvedProfilePicUrl: string;
}

export default function DashboardHeader({ user, resolvedProfilePicUrl }: DashboardHeaderProps) {
  return (
    <div className="sticky top-0 z-30 w-full flex items-center justify-between gap-3 py-3 px-1 bg-cu-bg/95 backdrop-blur-md rounded-b-[10px] shadow-cu-sm mb-1">

      {/* Left side: Mobile menu toggle button and Welcome message */}
      <div className="flex flex-1 items-center gap-2.5 min-w-0">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('planora:sidebar:toggle'))}
          className="md:hidden p-2 -ml-2 text-cu-text-secondary rounded-xl hover:bg-cu-hover transition-colors shrink-0 active:bg-cu-hover"
          aria-label="Toggle Sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div className="md:hidden font-outfit text-[22px] font-extrabold tracking-tight text-cu-text-primary ml-1.5 flex items-center gap-2">
          <span className="w-2.5 h-6 bg-cu-primary rounded-full" />
          PLANORA
        </div>

        <div className="hidden md:flex min-w-0 flex-1 overflow-hidden">
          <WelcomeGreeting username={user?.username || 'User'} />
        </div>
      </div>

      {/* Right side: Notification bell and User profile picture */}
      <div className="flex items-center gap-3 shrink-0 pl-2">
        <NotificationBell />

        {resolvedProfilePicUrl ? (
          <div className="w-8 h-8 rounded-full border-2 border-cu-bg overflow-hidden bg-cu-bg shadow-sm ring-1 ring-cu-border">
            <Image
              src={resolvedProfilePicUrl}
              alt="Profile"
              width={32}
              height={32}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-cu-bg flex items-center justify-center text-white text-[11px] font-bold shadow-sm ring-1 ring-cu-border">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </div>
  );
}

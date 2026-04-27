'use client';

import Image from 'next/image';
import type { User } from '@/lib/auth';
import WelcomeGreeting from '@/components/ui/WelcomeGreeting';
import { NotificationBell } from '@/navBar/topbar/NotificationBell';

// Props for the header (current user data and profile picture URL)
interface DashboardHeaderProps {
  user: User | null;
  resolvedProfilePicUrl: string;
}

export default function DashboardHeader({ user, resolvedProfilePicUrl }: DashboardHeaderProps) {
  return (
    // Sticky header container with glassmorphism effect
    <div className="sticky top-0 z-30 w-full flex items-center justify-between gap-3 py-3 px-1 bg-white/95 backdrop-blur-md rounded-b-[10px] shadow-sm mb-1 before:absolute before:-top-4 before:h-4 before:w-full before:bg-white/95 before:z-30">
      
      {/* Left side: Mobile menu toggle button and Welcome message */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Toggle button for sidebar - only visible on mobile */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('planora:sidebar:toggle'))}
          className="md:hidden p-2 -ml-2 text-[#4B5563] rounded-xl hover:bg-gray-100 transition-colors shrink-0 active:bg-gray-200"
          aria-label="Toggle Sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Mobile-only logo display */}
        <div className="md:hidden font-outfit text-[22px] font-extrabold tracking-tight text-[#101828] ml-1.5 flex items-center gap-2">
          <span className="w-2.5 h-6 bg-blue-600 rounded-full" />
          PLANORA
        </div>

        {/* Desktop-only greeting message */}
        <div className="hidden md:block truncate">
          <WelcomeGreeting username={user?.username || 'User'} />
        </div>
      </div>

      {/* Right side: Notification bell and User profile picture */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Real-time notification bell component */}
        <NotificationBell />

        {/* Display profile image if available, otherwise show initials */}
        {resolvedProfilePicUrl ? (
          <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white shadow-sm ring-1 ring-slate-200">
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
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 border-2 border-white flex items-center justify-center text-white text-[11px] font-bold shadow-sm ring-1 ring-slate-200">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>
    </div>
  );
}


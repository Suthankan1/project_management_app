'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Sun, Moon } from 'lucide-react';
import { LogoutIcon } from './SidebarIcons';
import { useTheme } from '@/components/providers/ThemeProvider';

export function SidebarFooter({
  collapsed,
  user,
  resolvedProfilePicUrl,
  onLogout,
  onLinkClick,
}: {
  collapsed: boolean;
  user: { username?: string; email?: string } | null;
  resolvedProfilePicUrl: string;
  onLogout: () => void;
  onLinkClick: () => void;
}) {
  const { theme, toggleTheme } = useTheme();
  return (
    <div className="px-2 pb-3 flex-shrink-0 border-t border-cu-sidebar-border pt-2">
      <div className="flex items-center gap-2 min-w-0">
        <Link
          href="/profile"
          onClick={onLinkClick}
          className="flex items-center gap-2 min-w-0 flex-1 rounded-lg px-2 py-1.5 hover:bg-cu-sidebar-hover transition-colors"
        >
          <div className="w-8 h-8 rounded-full bg-cu-sidebar-hover flex items-center justify-center text-cu-sidebar-text-bright font-semibold text-sm overflow-hidden border border-cu-sidebar-border flex-shrink-0">
            {resolvedProfilePicUrl ? (
              <Image src={resolvedProfilePicUrl} alt="Profile" width={32} height={32} className="w-full h-full object-cover" unoptimized />
            ) : (
              <span>{user?.username?.charAt(0).toUpperCase() || 'U'}</span>
            )}
          </div>
          <div
            className="flex flex-col overflow-hidden"
            style={{
              maxWidth: collapsed ? '0px' : '130px',
              opacity: collapsed ? 0 : 1,
              transition: 'max-width 280ms cubic-bezier(0.4,0,0.2,1), opacity 180ms',
            }}
          >
            <span className="text-[13px] font-medium text-cu-sidebar-text-bright truncate">{user?.username || 'Guest'}</span>
            <span className="text-[11px] text-cu-sidebar-text truncate">{user?.email || ''}</span>
          </div>
        </Link>
        {!collapsed && (
          <>
            <button
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="text-cu-sidebar-text hover:text-cu-sidebar-text-bright transition-colors p-1.5 rounded-md hover:bg-cu-sidebar-hover flex-shrink-0"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={onLogout} title="Logout" className="text-cu-sidebar-text hover:text-cu-danger transition-colors p-1.5 rounded-md hover:bg-red-50 flex-shrink-0">
              <LogoutIcon />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

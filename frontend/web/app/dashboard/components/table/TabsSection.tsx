'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardTable from './index';

export default function TabsSection() {
  const [activeTab, setActiveTab] = useState('assigned-to-me');
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [hoveredTab, setHoveredTab] = useState<string | null>(null);
  const [assignedCount, setAssignedCount] = useState(0);
  const [mobileSecondaryTab, setMobileSecondaryTab] = useState('worked-on');
  const [mobileTertiaryTab, setMobileTertiaryTab] = useState('favorites');

  return (
    <>
      {/* ── Desktop View ─────────────────────────────────────────────────────── */}
      <div className="hidden md:flex flex-col gap-4 md:gap-6 mt-2 md:mt-0">
        {/* Tab bar */}
        <div className="flex flex-col md:flex-row md:justify-between items-start md:items-end border-b border-cu-border pb-0 gap-4 md:gap-0">
          <Link
            href="/createProject"
            className="order-last w-auto bg-transparent text-cu-primary font-arimo text-[14px] font-semibold hover:underline mb-2 shrink-0 flex items-center justify-center p-0 rounded-none shadow-none transition-all"
          >
            + Create new project
          </Link>

          <div className="flex flex-nowrap items-center gap-1 w-auto overflow-x-auto no-scrollbar pb-0 h-[44px]">
            {['Worked on', 'Viewed', 'Assigned to me', 'Favorites', 'Boards'].map((tab) => {
              const tabId = tab.toLowerCase().replaceAll(' ', '-');
              const isActive = activeTab === tabId;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tabId)}
                  onMouseEnter={() => setHoveredTab(tabId)}
                  onMouseLeave={() => setHoveredTab(null)}
                  className="relative h-full flex items-center px-5 shrink-0 group transition-all duration-300"
                >
                  {isActive && (
                    <motion.div
                      layoutId="dashboardTabPill"
                      className="absolute inset-x-1 inset-y-1.5 bg-cu-bg rounded-xl border border-cu-primary/30 shadow-[0_4px_20px_rgba(37,99,235,0.15)] z-0"
                      transition={{ type: 'spring', stiffness: 410, damping: 24, mass: 0.8 }}
                    />
                  )}

                  <AnimatePresence>
                    {hoveredTab === tabId && !isActive && (
                      <motion.div
                        layoutId="dashboardHoverBackground"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="absolute inset-x-1.5 inset-y-2.5 bg-cu-hover/60 rounded-lg -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                      />
                    )}
                  </AnimatePresence>

                  <span
                    className={`whitespace-nowrap relative z-10 transition-all duration-300 font-outfit text-[14px] font-bold ${
                      isActive
                        ? 'text-cu-primary scale-[1.02]'
                        : 'text-cu-text-secondary group-hover:text-cu-text-primary'
                    }`}
                  >
                    {tab}
                    {tab === 'Assigned to me' && (
                      <span
                        className={`ml-2 text-[12px] px-1.5 rounded font-medium inline-block align-middle transition-colors ${
                          isActive ? 'bg-cu-primary/15 text-cu-primary' : 'bg-cu-bg-tertiary text-cu-text-secondary'
                        }`}
                      >
                        {assignedCount}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search */}
        <div className="relative w-[320px] shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--cu-text-muted)" strokeWidth="1.5">
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11L14 14" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search items..."
            value={dashboardSearch}
            onChange={(e) => setDashboardSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 h-[38px] border border-cu-border rounded-[6px] leading-5 bg-cu-bg placeholder-cu-text-muted text-cu-text-primary focus:outline-none focus:ring-1 focus:ring-cu-primary/30 focus:border-cu-primary sm:text-sm font-arimo shadow-cu-sm"
          />
        </div>

        <DashboardTable
          activeTab={activeTab}
          searchQuery={dashboardSearch}
          setDashboardAssignedCount={setAssignedCount}
        />
      </div>

      {/* ── Mobile View ──────────────────────────────────────────────────────── */}
      <div className="md:hidden flex flex-col gap-6 mt-4">
        <Link
          href="/createProject"
          className="w-full bg-cu-primary text-white font-outfit text-[14px] font-bold flex items-center justify-center py-2.5 rounded-xl shadow-cu-md transition-all active:scale-[0.98]"
        >
          + Create new project
        </Link>

        {/* Section 1: Assigned to Me */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-1 px-1">
            <h2 className="font-outfit text-[16px] font-bold text-cu-text-primary">Assigned to me</h2>
            <span className="bg-cu-primary/10 text-cu-primary text-[11px] px-2.5 py-0.5 rounded-full font-bold font-outfit uppercase tracking-wider">
              {assignedCount} pending
            </span>
          </div>
          <DashboardTable
            activeTab="assigned-to-me"
            searchQuery=""
            setDashboardAssignedCount={setAssignedCount}
          />
        </div>

        {/* Section 2: Recent Activity */}
        <div className="flex flex-col gap-4 pt-4 border-t border-cu-border">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-outfit text-[15px] font-bold text-cu-text-primary">Recent Activity</h2>
          </div>
          <div className="flex items-center justify-center bg-cu-hover/50 p-1 rounded-xl gap-1">
            {(['worked-on', 'viewed'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMobileSecondaryTab(t)}
                className={`flex-1 py-2 rounded-lg font-outfit text-[11px] font-bold uppercase tracking-wider transition-all ${
                  mobileSecondaryTab === t
                    ? 'bg-cu-bg text-cu-primary shadow-sm ring-1 ring-cu-border'
                    : 'text-cu-text-secondary hover:text-cu-text-primary'
                }`}
              >
                {t === 'worked-on' ? 'Worked on' : 'Viewed'}
              </button>
            ))}
          </div>
          <DashboardTable activeTab={mobileSecondaryTab} searchQuery={dashboardSearch} />
        </div>

        {/* Section 3: Quick Access */}
        <div className="flex flex-col gap-4 pt-6 border-t border-cu-border">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-outfit text-[15px] font-bold text-cu-text-primary">Quick Access</h2>
          </div>
          <div className="flex items-center justify-center bg-cu-hover/50 p-1 rounded-xl gap-1">
            {(['favorites', 'boards'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setMobileTertiaryTab(t)}
                className={`flex-1 py-2 rounded-lg font-outfit text-[11px] font-bold uppercase tracking-wider transition-all ${
                  mobileTertiaryTab === t
                    ? 'bg-cu-bg text-cu-primary shadow-sm ring-1 ring-cu-border'
                    : 'text-cu-text-secondary hover:text-cu-text-primary'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          <DashboardTable activeTab={mobileTertiaryTab} searchQuery="" />
        </div>
      </div>
    </>
  );
}

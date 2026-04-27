'use client';

import React from 'react';
import { DashboardItem } from './types';

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  TODO: 'bg-gray-100 text-gray-700 border-gray-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  IN_REVIEW: 'bg-purple-50 text-purple-700 border-purple-200',
  DONE: 'bg-green-50 text-green-700 border-green-200',
};

const STATUS_DOT_COLORS: Record<string, string> = {
  TODO: 'bg-gray-400',
  IN_PROGRESS: 'bg-blue-500',
  IN_REVIEW: 'bg-purple-500',
  DONE: 'bg-green-500',
};

const STATUS_LABELS: Record<string, string> = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN PROGRESS',
  IN_REVIEW: 'IN REVIEW',
  DONE: 'DONE',
};

export function StatusBadge({ status }: { status: string }) {
  const colorClass = STATUS_COLORS[status] ?? STATUS_COLORS.TODO;
  const dotClass = STATUS_DOT_COLORS[status] ?? 'bg-gray-400';
  const label = STATUS_LABELS[status] ?? status;

  return (
    <div className={`w-[120px] px-3 py-1 flex items-center gap-2 text-[11px] font-bold tracking-wider rounded-md border ${colorClass}`}>
      <span className="flex items-center gap-1.5 whitespace-nowrap">
        <span className={`w-1.5 h-1.5 shrink-0 rounded-full ${dotClass}`} />
        {label}
      </span>
    </div>
  );
}

// ─── Item Icon ────────────────────────────────────────────────────────────────

export function ItemIcon({ item }: { item: DashboardItem }) {
  if (item.type === 'TASK') {
    return (
      <div className="w-[34px] h-[34px] shrink-0 flex items-center justify-center bg-blue-50/80 text-blue-600 rounded-lg border border-blue-100 shadow-sm transition-all duration-300 group-hover:bg-blue-100 group-hover:scale-105 group-hover:shadow-[0_4px_12px_rgba(37,99,235,0.15)] relative overflow-hidden">
        <svg className="relative z-10 w-[18px] h-[18px] transition-transform duration-300 group-hover:scale-[1.15]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" className="opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
          <path d="M9 12l2 2 4-4" className="stroke-current" />
        </svg>
      </div>
    );
  }

  if (item.type === 'PROJECT_KANBAN') {
    return (
      <div className="w-[34px] h-[34px] shrink-0 flex items-center justify-center bg-emerald-50/80 text-emerald-600 rounded-lg border border-emerald-100 shadow-sm transition-all duration-300 group-hover:bg-emerald-100 group-hover:scale-105 group-hover:shadow-[0_4px_12px_rgba(16,185,129,0.15)] relative overflow-hidden">
        <svg className="relative z-10 w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" className="opacity-30" />
          <path d="M8 7v9" strokeWidth="3" className="transition-all duration-500 ease-out group-hover:-translate-y-1" />
          <path d="M16 7v6" strokeWidth="3" className="transition-all duration-500 ease-out delay-75 group-hover:translate-y-2" />
        </svg>
      </div>
    );
  }

  if (item.type === 'PROJECT_AGILE') {
    return (
      <div className="w-[34px] h-[34px] shrink-0 flex items-center justify-center bg-indigo-50/80 text-indigo-600 rounded-lg border border-indigo-100 shadow-sm transition-all duration-300 group-hover:bg-indigo-100 group-hover:scale-105 group-hover:shadow-[0_4px_12px_rgba(99,102,241,0.15)] relative overflow-hidden">
        <svg className="relative z-10 w-[18px] h-[18px] transition-transform duration-700 ease-in-out group-hover:rotate-[180deg]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
        </svg>
      </div>
    );
  }

  if (item.type === 'BOARD') {
    return (
      <div className="w-[34px] h-[34px] shrink-0 flex items-center justify-center bg-amber-50/80 text-amber-500 rounded-lg border border-amber-100 shadow-sm transition-all duration-300 group-hover:bg-amber-100 group-hover:scale-105 group-hover:shadow-[0_4px_12px_rgba(245,158,11,0.15)] relative overflow-hidden">
        <svg className="relative z-10 w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" className="opacity-30" />
          <line x1="9" y1="3" x2="9" y2="21" className="opacity-30" />
          <line x1="15" y1="3" x2="15" y2="21" className="opacity-30" />
          <path d="M5 8h2" className="transition-transform duration-300 ease-out group-hover:translate-y-2" strokeWidth="3" />
          <path d="M11 10h2" className="transition-transform duration-300 ease-out group-hover:-translate-y-2 delay-75" strokeWidth="3" />
          <path d="M17 14h2" className="transition-transform duration-300 ease-out group-hover:translate-y-3 delay-150" strokeWidth="3" />
        </svg>
      </div>
    );
  }

  return <div className="w-[34px] h-[34px] shrink-0 bg-[#F0B100] border-2 border-[#F0B100] rounded-lg" />;
}

// ─── Empty State ──────────────────────────────────────────────────────────────

const EMPTY_MESSAGES: Record<string, string> = {
  'worked-on': "You haven't modified any tasks recently.",
  'viewed': "You haven't viewed any boards or tasks recently.",
  'assigned-to-me': 'You have no assigned tasks. Take a break!',
  'favorites': "You haven't favored any projects yet.",
  'boards': 'No boards found.',
};

export function EmptyState({ activeTab, searchQuery }: { activeTab: string; searchQuery: string }) {
  const message = searchQuery
    ? 'No results found for your search.'
    : (EMPTY_MESSAGES[activeTab] ?? 'Nothing to show here.');

  return (
    <div className="flex flex-col items-center justify-center text-gray-400 py-16 gap-3">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" strokeLinecap="round">
        <circle cx="12" cy="12" r="10" />
        <path d="M8 12h8" />
      </svg>
      <p className="font-arimo text-[14px] font-medium text-[#6A7282]">{message}</p>
    </div>
  );
}

import React from 'react';

/**
 * Collection of small inline SVGs used across the summary dashboard widgets.
 * Using inline SVGs to keep dependencies minimal while maintaining high performance.
 */
export const SummaryIcons = {
  progress: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0052CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  tasks: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0052CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
  completed: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00875A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
    </svg>
  ),
  due: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#DE350B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  sprint: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0052CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  ),
  burndown: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF8B00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  chart: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6554C0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" /><path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  ),
  velocity: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00875A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  clock: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0052CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  activity: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00875A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  report: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2684FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  trophy: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00875A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-1a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1a2 2 0 0 1-2 2h-2" /><rect x="6" y="18" width="12" height="4" rx="2" />
    </svg>
  ),
  milestone: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF8B00" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" />
    </svg>
  ),
  docs: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2684FF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  chat: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0052CC" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  notes: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2V8l-6-6z" /><path d="M14 3v5h5M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  team: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6554C0" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
};

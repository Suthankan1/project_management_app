'use client';

import React, { useState } from 'react';
import { AlertTriangle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import type { TaskSummary } from '@/lib/report/reportUtils';
import { PRIORITY_COLORS } from '@/lib/report/reportUtils';
import { useTheme } from '@/components/providers/ThemeProvider';

const PRIORITY_BG_LIGHT: Record<string, string> = {
  URGENT: '#FEF2F2', HIGH: '#FFF7ED', MEDIUM: '#FEFCE8',
  NORMAL: '#EFF6FF', LOW:  '#F0FDF4', UNASSIGNED: '#F9FAFB',
};
const PRIORITY_BG_DARK: Record<string, string> = {
  URGENT: 'rgba(220,38,38,0.15)', HIGH: 'rgba(249,115,22,0.15)', MEDIUM: 'rgba(234,179,8,0.15)',
  NORMAL: 'rgba(21,93,252,0.15)', LOW:  'rgba(22,163,74,0.15)',  UNASSIGNED: 'rgba(107,114,128,0.15)',
};

function PriorityBadge({ p, isDark }: { p: string; isDark: boolean }) {
  const key = p.toUpperCase();
  return (
    <span
      className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
      style={{
        background: (isDark ? PRIORITY_BG_DARK[key] : PRIORITY_BG_LIGHT[key]) ?? (isDark ? 'rgba(107,114,128,0.15)' : '#F9FAFB'),
        color:      PRIORITY_COLORS[key] ?? '#6B7280',
      }}
    >
      {p}
    </span>
  );
}

interface OverdueProps { tasks: TaskSummary[] }

export function OverdueTable({ tasks }: OverdueProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? tasks : tasks.slice(0, 5);

  if (!tasks.length) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background:     isDark ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        border:         `1px solid ${isDark ? 'rgba(220,38,38,0.3)' : '#FECACA'}`,
        boxShadow:      '0 4px 24px rgba(220,38,38,0.08)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: 'linear-gradient(135deg, #DC2626 0%, #EF4444 100%)' }}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={14} className="text-white" />
          <span className="text-[12px] font-black text-white uppercase tracking-widest">Overdue Tasks</span>
          <span className="ml-2 text-[10px] font-black bg-white/25 text-white px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <span className="text-[10px] text-white/70">Requires immediate attention</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ background: isDark ? 'rgba(220,38,38,0.12)' : '#FEF2F2', borderBottom: `1px solid ${isDark ? 'rgba(220,38,38,0.25)' : '#FECACA'}` }}>
              {['#', 'Task Title', 'Assignee', 'Due Date', 'Past Due', 'Priority'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-[9px]" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((t, i) => (
              <tr
                key={t.id}
                className="transition-colors"
                style={{ borderBottom: `1px solid ${isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2'}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(220,38,38,0.08)' : 'rgba(254,242,242,0.6)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <td className="px-4 py-2.5 font-bold" style={{ color: '#DC2626' }}>{i + 1}</td>
                <td className="px-4 py-2.5 font-semibold max-w-[240px]" style={{ color: isDark ? '#F1F5F9' : '#1F2937' }}>
                  <span className="block truncate">{t.title}</span>
                </td>
                <td className="px-4 py-2.5" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                  {t.assignee === '—'
                    ? <span className="italic" style={{ color: isDark ? '#475569' : '#9CA3AF' }}>Unassigned</span>
                    : t.assignee}
                </td>
                <td className="px-4 py-2.5" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>{t.dueDate}</td>
                <td className="px-4 py-2.5">
                  <span className="font-black" style={{ color: '#DC2626' }}>+{t.daysOverdue}d</span>
                </td>
                <td className="px-4 py-2.5">
                  <PriorityBadge p={t.priority} isDark={isDark} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tasks.length > 5 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors"
          style={{ color: '#DC2626' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(220,38,38,0.08)' : 'rgba(254,226,226,0.5)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Show less' : `Show ${tasks.length - 5} more overdue tasks`}
        </button>
      )}
    </div>
  );
}

interface UpcomingProps { tasks: TaskSummary[] }

function DaysBadge({ days }: { days: number }) {
  const color = days === 0 ? '#DC2626' : days <= 2 ? '#F97316' : '#16A34A';
  const label = days === 0 ? 'Due today' : days === 1 ? 'Tomorrow' : `${days}d left`;
  return (
    <span className="text-[9px] font-black px-2 py-0.5 rounded-full" style={{ background: `${color}18`, color }}>
      {label}
    </span>
  );
}

export function UpcomingTable({ tasks }: UpcomingProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? tasks : tasks.slice(0, 5);

  if (!tasks.length) return null;

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background:     isDark ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(20px)',
        border:         `1px solid ${isDark ? 'rgba(245,158,11,0.3)' : '#FED7AA'}`,
        boxShadow:      '0 4px 24px rgba(249,115,22,0.07)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #F97316 100%)' }}
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-white" />
          <span className="text-[12px] font-black text-white uppercase tracking-widest">Due This Week</span>
          <span className="ml-2 text-[10px] font-black bg-white/25 text-white px-2 py-0.5 rounded-full">{tasks.length}</span>
        </div>
        <span className="text-[10px] text-white/70">Next 7 days</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ background: isDark ? 'rgba(245,158,11,0.12)' : '#FFFBEB', borderBottom: `1px solid ${isDark ? 'rgba(245,158,11,0.25)' : '#FED7AA'}` }}>
              {['#', 'Task Title', 'Assignee', 'Due Date', 'Time Left', 'Priority'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left font-bold uppercase tracking-wider text-[9px]" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visible.map((t, i) => (
              <tr
                key={t.id}
                className="transition-colors"
                style={{ borderBottom: `1px solid ${isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB'}` }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(245,158,11,0.08)' : 'rgba(255,251,235,0.6)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <td className="px-4 py-2.5 font-bold" style={{ color: '#F59E0B' }}>{i + 1}</td>
                <td className="px-4 py-2.5 font-semibold max-w-[240px]" style={{ color: isDark ? '#F1F5F9' : '#1F2937' }}>
                  <span className="block truncate">{t.title}</span>
                </td>
                <td className="px-4 py-2.5" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                  {t.assignee === '—'
                    ? <span className="italic" style={{ color: isDark ? '#475569' : '#9CA3AF' }}>Unassigned</span>
                    : t.assignee}
                </td>
                <td className="px-4 py-2.5" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>{t.dueDate}</td>
                <td className="px-4 py-2.5">
                  <DaysBadge days={t.daysUntilDue} />
                </td>
                <td className="px-4 py-2.5">
                  <PriorityBadge p={t.priority} isDark={isDark} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tasks.length > 5 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full py-2.5 flex items-center justify-center gap-1.5 text-[11px] font-semibold transition-colors"
          style={{ color: '#F59E0B' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(245,158,11,0.08)' : 'rgba(254,243,199,0.5)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
        >
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          {expanded ? 'Show less' : `Show ${tasks.length - 5} more`}
        </button>
      )}
    </div>
  );
}

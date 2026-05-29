'use client';

import React from 'react';
import { Flag, CheckCircle2, Clock, Archive } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MilestoneResponse } from '@/types';
import { useTheme } from '@/components/providers/ThemeProvider';

function getStatusConfig(status: string, dueDate?: string | null, isDark = false) {
  const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'COMPLETED';
  if (status === 'COMPLETED') {
    return {
      color:  '#16A34A',
      bg:     isDark ? 'rgba(22,163,74,0.12)'  : '#F0FDF4',
      border: isDark ? 'rgba(22,163,74,0.3)'   : '#BBF7D0',
      label:  'Completed', Icon: CheckCircle2,
    };
  }
  if (status === 'CANCELLED') {
    return {
      color:  isDark ? '#94A3B8' : '#6B7280',
      bg:     isDark ? 'rgba(107,114,128,0.12)' : '#F9FAFB',
      border: isDark ? 'rgba(107,114,128,0.3)'  : '#E5E7EB',
      label:  'Cancelled', Icon: Archive,
    };
  }
  if (status === 'IN_PROGRESS') {
    return {
      color:  '#F59E0B',
      bg:     isDark ? 'rgba(245,158,11,0.12)'  : '#FFFBEB',
      border: isDark ? 'rgba(245,158,11,0.3)'   : '#FDE68A',
      label:  'In Progress', Icon: Flag,
    };
  }
  if (isOverdue) {
    return {
      color:  '#DC2626',
      bg:     isDark ? 'rgba(220,38,38,0.12)'   : '#FEF2F2',
      border: isDark ? 'rgba(220,38,38,0.3)'    : '#FECACA',
      label:  'Overdue', Icon: Clock,
    };
  }
  return {
    color:  '#3B82F6',
    bg:     isDark ? 'rgba(59,130,246,0.12)'    : '#EFF6FF',
    border: isDark ? 'rgba(59,130,246,0.3)'     : '#BFDBFE',
    label:  'Open', Icon: Flag,
  };
}

function fmtShort(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

interface Props { milestones: MilestoneResponse[] }

export default function MilestoneSection({ milestones }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const cardStyle = {
    background:     isDark ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border:         `1px solid ${isDark ? 'rgba(39,52,73,0.8)' : 'rgba(255,255,255,0.65)'}`,
    boxShadow:      isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
  };

  if (!milestones.length) {
    return (
      <div className="rounded-2xl p-8 text-center" style={cardStyle}>
        <Flag size={24} className="mx-auto mb-2" style={{ color: isDark ? '#334155' : '#D1D5DB' }} />
        <p className="text-[12px]" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>No milestones defined for this project</p>
      </div>
    );
  }

  const ORDER = { Overdue: 0, Open: 1, 'In Progress': 2, Completed: 3, Cancelled: 4 };
  const sorted = [...milestones].sort((a, b) => {
    const la = getStatusConfig(a.status, a.dueDate, isDark).label;
    const lb = getStatusConfig(b.status, b.dueDate, isDark).label;
    return (ORDER[la as keyof typeof ORDER] ?? 99) - (ORDER[lb as keyof typeof ORDER] ?? 99);
  });

  const completed = milestones.filter(m => m.status === 'COMPLETED').length;
  const pct = milestones.length ? Math.round((completed / milestones.length) * 100) : 0;

  return (
    <div className="rounded-2xl p-5" style={cardStyle}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>Milestones</p>
          <p className="text-[10px] mt-0.5" style={{ color: isDark ? '#475569' : '#B0B8C4' }}>
            {completed}/{milestones.length} completed · {pct}%
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-28 h-2 rounded-full overflow-hidden" style={{ background: isDark ? '#1E293B' : '#F3F4F6' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pct >= 70 ? '#16A34A' : pct >= 40 ? '#F59E0B' : '#DC2626' }}
            />
          </div>
          <span className="text-[10px] font-bold" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>{pct}%</span>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {sorted.map((m, i) => {
          const cfg = getStatusConfig(m.status, m.dueDate, isDark);
          return (
            <motion.div
              key={m.id ?? i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl p-4 relative overflow-hidden"
              style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: `${cfg.color}18` }}
                >
                  <cfg.Icon size={13} style={{ color: cfg.color }} />
                </div>
                <span
                  className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider"
                  style={{ background: `${cfg.color}18`, color: cfg.color }}
                >
                  {cfg.label}
                </span>
              </div>

              <p className="text-[12px] font-bold leading-tight mb-2 line-clamp-2" style={{ color: isDark ? '#F1F5F9' : '#1F2937' }}>
                {m.name}
              </p>

              <div className="flex items-center justify-between text-[10px]" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>
                <span>
                  {m.dueDate ? (
                    <span style={{ color: cfg.label === 'Overdue' ? '#DC2626' : (isDark ? '#94A3B8' : '#6B7280') }}>
                      📅 {fmtShort(m.dueDate)}
                    </span>
                  ) : '📅 No due date'}
                </span>
                {m.taskCount !== undefined && m.taskCount > 0 && (
                  <span className="font-semibold" style={{ color: cfg.color }}>
                    {m.taskCount} task{m.taskCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

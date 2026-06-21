'use client';

import React, { useMemo, useState } from 'react';
import { Search, X, ChevronUp, ChevronDown } from 'lucide-react';
import type { TaskSummary } from '@/lib/report/reportUtils';
import { STATUS_COLORS, PRIORITY_COLORS } from '@/lib/report/reportUtils';
import { useTheme } from '@/components/providers/ThemeProvider';

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done',
};
const STATUS_BG_LIGHT:  Record<string, string> = { TODO: '#F3F4F6',  IN_PROGRESS: '#EFF6FF', IN_REVIEW: '#FFFBEB', DONE: '#F0FDF4' };
const STATUS_BG_DARK:   Record<string, string> = { TODO: 'rgba(107,114,128,0.15)', IN_PROGRESS: 'rgba(21,93,252,0.15)', IN_REVIEW: 'rgba(245,158,11,0.15)', DONE: 'rgba(22,163,74,0.15)' };
const PRIORITY_BG_LIGHT: Record<string, string> = { URGENT: '#FEF2F2', HIGH: '#FFF7ED', MEDIUM: '#FEFCE8', NORMAL: '#EFF6FF', LOW: '#F0FDF4', UNASSIGNED: '#F9FAFB' };
const PRIORITY_BG_DARK:  Record<string, string> = { URGENT: 'rgba(220,38,38,0.15)', HIGH: 'rgba(249,115,22,0.15)', MEDIUM: 'rgba(234,179,8,0.15)', NORMAL: 'rgba(21,93,252,0.15)', LOW: 'rgba(22,163,74,0.15)', UNASSIGNED: 'rgba(107,114,128,0.15)' };

function StatusBadge({ sk, isDark }: { sk: string; isDark: boolean }) {
  const key = sk.toUpperCase();
  return (
    <span
      className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap"
      style={{
        background: (isDark ? STATUS_BG_DARK[key] : STATUS_BG_LIGHT[key]) ?? (isDark ? 'rgba(107,114,128,0.15)' : '#F9FAFB'),
        color:      STATUS_COLORS[key] ?? '#6B7280',
      }}
    >
      {STATUS_LABELS[key] ?? sk}
    </span>
  );
}

function PriorityBadge({ pk, isDark }: { pk: string; isDark: boolean }) {
  const key = pk.toUpperCase();
  return (
    <span
      className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap"
      style={{
        background: (isDark ? PRIORITY_BG_DARK[key] : PRIORITY_BG_LIGHT[key]) ?? (isDark ? 'rgba(107,114,128,0.15)' : '#F9FAFB'),
        color:      PRIORITY_COLORS[key] ?? '#6B7280',
      }}
    >
      {pk}
    </span>
  );
}

export interface TaskTableFilters {
  status:   string;
  priority: string;
  assignee: string;
  sprint:   string;
}

interface Props {
  tasks:            TaskSummary[];
  externalFilters:  TaskTableFilters;
  onExternalChange: (f: Partial<TaskTableFilters>) => void;
  allAssignees:     string[];
  allSprints:       string[];
}

type SortKey = 'title' | 'status' | 'priority' | 'assignee' | 'dueDate' | 'daysUntilDue';
type SortDir = 'asc' | 'desc';

const PAGE_SIZE = 25;
const PRIORITY_WEIGHT: Record<string, number> = {
  URGENT: 0, HIGH: 1, MEDIUM: 2, NORMAL: 3, LOW: 4, UNASSIGNED: 5,
};

export default function FullTaskTable({
  tasks, externalFilters, onExternalChange, allAssignees, allSprints,
}: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [search,  setSearch]  = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('daysUntilDue');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page,    setPage]    = useState(0);

  const filtered = useMemo(() => {
    let result = tasks;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.assignee.toLowerCase().includes(q) ||
        t.sprint.toLowerCase().includes(q),
      );
    }

    if (externalFilters.status)   result = result.filter(t => t.statusKey   === externalFilters.status);
    if (externalFilters.priority) result = result.filter(t => t.priorityKey === externalFilters.priority);
    if (externalFilters.assignee) result = result.filter(t => t.assignee    === externalFilters.assignee);
    if (externalFilters.sprint)   result = result.filter(t => t.sprint      === externalFilters.sprint);

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'title':    cmp = a.title.localeCompare(b.title); break;
        case 'status':   cmp = a.statusKey.localeCompare(b.statusKey); break;
        case 'priority': cmp = (PRIORITY_WEIGHT[a.priorityKey] ?? 5) - (PRIORITY_WEIGHT[b.priorityKey] ?? 5); break;
        case 'assignee': cmp = a.assignee.localeCompare(b.assignee); break;
        case 'dueDate':
        case 'daysUntilDue':
          if (!a.rawDueDate && !b.rawDueDate) cmp = 0;
          else if (!a.rawDueDate) cmp = 1;
          else if (!b.rawDueDate) cmp = -1;
          else cmp = a.daysUntilDue - b.daysUntilDue;
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [tasks, search, externalFilters, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems  = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  }

  function SortIcon({ k }: { k: SortKey }) {
    if (sortKey !== k) return <ChevronUp size={10} style={{ color: isDark ? '#334155' : '#D1D5DB' }} />;
    return sortDir === 'asc'
      ? <ChevronUp   size={10} className="text-[#155DFC]" />
      : <ChevronDown size={10} className="text-[#155DFC]" />;
  }

  const hasFilters = search || externalFilters.status || externalFilters.priority
    || externalFilters.assignee || externalFilters.sprint;

  function clearAll() {
    setSearch('');
    onExternalChange({ status: '', priority: '', assignee: '', sprint: '' });
    setPage(0);
  }

  const inputStyle = {
    background:  isDark ? '#0F1724' : '#FAFAFA',
    border:      `1px solid ${isDark ? '#273449' : '#E5E7EB'}`,
    color:       isDark ? '#F1F5F9' : '#374151',
  };

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background:     isDark ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border:         `1px solid ${isDark ? 'rgba(39,52,73,0.8)' : 'rgba(255,255,255,0.65)'}`,
        boxShadow:      isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      {/* Header + controls */}
      <div className="px-5 pt-5 pb-3" style={{ borderBottom: `1px solid ${isDark ? '#1E293B' : '#F3F4F6'}` }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>
              All Tasks
            </p>
            <p className="text-[10px]" style={{ color: isDark ? '#475569' : '#B0B8C4' }}>
              Showing {filtered.length} of {tasks.length} tasks
            </p>
          </div>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors"
              style={{ color: '#DC2626' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(220,38,38,0.1)' : '#FEF2F2'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <X size={11} /> Clear all filters
            </button>
          )}
        </div>

        {/* Search + filter row */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: isDark ? '#475569' : '#9CA3AF' }} />
            <input
              type="text"
              placeholder="Search tasks, assignee, sprint…"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-8 pr-3 h-8 rounded-xl text-[11px] outline-none transition-all"
              style={inputStyle}
            />
          </div>

          {[
            { value: externalFilters.status,   onChange: (v: string) => onExternalChange({ status: v }),   placeholder: 'All Status',   options: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].map(s => ({ val: s, label: STATUS_LABELS[s] })) },
            { value: externalFilters.priority, onChange: (v: string) => onExternalChange({ priority: v }), placeholder: 'All Priority', options: ['URGENT', 'HIGH', 'MEDIUM', 'NORMAL', 'LOW'].map(p => ({ val: p, label: p.charAt(0) + p.slice(1).toLowerCase() })) },
          ].map((sel, idx) => (
            <select
              key={idx}
              value={sel.value}
              onChange={e => { sel.onChange(e.target.value); setPage(0); }}
              className="h-8 px-3 rounded-xl text-[11px] outline-none cursor-pointer"
              style={inputStyle}
            >
              <option value="">{sel.placeholder}</option>
              {sel.options.map(o => <option key={o.val} value={o.val}>{o.label}</option>)}
            </select>
          ))}

          {allAssignees.length > 0 && (
            <select
              value={externalFilters.assignee}
              onChange={e => { onExternalChange({ assignee: e.target.value }); setPage(0); }}
              className="h-8 px-3 rounded-xl text-[11px] outline-none cursor-pointer"
              style={inputStyle}
            >
              <option value="">All Members</option>
              {allAssignees.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          )}

          {allSprints.length > 0 && (
            <select
              value={externalFilters.sprint}
              onChange={e => { onExternalChange({ sprint: e.target.value }); setPage(0); }}
              className="h-8 px-3 rounded-xl text-[11px] outline-none cursor-pointer"
              style={inputStyle}
            >
              <option value="">All Sprints</option>
              {allSprints.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {pageItems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-[13px] font-semibold" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>No tasks match your filters</p>
            <button onClick={clearAll} className="mt-2 text-[11px] text-[#155DFC] hover:underline">
              Clear all filters
            </button>
          </div>
        ) : (
          <table className="w-full text-[11px]">
            <thead>
              <tr style={{ background: isDark ? '#0F1724' : '#F8FAFF', borderBottom: `1px solid ${isDark ? '#1C2638' : '#EEF2FF'}` }}>
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[9px] w-8" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>#</th>
                {([['title', 'Title'], ['status', 'Status'], ['priority', 'Priority'], ['assignee', 'Assignee'], ['dueDate', 'Due Date']] as [SortKey, string][]).map(([key, label]) => (
                  <th
                    key={key}
                    className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[9px] cursor-pointer hover:text-[#155DFC] transition-colors select-none"
                    style={{ color: isDark ? '#64748B' : '#9CA3AF' }}
                    onClick={() => toggleSort(key)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <SortIcon k={key} />
                    </div>
                  </th>
                ))}
                <th className="px-4 py-3 text-left font-bold uppercase tracking-wider text-[9px]" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>Sprint</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t, i) => {
                const rowBg = t.isOverdue
                  ? (isDark ? 'rgba(220,38,38,0.08)' : '#FFF5F5')
                  : t.isUpcoming && t.daysUntilDue <= 2
                    ? (isDark ? 'rgba(245,158,11,0.08)' : '#FFFBEB')
                    : i % 2 === 0
                      ? (isDark ? '#111827' : '#FFFFFF')
                      : (isDark ? '#0F1724' : '#FAFBFF');
                return (
                  <tr
                    key={t.id}
                    className="transition-colors"
                    style={{ background: rowBg, borderBottom: `1px solid ${isDark ? '#1C2638' : '#F3F4F6'}` }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(21,93,252,0.08)' : 'rgba(235,242,255,0.3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = rowBg; }}
                  >
                    <td className="px-4 py-2.5" style={{ color: isDark ? '#475569' : '#9CA3AF' }}>{page * PAGE_SIZE + i + 1}</td>
                    <td className="px-4 py-2.5 font-semibold max-w-[240px]" style={{ color: isDark ? '#F1F5F9' : '#1F2937' }}>
                      <span className="block truncate" title={t.title}>
                        {t.isOverdue && <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5 mb-0.5" />}
                        {t.title}
                      </span>
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge sk={t.statusKey} isDark={isDark} /></td>
                    <td className="px-4 py-2.5"><PriorityBadge pk={t.priorityKey} isDark={isDark} /></td>
                    <td className="px-4 py-2.5" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                      {t.assignee === '—'
                        ? <span className="italic" style={{ color: isDark ? '#475569' : '#9CA3AF' }}>Unassigned</span>
                        : t.assignee}
                    </td>
                    <td className="px-4 py-2.5">
                      {t.dueDate === '—' ? (
                        <span style={{ color: isDark ? '#334155' : '#C4C9D4' }}>—</span>
                      ) : (
                        <span style={{ color: t.isOverdue ? '#DC2626' : (isDark ? '#94A3B8' : '#6B7280'), fontWeight: t.isOverdue ? 700 : 400 }}>
                          {t.dueDate}
                          {t.isOverdue && <span className="ml-1 text-[9px]">(+{t.daysOverdue}d)</span>}
                          {t.isUpcoming && !t.isOverdue && (
                            <span className="ml-1 text-[9px] text-[#F59E0B]">({t.daysUntilDue}d)</span>
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>
                      {t.sprint === '—' ? <span style={{ color: isDark ? '#334155' : '#C4C9D4' }}>—</span> : t.sprint}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3" style={{ borderTop: `1px solid ${isDark ? '#1E293B' : '#F3F4F6'}` }}>
          <span className="text-[10px]" style={{ color: isDark ? '#475569' : '#9CA3AF' }}>
            Page {page + 1} of {totalPages} · {filtered.length} results
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ border: `1px solid ${isDark ? '#273449' : '#E5E7EB'}`, color: isDark ? '#94A3B8' : '#6B7280' }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(21,93,252,0.15)' : '#EBF2FF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <ChevronUp size={12} className="rotate-[-90deg]" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, p2) => {
              const pg = totalPages <= 5 ? p2 : Math.max(0, Math.min(page - 2, totalPages - 5)) + p2;
              return (
                <button
                  key={pg}
                  onClick={() => setPage(pg)}
                  className="w-7 h-7 rounded-lg text-[11px] font-semibold transition-colors"
                  style={{
                    background: pg === page ? '#155DFC' : 'transparent',
                    color:      pg === page ? '#fff'    : (isDark ? '#94A3B8' : '#6B7280'),
                    border:     `1px solid ${pg === page ? '#155DFC' : (isDark ? '#273449' : '#E5E7EB')}`,
                  }}
                >
                  {pg + 1}
                </button>
              );
            })}
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30"
              style={{ border: `1px solid ${isDark ? '#273449' : '#E5E7EB'}`, color: isDark ? '#94A3B8' : '#6B7280' }}
              onMouseEnter={e => { if (!e.currentTarget.disabled) (e.currentTarget as HTMLElement).style.background = isDark ? 'rgba(21,93,252,0.15)' : '#EBF2FF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <ChevronDown size={12} className="rotate-[-90deg]" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

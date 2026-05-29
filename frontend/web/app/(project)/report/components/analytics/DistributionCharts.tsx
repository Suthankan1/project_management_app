'use client';

import React from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { ReportData } from '@/lib/report/reportUtils';
import { STATUS_COLORS, PRIORITY_COLORS } from '@/lib/report/reportUtils';
import { useTheme } from '@/components/providers/ThemeProvider';

const STATUS_LABELS: Record<string, string> = {
  TODO: 'To Do', IN_PROGRESS: 'In Progress', IN_REVIEW: 'In Review', DONE: 'Done',
};
const PRIORITY_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'NORMAL', 'LOW', 'UNASSIGNED'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltip({ active, payload, isDark }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs font-semibold shadow-lg"
      style={{
        background: isDark ? 'rgba(17,24,39,0.97)' : 'rgba(255,255,255,0.95)',
        border:     `2px solid ${d.color}`,
        color:      isDark ? '#F1F5F9' : '#1F2937',
      }}
    >
      {d.label}: <span style={{ color: d.color }}>{d.value}</span> tasks ({d.pct}%)
    </div>
  );
}

function ChartCard({ title, sub, children, isDark }: { title: string; sub?: string; children: React.ReactNode; isDark: boolean }) {
  return (
    <div
      className="flex-1 min-w-[280px] rounded-2xl p-5"
      style={{
        background:     isDark ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border:         `1px solid ${isDark ? 'rgba(39,52,73,0.8)' : 'rgba(255,255,255,0.65)'}`,
        boxShadow:      isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>{title}</p>
        {sub && <span className="text-[10px]" style={{ color: isDark ? '#475569' : '#B0B8C4' }}>{sub}</span>}
      </div>
      {children}
    </div>
  );
}

interface StatusChartProps {
  data: ReportData;
  activeStatus: string;
  onFilter: (key: string) => void;
}

export function StatusChart({ data, activeStatus, onFilter }: StatusChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const chartData = data.statusDist.map(d => ({
    key:   d.name,
    label: STATUS_LABELS[d.name] ?? d.name,
    value: d.count,
    pct:   d.pct,
    color: STATUS_COLORS[d.name] ?? '#9CA3AF',
  }));

  const total = data.tasks.length;

  return (
    <ChartCard title="Status Distribution" sub={`${total} tasks`} isDark={isDark}>
      <div className="flex items-center gap-4">
        <div style={{ width: 140, height: 140, flexShrink: 0 }}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%" cy="50%"
                innerRadius={42} outerRadius={64}
                paddingAngle={3}
                dataKey="value"
                onClick={d => { const k = String(d.key ?? ''); onFilter(activeStatus === k ? '' : k); }}
                style={{ cursor: 'pointer' }}
              >
                {chartData.map(entry => (
                  <Cell
                    key={entry.key}
                    fill={entry.color}
                    opacity={!activeStatus || activeStatus === entry.key ? 1 : 0.3}
                    stroke={activeStatus === entry.key ? (isDark ? '#F1F5F9' : '#1A1A2E') : 'none'}
                    strokeWidth={activeStatus === entry.key ? 2 : 0}
                  />
                ))}
              </Pie>
              <Tooltip content={<PieTooltip isDark={isDark} />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          {chartData.map(d => (
            <button
              key={d.key}
              onClick={() => onFilter(activeStatus === d.key ? '' : d.key)}
              className="flex items-center gap-2 text-left rounded-lg px-2 py-1 transition-colors w-full"
              style={{
                opacity:    !activeStatus || activeStatus === d.key ? 1 : 0.45,
                background: 'transparent',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? '#182235' : '#F8FAFF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: d.color }} />
              <span className="text-[11px] font-semibold flex-1" style={{ color: isDark ? '#CBD5E1' : '#374151' }}>{d.label}</span>
              <span className="text-[11px] font-black" style={{ color: d.color }}>{d.value}</span>
              <span className="text-[10px] w-8 text-right" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>{d.pct}%</span>
            </button>
          ))}
          {activeStatus && (
            <button
              onClick={() => onFilter('')}
              className="text-[10px] font-semibold hover:underline text-left px-2"
              style={{ color: '#155DFC' }}
            >
              × Clear filter
            </button>
          )}
        </div>
      </div>
    </ChartCard>
  );
}

interface PriorityChartProps {
  data: ReportData;
  activePriority: string;
  onFilter: (key: string) => void;
}

export function PriorityChart({ data, activePriority, onFilter }: PriorityChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const sorted = [...data.priorityDist].sort(
    (a, b) => PRIORITY_ORDER.indexOf(a.name) - PRIORITY_ORDER.indexOf(b.name),
  );

  const chartData = sorted.map(d => ({
    key:   d.name,
    name:  d.name.charAt(0) + d.name.slice(1).toLowerCase(),
    value: d.count,
    pct:   d.pct,
    color: PRIORITY_COLORS[d.name] ?? '#6B7280',
  }));

  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  return (
    <ChartCard title="Priority Breakdown" sub={`${data.tasks.length} tasks`} isDark={isDark}>
      {chartData.length === 0 ? (
        <p className="text-[11px] text-center py-8" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>No data</p>
      ) : (
        <div className="flex flex-col gap-2">
          {chartData.map(d => (
            <button
              key={d.key}
              onClick={() => onFilter(activePriority === d.key ? '' : d.key)}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors w-full text-left"
              style={{
                opacity:    !activePriority || activePriority === d.key ? 1 : 0.35,
                background: 'transparent',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? '#182235' : '#F8FAFF'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span className="text-[11px] font-semibold w-16 shrink-0" style={{ color: isDark ? '#CBD5E1' : '#374151' }}>
                {d.name}
              </span>
              <div className="flex-1 h-5 rounded-full overflow-hidden" style={{ background: isDark ? '#1E293B' : '#F3F4F6' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width:      `${(d.value / maxVal) * 100}%`,
                    background: d.color,
                    opacity:    !activePriority || activePriority === d.key ? 1 : 0.4,
                  }}
                />
              </div>
              <span className="text-[11px] font-black w-6 text-right" style={{ color: d.color }}>{d.value}</span>
              <span className="text-[10px] w-8 text-right" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>{d.pct}%</span>
            </button>
          ))}
          {activePriority && (
            <button
              onClick={() => onFilter('')}
              className="text-[10px] font-semibold hover:underline text-left px-2"
              style={{ color: '#155DFC' }}
            >
              × Clear filter
            </button>
          )}
        </div>
      )}
    </ChartCard>
  );
}

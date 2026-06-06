'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, ReferenceLine,
} from 'recharts';
import type { ReportData, SprintStat } from '@/lib/report/reportUtils';
import { useTheme } from '@/components/providers/ThemeProvider';

function getSprintColor(status: string): string {
  switch (status) {
    case 'Active':    return '#155DFC';
    case 'Completed': return '#16A34A';
    default:          return '#9CA3AF';
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SprintTooltip({ active, payload, isDark }: any) {
  if (!active || !payload?.length) return null;
  const d: SprintStat = payload[0].payload._raw;
  return (
    <div
      className="rounded-xl p-3 shadow-xl text-xs"
      style={{
        background: isDark ? 'rgba(17,24,39,0.97)' : 'rgba(255,255,255,0.97)',
        border:     `1px solid ${isDark ? '#273449' : '#E5E7EB'}`,
        minWidth:   160,
      }}
    >
      <p className="font-bold mb-2" style={{ color: isDark ? '#F1F5F9' : '#1F2937' }}>{d.name}</p>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between gap-4">
          <span style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>Status</span>
          <span className="font-bold" style={{ color: getSprintColor(d.status) }}>{d.status}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>Tasks</span>
          <span className="font-bold" style={{ color: isDark ? '#F1F5F9' : '#1F2937' }}>{d.completedTasks}/{d.totalTasks}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>Velocity</span>
          <span className="font-bold text-[#7C3AED]">{d.completedPoints} pts</span>
        </div>
        <div className="flex justify-between gap-4">
          <span style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>Completion</span>
          <span className="font-bold" style={{ color: getSprintColor(d.status) }}>{d.completionRate}%</span>
        </div>
      </div>
    </div>
  );
}

interface Props { data: ReportData }

export default function SprintChart({ data }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { sprintStats, avgVelocity } = data;

  const cardStyle = {
    background:     isDark ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border:         `1px solid ${isDark ? 'rgba(39,52,73,0.8)' : 'rgba(255,255,255,0.65)'}`,
    boxShadow:      isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
  };

  if (!sprintStats.length) {
    return (
      <div
        className="rounded-2xl p-5 flex items-center justify-center"
        style={{ ...cardStyle, minHeight: 200 }}
      >
        <p className="text-[12px]" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>No sprint data available</p>
      </div>
    );
  }

  const chartData = sprintStats.map(s => ({
    name:           s.name.replace(/sprint\s*/i, 'S').trim(),
    completionRate: s.completionRate,
    velocity:       s.completedPoints,
    color:          getSprintColor(s.status),
    _raw:           s,
  }));

  const gridColor   = isDark ? '#273449' : '#F3F4F6';
  const axisColor   = isDark ? '#475569' : '#9CA3AF';
  const legendColor = isDark ? '#94A3B8' : '#6B7280';

  return (
    <div className="rounded-2xl p-5" style={cardStyle}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>
          Sprint Completion Rates
        </p>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(21,93,252,0.2)' : '#EBF2FF', color: '#155DFC' }}>
          Avg velocity: {avgVelocity} pts
        </span>
      </div>
      <p className="text-[10px] mb-4" style={{ color: isDark ? '#475569' : '#B0B8C4' }}>
        {sprintStats.length} sprint{sprintStats.length > 1 ? 's' : ''} · click bar for details
      </p>

      <ResponsiveContainer width="100%" height={180} minWidth={0}>
        <BarChart data={chartData} margin={{ top: 10, right: 8, left: -12, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: axisColor }} axisLine={false} tickLine={false} />
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 9, fill: axisColor }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip content={<SprintTooltip isDark={isDark} />} cursor={{ fill: isDark ? 'rgba(21,93,252,0.08)' : 'rgba(21,93,252,0.04)' }} />
          <ReferenceLine y={70} stroke="#16A34A" strokeDasharray="4 3" strokeWidth={1} />
          <Bar dataKey="completionRate" radius={[4, 4, 0, 0]} maxBarSize={28}>
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {[
          { color: '#16A34A', label: 'Completed' },
          { color: '#155DFC', label: 'Active' },
          { color: '#9CA3AF', label: 'Planned' },
        ].map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            <span className="text-[10px]" style={{ color: legendColor }}>{l.label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-0 border-t border-dashed border-[#16A34A]" />
          <span className="text-[10px]" style={{ color: legendColor }}>70% target</span>
        </div>
      </div>

      {/* Sprint detail rows */}
      <div className="mt-4 space-y-1.5">
        {sprintStats.map((s, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: getSprintColor(s.status) }} />
            <span className="text-[11px] font-semibold flex-1 truncate" style={{ color: isDark ? '#CBD5E1' : '#374151' }}>{s.name}</span>
            <span className="text-[10px]" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>{s.completedTasks}/{s.totalTasks} tasks</span>
            <span
              className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: `${getSprintColor(s.status)}18`,
                color:      getSprintColor(s.status),
              }}
            >
              {s.completionRate}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

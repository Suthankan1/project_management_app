'use client';

import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';
import type { ReportData } from '@/lib/report/reportUtils';
import { useTheme } from '@/components/providers/ThemeProvider';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, isDark }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-xl p-3 shadow-xl text-xs"
      style={{
        background: isDark ? 'rgba(17,24,39,0.97)' : 'rgba(255,255,255,0.97)',
        border:     `1px solid ${isDark ? '#273449' : '#E5E7EB'}`,
        minWidth:   140,
      }}
    >
      <p className="font-bold mb-2" style={{ color: isDark ? '#F1F5F9' : '#1F2937' }}>{label}</p>
      {payload.map((p: { name: string; value: number; fill: string }, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.fill }} />
          <span style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>{p.name}:</span>
          <span className="font-bold" style={{ color: isDark ? '#F1F5F9' : '#1F2937' }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

interface Props {
  data: ReportData;
  onMemberFilter: (name: string) => void;
  activeMember: string;
}

export default function WorkloadChart({ data, onMemberFilter, activeMember }: Props) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const { memberStats } = data;

  const cardStyle = {
    background:     isDark ? 'rgba(17,24,39,0.9)' : 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border:         `1px solid ${isDark ? 'rgba(39,52,73,0.8)' : 'rgba(255,255,255,0.65)'}`,
    boxShadow:      isDark ? '0 4px 24px rgba(0,0,0,0.4)' : '0 4px 24px rgba(0,0,0,0.06)',
  };

  if (memberStats.length === 0) {
    return (
      <div className="rounded-2xl p-5 flex items-center justify-center" style={{ ...cardStyle, minHeight: 200 }}>
        <p className="text-[12px]" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>No team data available</p>
      </div>
    );
  }

  const chartData = memberStats.map(m => ({
    name:       m.name.split(' ')[0],
    fullName:   m.name,
    Assigned:   m.totalTasks,
    Completed:  m.completedTasks,
    Overdue:    m.overdueTasks,
    isIdle:     m.isIdle,
    isOverload: m.isOverloaded,
  }));

  const overloadedMembers = memberStats.filter(m => m.isOverloaded);
  const idleMembers       = memberStats.filter(m => m.isIdle);

  const gridColor  = isDark ? '#273449' : '#F3F4F6';
  const axisColor  = isDark ? '#475569' : '#6B7280';
  const axisColor2 = isDark ? '#475569' : '#9CA3AF';
  const rowBorder  = isDark ? '#1C2638' : '#F9FAFB';
  const hdrBorder  = isDark ? '#273449' : '#F3F4F6';

  return (
    <div className="rounded-2xl p-5" style={cardStyle}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>
          Team Workload
        </p>
        <div className="flex gap-2">
          {overloadedMembers.length > 0 && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(220,38,38,0.15)' : '#FEF2F2', color: '#DC2626' }}>
              {overloadedMembers.length} overloaded
            </span>
          )}
          {idleMembers.length > 0 && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(107,114,128,0.15)' : '#F3F4F6', color: isDark ? '#94A3B8' : '#6B7280' }}>
              {idleMembers.length} idle
            </span>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={Math.max(200, memberStats.length * 40)} minWidth={0}>
        <BarChart
          data={chartData}
          margin={{ top: 5, right: 16, left: -10, bottom: 5 }}
          barGap={2}
          barCategoryGap="30%"
        >
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: axisColor }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: axisColor2 }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip content={<CustomTooltip isDark={isDark} />} cursor={{ fill: isDark ? 'rgba(21,93,252,0.08)' : 'rgba(21,93,252,0.05)' }} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, color: isDark ? '#94A3B8' : '#6B7280', paddingTop: 8 }}
          />
          <Bar dataKey="Assigned"  fill="#155DFC" radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Bar dataKey="Completed" fill="#16A34A" radius={[3, 3, 0, 0]} maxBarSize={18} />
          <Bar dataKey="Overdue"   fill="#EF4444" radius={[3, 3, 0, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>

      {/* Member table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-[11px]">
          <thead>
            <tr style={{ borderBottom: `1px solid ${hdrBorder}` }}>
              {['Member', 'Role', 'Assigned', 'Completed', 'Overdue', 'Rate'].map(h => (
                <th key={h} className="pb-2 text-left font-bold uppercase tracking-wider text-[9px] pr-3" style={{ color: isDark ? '#64748B' : '#9CA3AF' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {memberStats.map((m, i) => {
              const rateColor = m.completionRate >= 80 ? '#16A34A' : m.completionRate >= 50 ? '#F59E0B' : '#EF4444';
              return (
                <tr
                  key={i}
                  onClick={() => onMemberFilter(activeMember === m.name ? '' : m.name)}
                  className="cursor-pointer transition-colors"
                  style={{
                    borderBottom: `1px solid ${rowBorder}`,
                    opacity: !activeMember || activeMember === m.name ? 1 : 0.4,
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = isDark ? '#182235' : '#F8FAFF'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                >
                  <td className="py-2 pr-3 font-semibold" style={{ color: isDark ? '#F1F5F9' : '#1F2937' }}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white shrink-0"
                        style={{ background: m.isIdle ? '#9CA3AF' : m.isOverloaded ? '#DC2626' : '#155DFC' }}
                      >
                        {m.name.charAt(0)}
                      </div>
                      {m.name}
                      {m.isIdle && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(107,114,128,0.15)' : '#F3F4F6', color: isDark ? '#94A3B8' : '#6B7280' }}>Idle</span>
                      )}
                      {m.isOverloaded && (
                        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: isDark ? 'rgba(220,38,38,0.15)' : '#FEF2F2', color: '#DC2626' }}>Busy</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 pr-3" style={{ color: isDark ? '#94A3B8' : '#6B7280' }}>{m.role}</td>
                  <td className="py-2 pr-3 font-bold" style={{ color: isDark ? '#F1F5F9' : '#1F2937' }}>{m.totalTasks}</td>
                  <td className="py-2 pr-3 font-bold" style={{ color: '#16A34A' }}>{m.completedTasks}</td>
                  <td className="py-2 pr-3 font-bold" style={{ color: m.overdueTasks > 0 ? '#DC2626' : (isDark ? '#475569' : '#9CA3AF') }}>
                    {m.overdueTasks || '—'}
                  </td>
                  <td className="py-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-black"
                      style={{ background: `${rateColor}18`, color: rateColor }}
                    >
                      {m.totalTasks > 0 ? `${m.completionRate}%` : '—'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {activeMember && (
        <button
          onClick={() => onMemberFilter('')}
          className="mt-3 text-[10px] font-semibold hover:underline"
          style={{ color: '#155DFC' }}
        >
          × Clear member filter
        </button>
      )}
    </div>
  );
}

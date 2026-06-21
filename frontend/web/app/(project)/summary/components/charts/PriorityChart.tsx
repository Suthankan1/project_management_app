'use client';

import React, { useMemo } from 'react';
import { Task } from '@/types';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { SafeChartFrame } from '@/components/shared/SafeChartFrame';

const PRIORITY_COLORS = {
  URGENT: 'var(--cu-danger)',
  HIGH: 'var(--cu-warning)',
  MEDIUM: 'var(--cu-warning)',
  NORMAL: 'var(--cu-primary)',
  LOW: 'var(--cu-success)',
  UNASSIGNED: 'var(--cu-text-muted)',
};

/**
 * Shows the distribution of tasks by their priority levels.
 */
export function PriorityChart({ tasks }: { tasks: Task[] }) {
  const data = useMemo(() => {
    const dist: Record<string, number> = { URGENT: 0, HIGH: 0, MEDIUM: 0, NORMAL: 0, LOW: 0, UNASSIGNED: 0 };
    tasks.forEach(t => {
      const p = t.priority?.toUpperCase();
      if (p && dist[p] !== undefined) dist[p]++;
      else dist['UNASSIGNED']++;
    });
    return Object.entries(dist).filter(([_, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [tasks]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 w-full relative">
        {data.length > 0 ? (
          <div className="absolute inset-0">
            {/* Center label for the donut chart */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10" style={{ transform: 'translateY(-12px)' }}>
               <h3 className="text-[18px] font-black text-cu-text-primary leading-none mb-0.5">{tasks.length}</h3>
               <p className="text-[9px] font-bold text-cu-text-muted uppercase tracking-widest">Tasks</p>
            </div>
            <SafeChartFrame>
              {({ width, height }) => (
                <PieChart width={width} height={height}>
                  <Pie data={data} cx="50%" cy="50%" innerRadius="40%" outerRadius="68%" paddingAngle={2} dataKey="value">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || 'var(--cu-text-muted)'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--cu-border)', background: 'var(--cu-bg)', color: 'var(--cu-text-primary)', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px', color: 'var(--cu-text-secondary)' }} verticalAlign="bottom" />
                </PieChart>
              )}
            </SafeChartFrame>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-cu-bg-secondary rounded-lg border border-dashed border-cu-border">
            <p className="text-[11px] text-cu-text-muted">No tasks to distribute</p>
          </div>
        )}
      </div>
    </div>
  );
}

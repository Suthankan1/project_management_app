'use client';

import React, { useMemo } from 'react';
import { Task } from '@/types';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SafeChartFrame } from '@/components/shared/SafeChartFrame';

const PRIORITY_COLORS = {
  URGENT: '#DE350B',
  HIGH: '#FF8B00',
  MEDIUM: '#FFC400',
  NORMAL: '#0052CC',
  LOW: '#00875A',
  UNASSIGNED: '#98A2B3',
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
               <h3 className="text-[18px] font-black text-[#101828] leading-none mb-0.5">{tasks.length}</h3>
               <p className="text-[9px] font-bold text-[#667085] uppercase tracking-widest">Tasks</p>
            </div>
            <SafeChartFrame>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius="40%" outerRadius="68%" paddingAngle={2} dataKey="value">
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name as keyof typeof PRIORITY_COLORS] || '#98A2B3'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E3E8EF', fontSize: '11px' }} />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </SafeChartFrame>
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-[11px] text-gray-400">No tasks to distribute</p>
          </div>
        )}
      </div>
    </div>
  );
}

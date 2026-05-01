'use client';

import React, { useMemo } from 'react';
import { Task } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SafeChartFrame } from '@/components/shared/SafeChartFrame';

/**
 * Visualizes the average time taken to complete tasks over the last 30 days.
 */
export function LeadTimeChart({ tasks }: { tasks: Task[] }) {
  const data = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const doneTasks = tasks.filter(t => t.status === 'DONE' && t.completedAt && new Date(t.completedAt) >= thirtyDaysAgo);
    const daysMap: Record<string, { totalTime: number, count: number }> = {};

    doneTasks.forEach(t => {
      if (!t.completedAt || !t.createdAt) return;
      const date = new Date(t.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeToComplete = (new Date(t.completedAt).getTime() - new Date(t.createdAt).getTime()) / (1000 * 3600 * 24);

      if (!daysMap[date]) daysMap[date] = { totalTime: 0, count: 0 };
      daysMap[date].totalTime += timeToComplete;
      daysMap[date].count += 1;
    });

    return Object.entries(daysMap)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, d]) => ({ date, avgDays: Math.round((d.totalTime / d.count) * 10) / 10 }));
  }, [tasks]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 w-full relative">
        {data.length > 0 ? (
          <SafeChartFrame>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6A7282' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: '#6A7282' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E3E8EF', fontSize: '11px' }} />
                <Line type="monotone" dataKey="avgDays" name="Avg Days" stroke="#FF8B00" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </SafeChartFrame>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-[11px] text-gray-400">Not enough data</p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useMemo } from 'react';
import { Task, Sprint } from '@/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { SafeChartFrame } from '@/components/shared/SafeChartFrame';

/**
 * Tracks the amount of work (story points) completed in the last few sprints.
 */
export function VelocityChart({ tasks, sprints }: { tasks: Task[], sprints: Sprint[] }) {
  const data = useMemo(() => {
    const completedSprints = [...sprints].filter(s => s.status === 'COMPLETED').slice(-4);
    return completedSprints.map(sprint => {
      const points = tasks
        .filter(t => t.sprintId === sprint.id && t.status === 'DONE')
        .reduce((acc, t) => acc + (t.storyPoint || 0), 0);
      return { name: sprint.name || `Sprint ${sprint.id}`, points };
    });
  }, [tasks, sprints]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 w-full relative">
        {data.length > 0 ? (
          <SafeChartFrame>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--cu-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'var(--cu-text-muted)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'var(--cu-text-muted)' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid var(--cu-border)', background: 'var(--cu-bg)', color: 'var(--cu-text-primary)', fontSize: '11px' }} cursor={{ fill: 'var(--cu-hover)' }} />
                <Bar dataKey="points" fill="var(--cu-success)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </SafeChartFrame>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-cu-bg-secondary rounded-lg border border-dashed border-cu-border">
            <p className="text-[11px] text-cu-text-muted">Complete sprints to show velocity</p>
          </div>
        )}
      </div>
    </div>
  );
}

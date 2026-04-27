'use client';

import React, { useMemo } from 'react';
import { Task, Sprint } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { SafeChartFrame } from './SafeChartFrame';

/**
 * Visualizes the progress of an active sprint by comparing ideal vs actual task completion.
 */
export function BurndownChart({ tasks, sprints }: { tasks: Task[], sprints: Sprint[] }) {
  const burndownData = useMemo(() => {
    const activeSprint = sprints.find(s => s.status === 'ACTIVE');
    if (!activeSprint?.startDate || !activeSprint?.endDate) return [];

    const start = new Date(activeSprint.startDate);
    const end = new Date(activeSprint.endDate);
    const sprintTasks = tasks.filter(t => t.sprintId === activeSprint.id);
    const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.storyPoint || 0), 0);

    const data = [];
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
    const dailyIdealDrop = totalPoints / (totalDays - 1 || 1);

    let currentRemaining = totalPoints;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(start);
      currentDate.setDate(start.getDate() + i);
      const dateString = currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const ideal = Math.max(0, totalPoints - (dailyIdealDrop * i));
      const pointsDoneToday = sprintTasks
        .filter(t => t.status === 'DONE' && t.completedAt && new Date(t.completedAt).toDateString() === currentDate.toDateString())
        .reduce((acc, t) => acc + (t.storyPoint || 0), 0);

      if (currentDate <= new Date()) {
        currentRemaining -= pointsDoneToday;
        data.push({ date: dateString, ideal: Math.round(ideal), remaining: Math.max(0, currentRemaining) });
      } else {
        data.push({ date: dateString, ideal: Math.round(ideal), remaining: null });
      }
    }
    return data;
  }, [tasks, sprints]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex-1 min-h-0 w-full relative">
        {burndownData.length > 0 ? (
          <SafeChartFrame>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burndownData} margin={{ top: 4, right: 8, bottom: 0, left: -28 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6A7282' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#6A7282' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E3E8EF', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line type="monotone" dataKey="ideal" name="Ideal" stroke="#98A2B3" strokeDasharray="5 5" dot={false} strokeWidth={1.5} />
                <Line type="stepAfter" dataKey="remaining" name="Actual" stroke="#0052CC" strokeWidth={2} activeDot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </SafeChartFrame>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <p className="text-[11px] text-gray-400">No active sprint data</p>
          </div>
        )}
      </div>
    </div>
  );
}

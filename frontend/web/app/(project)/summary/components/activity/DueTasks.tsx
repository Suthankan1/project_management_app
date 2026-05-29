'use client';

import React, { useMemo } from 'react';
import { Task } from '@/types';
import { Clock } from 'lucide-react';

/**
 * Lists tasks that are due within the next 5 days.
 * Includes urgency-based color coding for due dates.
 */
export function DueTasks({ tasks = [] }: { tasks?: Task[] }) {
  const todayStart = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const fiveDaysEnd = useMemo(() => {
    const limit = new Date(todayStart);
    limit.setDate(limit.getDate() + 5);
    limit.setHours(23, 59, 59, 999);
    return limit;
  }, [todayStart]);

  const upcomingTasks = useMemo(
    () => [...tasks]
        .filter((t) => {
          if (!t.dueDate || t.status === 'DONE') return false;
          const due = new Date(t.dueDate);
          return due >= todayStart && due <= fiveDaysEnd;
        })
        .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
        .slice(0, 5),
    [tasks, todayStart, fiveDaysEnd]
  );

  return (
    <div className="h-full">
      {upcomingTasks.length === 0 ? (
        <p className="font-arimo text-[13px] text-cu-text-muted bg-cu-bg-secondary p-4 rounded-lg text-center border border-dashed border-cu-border">
          No tasks due in the next 5 days.
        </p>
      ) : (
        <div className="space-y-2.5">
          {upcomingTasks.map((task) => {
            const dueDate = new Date(task.dueDate!);
            const daysDiff = Math.ceil((dueDate.getTime() - todayStart.getTime()) / (1000 * 3600 * 24));
            const dueLabel = daysDiff === 0 ? 'Due Today' : `In ${daysDiff} day${daysDiff > 1 ? 's' : ''}`;
            
            const dueColorClass = daysDiff === 0
              ? 'bg-cu-danger/10 text-cu-danger border border-cu-danger/20'
              : daysDiff <= 2
                ? 'bg-cu-warning/10 text-cu-warning border border-cu-warning/20'
                : 'bg-cu-primary/10 text-cu-primary border border-cu-primary/20';

            return (
              <div key={task.id} className="p-2.5 rounded-xl border border-cu-border bg-cu-bg hover:border-cu-primary/35 hover:bg-cu-primary/5 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Clock size={13} className="text-cu-primary shrink-0" />
                    <p className="font-arimo text-[13px] font-semibold text-cu-text-primary truncate">{task.title}</p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${dueColorClass}`}>
                    {dueLabel}
                  </span>
                </div>
                
                <div className="mt-2 flex items-center justify-between gap-3 text-[11px] text-cu-text-muted">
                  <div className="flex items-center gap-2 truncate">
                    <span className="font-bold text-cu-text-secondary bg-cu-bg-secondary px-1.5 py-0.5 rounded border border-cu-border-light">TSK-{task.id}</span>
                    <span className="truncate">{task.assigneeName || 'Unassigned'}</span>
                  </div>
                  <span className="whitespace-nowrap">{dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

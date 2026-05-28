'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Flag } from 'lucide-react';
import { MilestoneResponse } from '@/types';

// Mock status config for the summary view to keep it independent
const STATUS_BADGES: Record<string, string> = {
  OPEN: 'bg-cu-primary/10 text-cu-primary border border-cu-primary/20',
  IN_PROGRESS: 'bg-cu-warning/10 text-cu-warning border border-cu-warning/20',
  COMPLETED: 'bg-cu-success/10 text-cu-success border border-cu-success/20',
  CANCELLED: 'bg-cu-bg-secondary text-cu-text-secondary border border-cu-border',
};

/**
 * Displays upcoming milestones with progress indicators and status badges.
 */
export function UpcomingMilestones({
  projectId,
  milestones = [],
  isLoading = false,
}: {
  projectId: number;
  milestones?: MilestoneResponse[];
  isLoading?: boolean;
}) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const sortedMilestones = useMemo(
    () => [...milestones]
        .filter((m) => m.status === 'OPEN' || m.status === 'IN_PROGRESS')
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        })
        .slice(0, 4),
    [milestones]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-14 bg-cu-bg-secondary rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col justify-between">
      {sortedMilestones.length === 0 ? (
        <p className="text-[13px] text-cu-text-muted bg-cu-bg-secondary p-4 rounded-lg text-center border border-dashed border-cu-border">
          No upcoming milestones.
        </p>
      ) : (
        <div className="space-y-4">
          {sortedMilestones.map((m) => {
            const dueDate = m.dueDate ? new Date(m.dueDate) : null;
            const daysDiff = dueDate ? Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24)) : null;
            const isOverdue = dueDate && m.status === 'OPEN' && dueDate < today;

            return (
              <div key={m.id} className="p-3 rounded-xl border border-cu-border bg-cu-bg hover:border-cu-primary/35 hover:bg-cu-primary/5 transition-colors">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <Flag size={13} className={m.status === 'COMPLETED' ? 'text-cu-success' : 'text-cu-primary'} />
                    <p className="text-[13px] font-semibold text-cu-text-primary truncate">{m.name}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_BADGES[m.status] || STATUS_BADGES.OPEN}`}>
                    {m.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between gap-3 text-[11px]">
                  <span className={isOverdue ? 'text-cu-danger font-semibold' : 'text-cu-text-muted'}>
                    {dueDate ? dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No due date'}
                  </span>
                  <span className={`font-bold ${isOverdue ? 'text-cu-danger' : 'text-cu-warning'}`}>
                    {dueDate ? (isOverdue ? `${Math.abs(daysDiff!)}d overdue` : daysDiff === 0 ? 'Due today' : `In ${daysDiff} days`) : `${m.taskCount} tasks`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <Link
        href={`/milestones?projectId=${projectId}`}
        className="mt-4 flex items-center justify-center gap-1.5 w-full py-2.5 rounded-lg border border-cu-primary/20 text-cu-primary bg-cu-primary/10 hover:bg-cu-primary hover:text-white transition-all font-bold text-[12px]"
      >
        Open Milestones
      </Link>
    </div>
  );
}

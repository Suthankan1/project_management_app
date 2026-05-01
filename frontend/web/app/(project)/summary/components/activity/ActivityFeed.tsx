'use client';

// Displays a timeline of the most recently updated tasks for quick team visibility.
import React, { useMemo, memo } from 'react';
import { Task } from '@/types';

// Formats the timestamp into a human-readable 'time ago' string (e.g., '5m ago').
function formatTimeAgo(dateString?: string | Date) {
  if (!dateString) return 'recently';
  const diffInMins = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / 60000);
  
  if (diffInMins < 1) return 'just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)}h ago`;
  if (diffInMins < 10080) return `${Math.floor(diffInMins / 1440)}d ago`;
  return new Date(dateString).toLocaleDateString();
}

// Individual timeline item component to render a single task's activity efficiently.
const ActivityItem = memo(({ task }: { task: Task }) => {
  const isDone = task.status === 'DONE' || task.status === 'COMPLETED';
  const colorClass = isDone ? 'bg-[#00875A]' : 'bg-[#0052CC]';
  const actionText = isDone ? 'completed' : 'updated';
  const initials = task.assigneeName ? task.assigneeName.substring(0, 2).toUpperCase() : null;

  return (
    <div className="relative group">
      {/* Circle indicator on the timeline showing user initials or a status icon. */}
      <div className={`absolute -left-[27px] w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm transition-transform group-hover:scale-110 ${colorClass}`}>
        {initials ? (
          <span className="text-[10px] text-white font-bold">{initials}</span>
        ) : (
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {isDone ? <polyline points="20 6 9 17 4 12" /> : <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />}
          </svg>
        )}
      </div>

      {/* The main content of the activity item. */}
      <p className="font-arimo text-[13px] text-gray-800 leading-tight">
        <span className="font-semibold">{task.assigneeName || 'Someone'}</span> {actionText} <span className="font-medium text-[#0052CC]">TSK-{task.id}</span>
      </p>
      <p className="font-arimo text-[12px] text-gray-500 mt-1 truncate" title={task.title}>{task.title}</p>
      
      {/* The timestamp positioned at the top right of the item. */}
      <span className="font-arimo text-[11px] text-gray-400 absolute top-0 right-0 bg-white/80 px-1 rounded">
        {formatTimeAgo(task.updatedAt)}
      </span>
    </div>
  );
});
ActivityItem.displayName = 'ActivityItem';

export function ActivityFeed({ tasks = [] }: { tasks?: Task[] }) {
  // Sorts tasks by last updated time and picks the top 5 for the feed.
  const recentUpdates = useMemo(
    () => [...tasks]
        .filter(t => t.updatedAt)
        .sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime())
        .slice(0, 5),
    [tasks]
  );

  return (
    <div className="h-full">
      {/* Show empty state if there are no recent task updates. */}
      {recentUpdates.length === 0 ? (
        <p className="font-arimo text-[14px] text-[#98A2B3] italic bg-gray-50 p-4 rounded-lg text-center border border-dashed border-gray-200">
          No recent updates
        </p>
      ) : (
        <div className="relative border-l-2 border-gray-100 ml-3 pl-5 space-y-6 pt-1 pb-1">
          {/* Render the extracted timeline item for each recent update. */}
          {recentUpdates.map(task => <ActivityItem key={task.id} task={task} />)}
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useMemo, useState } from 'react';
import { Task } from '@/types';
import { CheckCircle2, Trophy } from 'lucide-react';
import Image from 'next/image';
import { getInitials, resolveSummaryAvatarUrl } from '../avatar-utils';

/**
 * Formats date into "time ago" string.
 */
function formatTimeAgo(dateString?: string | Date) {
  if (!dateString) return 'recently';
  const diffInMs = new Date().getTime() - new Date(dateString).getTime();
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMins / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInMins < 1) return 'just now';
  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
}

function CompletedTaskAvatar({ name, photoUrl }: { name?: string | null; photoUrl?: string | null }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = getInitials(name);

  return (
    <div className="w-9 h-9 rounded-full bg-cu-bg-secondary flex items-center justify-center border-2 border-cu-bg shadow-cu-sm overflow-hidden shrink-0">
      {photoUrl && !imageFailed ? (
        <Image
          src={photoUrl}
          alt={name ? `${name} avatar` : 'Assignee avatar'}
          width={36}
          height={36}
          className="h-9 w-9 object-cover"
          unoptimized
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span className="text-[11px] font-extrabold text-cu-text-secondary">
          {initials}
        </span>
      )}
    </div>
  );
}

/**
 * Shows a celebratory list of the most recently completed tasks.
 */
export function RecentlyCompleted({ tasks = [] }: { tasks?: Task[] }) {
  const completedTasks = useMemo(
    () => [...tasks]
        .filter(t => t.status === 'DONE' || t.status === 'COMPLETED')
        .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
        .slice(0, 5),
    [tasks]
  );

  return (
    <div className="h-full relative overflow-hidden">
      {/* Decorative trophy background icon */}
      <div className="absolute right-[-10px] top-[-10px] text-cu-success/10 rotate-12 pointer-events-none">
        <Trophy size={120} strokeWidth={1} />
      </div>

      {completedTasks.length === 0 ? (
        <div className="py-6 px-4 flex flex-col items-center justify-center bg-cu-bg-secondary rounded-xl border border-dashed border-cu-border">
          <CheckCircle2 size={16} className="text-cu-text-muted mb-2" />
          <p className="font-arimo text-[13px] text-cu-text-muted font-medium">No completed tasks yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 relative z-10">
          {completedTasks.map((task, i) => {
            const photoUrl = resolveSummaryAvatarUrl(
              task.assigneePhotoUrl || task.assignee?.avatar || task.assignee?.profilePicUrl
            );

            return (
              <div key={task.id} className="group flex items-center gap-3 p-2.5 bg-cu-bg rounded-xl border border-cu-border hover:shadow-cu-md hover:border-cu-success/25 hover:bg-cu-success/5 transition-all">
                <span className="w-5 font-arimo text-[10px] font-black text-cu-text-muted text-center">#{i + 1}</span>
                
                {/* Assignee Avatar */}
                <CompletedTaskAvatar name={task.assigneeName} photoUrl={photoUrl} />
                
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-cu-text-primary truncate group-hover:text-cu-success transition-colors">{task.title}</p>
                  <p className="text-[11px] text-cu-text-secondary truncate">by <span className="font-bold">{task.assigneeName || 'Someone'}</span></p>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="text-[10px] font-bold text-cu-success bg-cu-success/10 px-2 py-0.5 rounded-md mb-1 border border-cu-success/20">TSK-{task.id}</span>
                  <span className="text-[10px] font-medium text-cu-text-muted">{formatTimeAgo(task.updatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

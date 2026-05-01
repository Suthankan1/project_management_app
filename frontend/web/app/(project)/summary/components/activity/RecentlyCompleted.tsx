'use client';

import React, { useMemo } from 'react';
import { Task } from '@/types';
import { CheckCircle2, Trophy } from 'lucide-react';
import Image from 'next/image';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

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
      <div className="absolute right-[-10px] top-[-10px] text-[#00875A]/5 rotate-12 pointer-events-none">
        <Trophy size={120} strokeWidth={1} />
      </div>

      {completedTasks.length === 0 ? (
        <div className="py-6 px-4 flex flex-col items-center justify-center bg-white/50 rounded-xl border border-dashed border-gray-200">
          <CheckCircle2 size={16} className="text-gray-300 mb-2" />
          <p className="font-arimo text-[13px] text-[#98A2B3] font-medium">No completed tasks yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 relative z-10">
          {completedTasks.map((task, i) => {
            const photoUrlRaw = task.assigneePhotoUrl || task.assignee?.avatar || task.assignee?.profilePicUrl;
            const photoUrl = photoUrlRaw && !photoUrlRaw.startsWith('http') 
              ? `${API_BASE_URL}${photoUrlRaw.startsWith('/') ? '' : '/'}${photoUrlRaw}` 
              : photoUrlRaw;

            return (
              <div key={task.id} className="group flex items-center gap-3 p-2.5 bg-white rounded-xl border border-gray-100 hover:shadow-md hover:border-[#00875A]/20 transition-all">
                <span className="w-5 font-arimo text-[10px] font-black text-gray-300 text-center">#{i + 1}</span>
                
                {/* Assignee Avatar */}
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                  {photoUrl ? (
                    <Image src={photoUrl} alt="Avatar" width={36} height={36} className="object-cover" />
                  ) : (
                    <span className="text-[11px] font-extrabold text-gray-500">
                      {(task.assigneeName || 'U').substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-[#101828] truncate group-hover:text-[#00875A] transition-colors">{task.title}</p>
                  <p className="text-[11px] text-[#667085] truncate">by <span className="font-bold">{task.assigneeName || 'Someone'}</span></p>
                </div>

                <div className="flex flex-col items-end shrink-0 pl-2">
                  <span className="text-[10px] font-bold text-[#00875A] bg-[#00875A]/10 px-2 py-0.5 rounded-md mb-1 border border-[#00875A]/20">TSK-{task.id}</span>
                  <span className="text-[10px] font-medium text-gray-400">{formatTimeAgo(task.updatedAt)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

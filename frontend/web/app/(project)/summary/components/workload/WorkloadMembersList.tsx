'use client';

// Displays the detailed, scrollable list of team members with their task progress bars.
import React from 'react';
import Image from 'next/image';
import { WorkloadEntry, formatRole } from './types';

interface WorkloadMembersListProps {
  workloadData: WorkloadEntry[];
  activeWorkloadData: WorkloadEntry[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export function WorkloadMembersList({ 
  workloadData, 
  activeWorkloadData, 
  activeIndex, 
  setActiveIndex 
}: WorkloadMembersListProps) {
  return (
    <div className="w-full lg:w-8/12 p-6 relative" onMouseLeave={() => setActiveIndex(-1)}>
      <div className="grid grid-cols-1 gap-3 max-h-[310px] overflow-y-auto pr-3 custom-scrollbar relative z-10 w-full pb-8">
        {workloadData.map((member) => {
          const actualPieIndex = activeWorkloadData.findIndex(d => d.name === member.name);

          return (
            <div
              key={member.name}
              onMouseEnter={() => setActiveIndex(actualPieIndex)}
              onClick={() => setActiveIndex(actualPieIndex)}
              className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border bg-white/60 backdrop-blur-md transition-all cursor-pointer ${actualPieIndex === activeIndex && actualPieIndex !== -1 ? 'border-white/90 shadow-md ring-1 ring-white shadow-[0_4px_20px_rgb(0,82,204,0.06)] scale-[1.01]' : 'border-white/50 hover:border-white/80 hover:bg-white/80'
                }`}
            >
              {/* Member Profile Block */}
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-sm text-white font-arimo text-[13px] font-bold ring-2 ring-white/80 backdrop-blur-sm"
                  style={{ backgroundColor: member.color }}
                >
                  {member.avatar ? (
                    <Image src={member.avatar} alt={member.name} width={40} height={40} className="w-10 h-10 rounded-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                  ) : (
                    <span>{member.initials || 'U'}</span>
                  )}
                </div>
                <div>
                  <h4 className="font-arimo text-[14px] font-bold text-[#101828] leading-none mb-1.5">{member.name}</h4>
                  <p className="font-arimo text-[11px] text-[#667085] font-semibold tracking-wide uppercase">{formatRole(member.role)}</p>
                </div>
              </div>

              {/* Badges & Progress Info */}
              <div className="flex flex-col sm:items-end gap-2.5">
                <div className="flex items-center gap-2">
                  {member.overdue > 0 && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold tracking-wider bg-red-100/80 backdrop-blur text-red-700 border border-red-200/50 uppercase whitespace-nowrap shadow-sm">
                      {member.overdue} OVERDUE
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-[12px] font-arimo font-semibold text-[#101828] bg-white/70 px-2.5 py-0.5 rounded-lg border border-white/80 shadow-sm backdrop-blur-sm">
                    {member.value} {member.value === 1 ? 'Task' : 'Tasks'}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="flex items-center gap-3 w-full sm:w-[140px]">
                  <span className="text-[11px] font-bold whitespace-nowrap" style={{ color: member.value > 0 && member.completed === member.value ? '#00875A' : member.color }}>
                    {member.value > 0 ? Math.round((member.completed / member.value) * 100) : 0}%
                  </span>
                  <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden shadow-inner flex-1 border border-white/40">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: `${member.value > 0 ? (member.completed / member.value) * 100 : 0}%`,
                        backgroundColor: member.color
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Scroll Fade Indicator to hint scrollability */}
      <div className="absolute bottom-6 left-6 right-8 h-16 bg-gradient-to-t from-white/90 via-white/40 to-transparent pointer-events-none z-20 rounded-b-xl backdrop-blur-[1px]" />
    </div>
  );
}

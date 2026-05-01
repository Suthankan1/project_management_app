'use client';

// Renders the visual pie chart showing how tasks are distributed among team members.
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Sector, PieSectorShapeProps } from 'recharts';
import { UserPlus, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { SafeChartFrame } from '@/components/shared/SafeChartFrame';
import { WorkloadEntry } from './types';

interface ActiveShapeProps {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill?: string;
}

const renderActiveShape = (props: ActiveShapeProps) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  const safeFill = fill || '#0052CC';

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={safeFill}
        className="transition-all duration-300 drop-shadow-md"
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 12}
        outerRadius={outerRadius + 16}
        fill={safeFill}
      />
    </g>
  );
};

interface WorkloadPieChartProps {
  projectId: number | string;
  membersLength: number;
  tasksLength: number;
  activeWorkloadData: WorkloadEntry[];
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

export function WorkloadPieChart({ 
  projectId, 
  membersLength, 
  tasksLength, 
  activeWorkloadData, 
  activeIndex, 
  setActiveIndex 
}: WorkloadPieChartProps) {

  const renderPieShape = (shapeProps: PieSectorShapeProps) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill, index } = shapeProps;
    const safeFill = fill || '#0052CC';

    if (index !== activeIndex) {
      return (
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={safeFill}
          className="transition-all duration-300"
        />
      );
    }
    return renderActiveShape({ cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill: safeFill });
  };

  const onPieEnter = (_payload: unknown, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div className="w-full lg:w-4/12 p-6 flex flex-col items-center justify-center relative" onMouseLeave={() => setActiveIndex(-1)}>
      {activeWorkloadData.length > 0 ? (
        <div className="relative w-full h-[280px]">
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300 z-10 opacity-100">
            {activeIndex === -1 ? (
              <>
                <h3 className="text-[24px] font-black text-[#101828] leading-none mb-1">{membersLength}</h3>
                <p className="text-[10px] font-bold text-[#667085] uppercase tracking-widest mb-1.5">Members</p>
                <div className="w-8 h-[2px] bg-gray-200 rounded-full mb-1.5"></div>
                <h3 className="text-[18px] font-black text-[#0052CC] leading-none mb-1">{tasksLength}</h3>
                <p className="text-[10px] font-bold text-[#667085] uppercase tracking-widest">Tasks</p>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 mt-[-2px]">
                <h3 className="text-[22px] font-arimo font-extrabold tracking-tight bg-gradient-to-br from-[#101828] to-[#667085] bg-clip-text text-transparent leading-[1.2] text-center px-4 line-clamp-1">
                  {activeWorkloadData[activeIndex]?.name === 'Unassigned' ? 'Unassigned' : activeWorkloadData[activeIndex]?.name?.split(' ')[0] || 'Unknown'}
                </h3>
                <p className="text-[13px] font-arimo text-[#667085]">
                  {activeWorkloadData[activeIndex]?.value || 0} Tasks ({Math.round(((activeWorkloadData[activeIndex]?.value || 0) / (tasksLength || 1)) * 100)}%)
                </p>
              </div>
            )}
          </div>

          <SafeChartFrame>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart onMouseLeave={() => setActiveIndex(-1)}>
                <Pie
                  shape={renderPieShape}
                  data={activeWorkloadData}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={95}
                  dataKey="value"
                  onMouseEnter={onPieEnter}
                >
                  {activeWorkloadData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} style={{ outline: 'none' }} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </SafeChartFrame>
        </div>
      ) : (
        <div className="h-[280px] w-full flex flex-col items-center justify-center text-gray-400">
          <Briefcase size={32} className="mb-2 opacity-30 text-gray-400" />
          <p className="font-arimo text-[13px]">No tasks assigned yet</p>
        </div>
      )}

      <Link
        href={`/members/${projectId}?invite=true`}
        className="group absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[#344054] bg-white/80 backdrop-blur-md border border-white/80 hover:bg-[#0052CC] hover:text-white hover:border-[#0052CC] rounded-xl px-4 py-2 font-arimo text-[12px] font-bold transition-all duration-300 shadow-sm hover:shadow-lg active:scale-[0.97] z-20"
      >
        <UserPlus size={14} /> Add Member
      </Link>
    </div>
  );
}

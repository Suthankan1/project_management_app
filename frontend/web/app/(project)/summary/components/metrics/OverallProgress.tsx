'use client';

import React from 'react';
import { CircularProgress } from './CircularProgress';

/**
 * A widget that displays the overall project completion status with an animated circle.
 */
export function OverallProgress({ completedTasks, totalTasks }: { completedTasks: number, totalTasks: number }) {
    const percentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

    return (
        <div className="h-full w-full flex items-center justify-between group overflow-hidden relative">
            <div className="flex flex-col h-full justify-center min-w-0 pr-2">
                <p className="font-arimo text-[14px] text-gray-500 font-medium group-hover:text-[#0052CC] transition-colors truncate mb-1">
                    Overall Progress
                </p>
                <span className="font-arimo text-[24px] text-[#0052CC] leading-none font-bold truncate">
                    {percentage === 100 ? "Completed" : percentage >= 50 ? "On Track" : "At Risk"}
                </span>
            </div>
            <CircularProgress percentage={percentage} />
        </div>
    );
}

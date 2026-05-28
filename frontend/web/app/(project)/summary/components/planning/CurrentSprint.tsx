'use client';

import React from 'react';
import { Sprint, Task } from '@/types';
import Link from 'next/link';

/**
 * Displays key metrics and progress for the project's currently active sprint.
 */
export function CurrentSprint({ projectId, sprints = [], tasks = [] }: { projectId?: number, sprints?: Sprint[], tasks?: Task[] }) {
    const activeSprint = sprints.find(s => s.status === 'ACTIVE');

    if (!activeSprint) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-4">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 text-cu-text-muted">
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
                <p className="text-[14px] text-cu-text-secondary mb-4 text-center">Start a sprint to unleash your team&apos;s tracking capabilities.</p>
                <button className="px-4 py-2 bg-cu-primary text-white font-semibold rounded-lg text-sm hover:bg-cu-primary-hover transition-all shadow-cu-sm">
                    Create Sprint
                </button>
            </div>
        );
    }

    const sprintTasks = tasks.filter(t => t.sprintId === activeSprint.id);
    const totalPoints = sprintTasks.reduce((acc, t) => acc + (t.storyPoint || 0), 0);
    const completedTasks = sprintTasks.filter(t => t.status === 'DONE');
    const donePoints = completedTasks.reduce((acc, t) => acc + (t.storyPoint || 0), 0);
    const percentage = totalPoints === 0 ? 0 : Math.round((donePoints / totalPoints) * 100);

    let daysRemainingText = "Ending soon";
    let isUrgent = false;
    if (activeSprint.endDate) {
        const diff = new Date(activeSprint.endDate).getTime() - new Date().getTime();
        const days = Math.ceil(diff / (1000 * 3600 * 24));
        if (days >= 0) {
            daysRemainingText = `${days} Day${days !== 1 ? 's' : ''} Left`;
            isUrgent = days <= 3;
        } else {
            daysRemainingText = `Ended ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} ago`;
            isUrgent = true;
        }
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-[16px] text-cu-primary font-bold">{activeSprint.name}</h3>
                <div className={`${isUrgent ? 'bg-cu-danger/10 text-cu-danger border border-cu-danger/20' : 'bg-cu-success/10 text-cu-success border border-cu-success/20'} px-3 py-1.5 rounded-md font-bold text-[12px] shadow-cu-sm`}>
                    {daysRemainingText}
                </div>
            </div>

            <div className="mb-3">
                <div className="flex justify-between text-[14px] text-cu-text-secondary mb-2">
                    <span className="font-medium">Points Done: {donePoints} / {totalPoints}</span>
                    <span className="font-bold text-cu-text-primary">{percentage}%</span>
                </div>
                <div className="w-full bg-cu-bg-tertiary rounded-full h-3 overflow-hidden">
                    <div className="bg-cu-primary h-3 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                </div>
                <p className="text-[12px] text-cu-text-muted mt-2">{completedTasks.length} out of {sprintTasks.length} tasks completed.</p>
            </div>

            <Link href={`/project/${projectId}/sprintboard`} className="mt-auto inline-flex items-center gap-2 text-cu-primary text-[14px] font-semibold hover:underline group">
                Go to Sprint Board
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="group-hover:translate-x-1 transition-transform">
                    <path d="M3.33334 8H12.6667" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M8 3.33334L12.6667 8L8 12.6667" stroke="currentColor" strokeWidth="1.33333" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </Link>
        </div>
    );
}

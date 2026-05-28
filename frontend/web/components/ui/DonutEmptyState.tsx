'use client';

import { RADIUS } from '@/hooks/useDonutChart';

export default function DonutEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[250px] w-full rounded-2xl border border-cu-border bg-cu-bg-secondary/45 p-4 shadow-cu-sm">
            <div className="relative flex items-center justify-center w-40 h-40">
                <div className="absolute inset-4 rounded-full bg-cu-bg/70 shadow-[inset_0_1px_10px_rgba(15,23,42,0.08)]" />
                <svg className="w-full h-full" viewBox="0 0 160 160">
                    <circle
                        cx="80" cy="80" r={RADIUS}
                        fill="none" stroke="var(--cu-bg-tertiary)" strokeWidth="14"
                        strokeDasharray="4 8" strokeLinecap="round"
                    />
                </svg>
                <div className="absolute text-center flex flex-col items-center">
                    <span className="text-[28px] font-bold text-cu-text-tertiary font-sans leading-none">0</span>
                    <span className="text-[11px] font-bold text-cu-text-muted mt-1 uppercase tracking-widest">Tasks</span>
                </div>
            </div>
            <div className="mt-8 text-[13px] text-cu-text-muted font-semibold tracking-wide">ZERO TASKS REQUIRED</div>
        </div>
    );
}

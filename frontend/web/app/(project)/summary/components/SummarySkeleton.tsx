'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

// Base Bento Card Skeleton to match the real BentoCard
export function BentoCardSkeleton({ children, className = "", noPadding = false }: { children?: React.ReactNode, className?: string, noPadding?: boolean }) {
    return (
        <div className={`flex flex-col bg-white rounded-xl border border-[#E3E8EF] shadow-sm ring-1 ring-black/[0.03] overflow-hidden ${className}`}>
            <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 bg-gray-50/60 shrink-0">
                <Skeleton className="w-4 h-4 rounded-md shrink-0" />
                <Skeleton className="h-3.5 w-28 rounded-md" />
            </div>
            <div className={`flex-1 min-h-0 ${noPadding ? '' : 'p-4'}`}>
                {children}
            </div>
        </div>
    );
}

// 1. Metrics Grid Skeleton (4 cards)
export function MetricsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Progress */}
            <BentoCardSkeleton className="h-[120px]">
                <div className="flex items-center justify-between h-full">
                    <div className="space-y-3">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="w-[60px] h-[60px] rounded-full" />
                </div>
            </BentoCardSkeleton>
            
            {/* Other 3 Metrics */}
            {[...Array(3)].map((_, i) => (
                <BentoCardSkeleton key={i} className="h-[120px]">
                    <div className="flex items-center gap-4 h-full">
                        <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
                        <div className="space-y-3">
                            <Skeleton className="h-7 w-12" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                </BentoCardSkeleton>
            ))}
        </div>
    );
}

// 2. Report Button Skeleton
export function ReportSkeleton() {
    return (
        <div className="rounded-xl overflow-hidden shadow-sm ring-1 ring-black/[0.03] border border-[#E3E8EF] bg-white h-[64px] flex items-center px-4 justify-between">
             <div className="flex items-center gap-3">
                 <Skeleton className="w-8 h-8 rounded-lg" />
                 <Skeleton className="h-4 w-40" />
             </div>
             <Skeleton className="w-32 h-9 rounded-lg hidden sm:block" />
        </div>
    );
}

// 3. Current Sprint Skeleton
export function SprintSkeleton() {
    return (
        <BentoCardSkeleton className="h-[224px]">
            <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="w-24 h-8 rounded-md" />
            </div>

            <div className="mt-8">
                <div className="flex justify-between mb-3">
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="w-full h-3 rounded-full" />
                <Skeleton className="h-3 w-40 mt-4" />
            </div>
        </BentoCardSkeleton>
    );
}

// 4. Activity Sidebar Skeleton
export function ActivitySkeleton() {
    return (
        <BentoCardSkeleton className="h-[304px]">
            <div className="space-y-5 mt-2">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2.5">
                            <Skeleton className="h-3.5 w-4/5" />
                            <Skeleton className="h-2.5 w-1/3" />
                        </div>
                    </div>
                ))}
            </div>
        </BentoCardSkeleton>
    );
}

// 5. Chart Skeleton
export function ChartSkeleton() {
    return (
        <BentoCardSkeleton className="h-[288px] flex flex-col">
            <div className="flex-1 flex items-end justify-between gap-2 pt-6">
                {[...Array(8)].map((_, j) => {
                    const heights = ['40%', '75%', '50%', '85%', '25%', '65%', '45%', '90%'];
                    return (
                        <div
                            key={j}
                            className="w-full rounded-t-sm bg-gray-100/80 animate-pulse"
                            style={{ height: heights[j % heights.length] }}
                        />
                    );
                })}
            </div>
            <div className="flex justify-between mt-4">
                <Skeleton className="h-2.5 w-8" />
                <Skeleton className="h-2.5 w-8" />
                <Skeleton className="h-2.5 w-8" />
            </div>
        </BentoCardSkeleton>
    );
}

// 6. List Cards (Tasks, Milestones)
export function ListCardSkeleton() {
    return (
        <BentoCardSkeleton className="h-[352px]">
             <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-gray-50/50 rounded-xl border border-gray-100">
                        <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-3 w-3/4" />
                            <Skeleton className="h-2.5 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </BentoCardSkeleton>
    );
}

// 7. Chat/Notes Skeleton
export function ChatNotesSkeleton({ isChat = false }: { isChat?: boolean }) {
    return (
        <BentoCardSkeleton className="h-[352px]">
            <div className="space-y-5 mt-2">
                {isChat ? (
                    [...Array(4)].map((_, i) => (
                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                            <Skeleton className={`h-14 rounded-2xl ${i % 2 === 0 ? 'w-3/5 rounded-tl-sm' : 'w-2/5 rounded-tr-sm'}`} />
                        </div>
                    ))
                ) : (
                    <div className="space-y-4">
                         <Skeleton className="h-3 w-full" />
                         <Skeleton className="h-3 w-5/6" />
                         <Skeleton className="h-3 w-4/6" />
                         <Skeleton className="h-3 w-full" />
                         <Skeleton className="h-3 w-3/4" />
                    </div>
                )}
            </div>
        </BentoCardSkeleton>
    );
}

// 8. Workload Skeleton
export function WorkloadSkeleton() {
    return (
        <div className="bg-white/60 backdrop-blur-2xl rounded-2xl border border-gray-200 overflow-hidden shadow-sm mt-6">
            <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
                <Skeleton className="w-4 h-4 rounded-md" />
                <Skeleton className="h-4 w-48" />
            </div>
            <div className="p-6 flex flex-col lg:flex-row gap-8">
                {/* Pie chart */}
                <div className="w-full lg:w-4/12 flex items-center justify-center min-h-[280px]">
                    <Skeleton className="w-[220px] h-[220px] rounded-full" />
                </div>
                {/* Members list */}
                <div className="w-full lg:w-8/12 space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 gap-4">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-10 h-10 rounded-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3.5 w-32" />
                                    <Skeleton className="h-2.5 w-20" />
                                </div>
                            </div>
                            <div className="flex flex-col sm:items-end gap-2.5">
                                <Skeleton className="h-5 w-16 rounded-md" />
                                <div className="flex items-center gap-3">
                                    <Skeleton className="h-3 w-8" />
                                    <Skeleton className="h-2 w-[120px] rounded-full" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Main assembled skeleton for the full page
export default function SummaryPageSkeleton() {
    return (
        <div className="w-full pt-4 animate-in fade-in duration-500">
            <div className="flex flex-col gap-4">
                {/* Row 1: Metrics */}
                <MetricsSkeleton />

                {/* Row 2: Report, Sprint, Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Left Col (Report + Sprint) */}
                    <div className="lg:col-span-8 flex flex-col gap-4">
                        <ReportSkeleton />
                        <SprintSkeleton />
                    </div>
                    {/* Right Col */}
                    <div className="lg:col-span-4">
                        <ActivitySkeleton />
                    </div>
                </div>

                {/* Row 3: 4 Charts */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ChartSkeleton />
                    <ChartSkeleton />
                    <ChartSkeleton />
                    <ChartSkeleton />
                </div>

                {/* Row 4: Tasks and Milestones */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ListCardSkeleton />
                    <ListCardSkeleton />
                    <ListCardSkeleton />
                </div>

                {/* Row 5: Docs, Notes, Chat */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="sm:col-span-1"><ChatNotesSkeleton /></div> {/* Docs */}
                    <div className="sm:col-span-1"><ChatNotesSkeleton /></div> {/* Notes */}
                    <div className="sm:col-span-2"><ChatNotesSkeleton isChat={true} /></div> {/* Chat */}
                </div>
            </div>

            {/* Standalone Workload Distribution */}
            <WorkloadSkeleton />
        </div>
    );
}

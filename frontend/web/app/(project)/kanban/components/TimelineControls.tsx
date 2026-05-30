'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Calendar, User, ZoomIn, ZoomOut, Layers, EyeOff, Eye, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

const ZOOM_LEVELS = ['Day', 'Week', 'Month'] as const;
type ZoomLevel = typeof ZOOM_LEVELS[number];
type GroupByType = 'none' | 'status' | 'assignee' | 'milestone';

interface TimelineControlsProps {
  zoom: ZoomLevel;
  setZoom: (z: ZoomLevel) => void;
  groupBy: GroupByType;
  setGroupBy: React.Dispatch<React.SetStateAction<GroupByType>>;
  hideWeekends: boolean;
  setHideWeekends: React.Dispatch<React.SetStateAction<boolean>>;
  filterAssignee: string;
  setFilterAssignee: (v: string) => void;
  filterMilestone: string;
  setFilterMilestone: (v: string) => void;
  assigneeNames: string[];
  milestoneOptions: Array<{ id: number; name: string }>;
  todayOffset: number;
  dayColumnWidth: number;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  timelineStart: Date | null;
  timelineEnd: Date | null;
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  scheduledCount: number;
  noDateCount: number;
  overdueCount: number;
  milestoneLinkedCount: number;
}

export default function TimelineControls({
  zoom, setZoom, groupBy, setGroupBy,
  hideWeekends, setHideWeekends,
  filterAssignee, setFilterAssignee,
  filterMilestone, setFilterMilestone,
  assigneeNames, milestoneOptions, todayOffset, dayColumnWidth, scrollContainerRef,
  timelineStart, timelineEnd, searchQuery, setSearchQuery, scheduledCount, noDateCount, overdueCount,
  milestoneLinkedCount,
}: TimelineControlsProps) {
  const [assigneeDropdownOpen, setAssigneeDropdownOpen] = useState(false);
  const [milestoneDropdownOpen, setMilestoneDropdownOpen] = useState(false);
  const assigneeDropdownRef = useRef<HTMLDivElement>(null);
  const milestoneDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (assigneeDropdownRef.current && !assigneeDropdownRef.current.contains(e.target as Node)) setAssigneeDropdownOpen(false);
      if (milestoneDropdownRef.current && !milestoneDropdownRef.current.contains(e.target as Node)) setMilestoneDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="px-4 sm:px-6 py-4 border-b border-cu-border-light bg-cu-bg-secondary">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-cu-text-primary">Project Timeline</h2>
          {timelineStart && timelineEnd && (
            <p className="text-xs text-cu-text-tertiary mt-0.5">
              {format(timelineStart, 'MMM d, yyyy')} – {format(timelineEnd, 'MMM d, yyyy')}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px]">
            <span className="rounded-full border border-cu-border bg-cu-bg px-2 py-0.5 text-cu-text-secondary">scheduled: {scheduledCount}</span>
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-amber-700">no date: {noDateCount}</span>
            <span className="rounded-full border border-red-300 bg-red-50 px-2 py-0.5 text-red-600">overdue: {overdueCount}</span>
            <span className="rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-purple-600">milestone linked: {milestoneLinkedCount}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-cu-border rounded-lg bg-cu-bg text-cu-text-secondary w-full sm:w-auto min-w-[220px]">
            <Calendar className="w-3.5 h-3.5 text-cu-text-muted" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search task title..."
              className="bg-transparent outline-none text-[12px] w-full"
            />
          </div>
          <button
            onClick={() => {
              if (todayOffset >= 0 && scrollContainerRef.current) {
                const scrollLeft = todayOffset * dayColumnWidth - scrollContainerRef.current.clientWidth / 2 + 300;
                scrollContainerRef.current.scrollTo({ left: Math.max(0, scrollLeft), behavior: 'smooth' });
              }
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-cu-border rounded-lg bg-cu-bg text-cu-text-secondary hover:border-red-400 hover:text-red-500 transition-colors"
            title="Scroll to today"
          >
            <Calendar className="w-3.5 h-3.5" />
            Today
          </button>

          <button
            onClick={() => setHideWeekends(h => !h)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs border rounded-lg transition-colors ${
              hideWeekends ? 'border-cu-primary/30 bg-cu-primary/10 text-cu-primary' : 'border-cu-border bg-cu-bg text-cu-text-secondary hover:border-cu-primary/40'
            }`}
            title={hideWeekends ? 'Show weekends' : 'Hide weekends'}
          >
            {hideWeekends ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Weekends
          </button>

          {assigneeNames.length > 0 && (
            <div ref={assigneeDropdownRef} className="relative">
              <button
                type="button"
                onClick={() => setAssigneeDropdownOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-cu-border rounded-lg bg-cu-bg text-cu-text-secondary hover:border-cu-primary/40 transition-colors"
              >
                <User className="w-3.5 h-3.5" />
                <span>{filterAssignee || 'All Assignees'}</span>
                <ChevronDown size={12} className="text-cu-text-muted" />
              </button>
              {assigneeDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-cu-bg border border-cu-border rounded-xl shadow-lg z-50 min-w-[160px] max-h-48 overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => { setFilterAssignee(''); setAssigneeDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cu-hover transition-colors ${!filterAssignee ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
                  >
                    All Assignees
                  </button>
                  {assigneeNames.map(name => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => { setFilterAssignee(name); setAssigneeDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cu-hover transition-colors ${filterAssignee === name ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div ref={milestoneDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setMilestoneDropdownOpen((o) => !o)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-cu-border rounded-lg bg-cu-bg text-cu-text-secondary hover:border-cu-primary/40 transition-colors"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {filterMilestone === ''
                  ? 'All Milestones'
                  : filterMilestone === '__none__'
                    ? 'No Milestone'
                    : milestoneOptions.find((option) => String(option.id) === filterMilestone)?.name ?? 'Milestone'}
              </span>
              <ChevronDown size={12} className="text-cu-text-muted" />
            </button>
            {milestoneDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-cu-bg border border-cu-border rounded-xl shadow-lg z-50 min-w-[180px] max-h-56 overflow-y-auto py-1">
                <button
                  type="button"
                  onClick={() => { setFilterMilestone(''); setMilestoneDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cu-hover transition-colors ${filterMilestone === '' ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
                >
                  All Milestones
                </button>
                <button
                  type="button"
                  onClick={() => { setFilterMilestone('__none__'); setMilestoneDropdownOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cu-hover transition-colors ${filterMilestone === '__none__' ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
                >
                  No Milestone
                </button>
                {milestoneOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => { setFilterMilestone(String(option.id)); setMilestoneDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-cu-hover transition-colors ${filterMilestone === String(option.id) ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => setGroupBy((g) => g === 'none' ? 'status' : g === 'status' ? 'assignee' : g === 'assignee' ? 'milestone' : 'none')}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-cu-border rounded-lg bg-cu-bg text-cu-text-secondary hover:border-cu-primary/40 transition-colors"
            title="Toggle group by"
          >
            <Layers className="w-3.5 h-3.5" />
            {groupBy === 'none' ? 'Group by' : `By ${groupBy}`}
          </button>

          <div className="inline-flex items-center border border-cu-border rounded-lg overflow-hidden ml-auto sm:ml-0 bg-cu-bg">
            <button
              onClick={() => { const i = ZOOM_LEVELS.indexOf(zoom); if (i > 0) setZoom(ZOOM_LEVELS[i - 1]); }}
              disabled={zoom === ZOOM_LEVELS[0]}
              className="px-2 py-1.5 text-cu-text-secondary hover:bg-cu-hover disabled:opacity-40 transition-colors"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 py-1.5 text-xs font-medium text-cu-text-primary border-x border-cu-border bg-cu-bg-secondary">{zoom}</span>
            <button
              onClick={() => { const i = ZOOM_LEVELS.indexOf(zoom); if (i < ZOOM_LEVELS.length - 1) setZoom(ZOOM_LEVELS[i + 1]); }}
              disabled={zoom === ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              className="px-2 py-1.5 text-cu-text-secondary hover:bg-cu-hover disabled:opacity-40 transition-colors"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

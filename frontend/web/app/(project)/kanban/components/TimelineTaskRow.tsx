'use client';

import React from 'react';
import { format, isWeekend } from 'date-fns';
import { User, Diamond, Lock } from 'lucide-react';
import { Task } from '../types';
import { Milestone } from './TimelineView';

const statusColors = {
  TODO: { bar: 'bg-slate-500/95 hover:bg-slate-600', badge: 'bg-cu-bg-tertiary text-cu-text-secondary' },
  IN_PROGRESS: { bar: 'bg-blue-600/95 hover:bg-blue-700', badge: 'bg-blue-100 text-blue-700' },
  IN_REVIEW: { bar: 'bg-amber-500/95 hover:bg-amber-600', badge: 'bg-amber-100 text-amber-700' },
  DONE: { bar: 'bg-emerald-600/95 hover:bg-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
};

const priorityRings = {
  LOW: 'ring-1 ring-emerald-300',
  MEDIUM: 'ring-1 ring-amber-300',
  HIGH: 'ring-1 ring-orange-300',
  URGENT: 'ring-1 ring-red-300',
};

export interface TimelineTask extends Task {
  leftPx: number;
  widthPx: number;
  row: number;
  startDateObj: Date;
  dueDateObj: Date;
  durationDays: number;
}

function statusLabel(status: string | null | undefined) {
  return (status ?? '').replace(/_/g, ' ');
}

interface TimelineTaskRowProps {
  task: TimelineTask;
  visibleDays: Date[];
  dayColumnWidth: number;
  timelineWidthPx: number;
  todayOffset: number;
  milestones: Milestone[];
  isDragging: boolean;
  onOpenTask?: (taskId: number) => void;
  onStartDragMove: (e: React.MouseEvent, task: TimelineTask) => void;
  onStartDragResize: (e: React.MouseEvent, task: TimelineTask) => void;
  activeDragTaskId?: number;
}

export default function TimelineTaskRow({
  task, visibleDays, dayColumnWidth, timelineWidthPx,
  todayOffset, milestones, isDragging,
  onOpenTask, onStartDragMove, onStartDragResize, activeDragTaskId,
}: TimelineTaskRowProps) {
  const statusTheme = statusColors[task.status as keyof typeof statusColors] ?? statusColors.TODO;
  const priorityRing = priorityRings[task.priority as keyof typeof priorityRings] ?? '';
  const matchedMilestone = task.milestoneId != null
    ? milestones.find((ms) => ms.id === task.milestoneId)
    : null;
  const isBlocked = task.dependencies?.some(d => d.relation === 'BLOCKED_BY' && d.status !== 'DONE') ?? false;

  return (
    <div className="flex border-b border-cu-border-light hover:bg-cu-hover transition-colors">
      <div
        className="w-[300px] flex-shrink-0 p-3 border-r border-cu-border bg-cu-bg/95 backdrop-blur sticky left-0 z-10 cursor-pointer"
        onClick={() => onOpenTask?.(task.id)}
      >
        <p className="text-sm font-semibold text-cu-text-primary truncate hover:text-cu-primary transition-colors">{task.title}</p>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap">
          {isBlocked && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-500">
              <Lock size={10} className="flex-shrink-0" /> Blocked
            </span>
          )}
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusTheme.badge}`}>{statusLabel(task.status)}</span>
          {task.assigneeName && (
            <span className="inline-flex items-center gap-1 text-[11px] text-cu-text-tertiary">
              <User className="w-3 h-3" />{task.assigneeName}
            </span>
          )}
          {matchedMilestone && (
            <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700">
              <Diamond className="h-2.5 w-2.5 fill-current" />
              {matchedMilestone.name}
            </span>
          )}
        </div>
        <p className="mt-1.5 text-[11px] text-cu-text-muted">
          {format(task.startDateObj, 'MMM d')} – {format(task.dueDateObj, 'MMM d')} ({task.durationDays}d)
        </p>
        {task.dependencies && task.dependencies.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
            {task.dependencies.map((dep) => {
              const isDone = dep.status === 'DONE';
              const isBlockedBy = dep.relation === 'BLOCKED_BY';
              const text = isBlockedBy ? `Blocked by #${dep.id}` : `Blocks #${dep.id}`;
              const theme = isBlockedBy
                ? isDone
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400'
                  : 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/5 dark:text-amber-400 border border-amber-500/20'
                : isDone
                  ? 'bg-slate-100 text-slate-500 dark:bg-slate-800/40 dark:text-slate-400'
                  : 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/5 dark:text-blue-400 border border-blue-500/20';
              return (
                <button
                  key={`dep-chip-${task.id}-${dep.id}`}
                  onClick={() => onOpenTask?.(dep.id)}
                  title={`Open task #${dep.id}: ${dep.title}`}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-all hover:brightness-95 flex items-center gap-1 ${theme}`}
                >
                  {isBlockedBy && <Lock size={9} className="flex-shrink-0" />}
                  <span className={isDone ? 'line-through opacity-60' : ''}>{text}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative" style={{ width: `${timelineWidthPx}px`, height: '76px' }}>
        {visibleDays.map((day, idx) => (
          <div
            key={`grid-${task.id}-${day.toISOString()}`}
            className={`absolute top-0 h-full border-r border-cu-border-light ${isWeekend(day) ? 'bg-cu-primary/5' : 'bg-cu-bg'}`}
            style={{ left: `${idx * dayColumnWidth}px`, width: `${dayColumnWidth}px` }}
          />
        ))}

        {todayOffset >= 0 && todayOffset < visibleDays.length && (
          <div className="absolute top-0 h-full w-[2px] bg-red-400/70 z-[5]" style={{ left: `${todayOffset * dayColumnWidth}px` }} />
        )}

        {matchedMilestone?.dueDate ? (() => {
          const msIdx = visibleDays.findIndex((d) => format(d, 'yyyy-MM-dd') === matchedMilestone.dueDate);
          if (msIdx < 0) return null;
          return (
            <div
              key={`ms-${matchedMilestone.id}-${task.id}`}
              className="absolute top-1 z-[6] flex flex-col items-center"
              style={{ left: `${msIdx * dayColumnWidth + dayColumnWidth / 2 - 6}px` }}
              title={`Milestone: ${matchedMilestone.name}`}
            >
              <Diamond size={12} className="text-purple-500 fill-purple-500" />
            </div>
          );
        })() : null}

        <div
          className={`absolute top-1/2 -translate-y-1/2 h-10 rounded-lg text-white text-xs font-semibold shadow-sm transition-opacity select-none ${statusTheme.bar} ${priorityRing} ${isDragging ? 'opacity-80 shadow-lg' : ''}`}
          style={{ left: `${task.leftPx + 3}px`, width: `${task.widthPx}px`, cursor: 'grab' }}
          onMouseDown={(e) => onStartDragMove(e, task)}
          onClick={() => { if (!activeDragTaskId) onOpenTask?.(task.id); }}
          title={`${task.title} — drag to move`}
        >
          <span className="px-2 truncate flex items-center gap-1.5 leading-10">
            {isBlocked && <Lock size={11} className="flex-shrink-0 text-white" />}
            {task.title}
          </span>
          <div
            className="absolute right-0 top-0 h-full w-[6px] rounded-r-lg cursor-ew-resize hover:bg-white/20"
            onMouseDown={(e) => { e.stopPropagation(); onStartDragResize(e, task); }}
            title="Drag to resize"
          />
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, GripVertical, Trash2, UserPlus } from 'lucide-react';
import AssigneeAvatar from '../AssigneeAvatar';
import { STATUS_LABELS, type TaskStatus } from './TaskRowConstants';
import type { TaskRowProps } from '../TaskRow';
import { useTaskRowState } from './useTaskRowState';
import { formatDate } from './TaskRowConstants';

// ── Mobile Task Row ──────────────────────────────────────────────────────────

export default function MobileTaskRow(props: TaskRowProps) {
  const {
    task, teamMembers = [], onStatusChange, onStoryPointsChange,
    onAssignTask, onDueDateChange, onDeleteTask,
    canDelete = true, projectLabels = [], onAddLabel, onRemoveLabel, onCreateLabel, extraStatuses = [],
    hideStatus = false,
  } = props;

  const {
    statusRef, assignRef, dateRef,
    statusPortalRef, assignPortalRef,
    lastTapRef,
    statusOpen, setStatusOpen,
    assignOpen, setAssignOpen,
    renaming, setRenaming,
    renameValue, setRenameValue,
    statusPosition, assignPosition,
    onTouchStartInternal, onTouchEndInternal, onTouchMoveInternal,
    startRename, updateLastTap, commitRename,
    openStatus, openAssign, openDatePicker,
    displayLabel, displayStyle, dueClass, statusBorderColor, priorityKey, priorityStyle,
  } = useTaskRowState(task, {
    canDelete, onDeleteTask, onRenameTask: props.onRenameTask,
    onAddLabel, onRemoveLabel, onCreateLabel, extraStatuses, projectLabels,
  });

  const amberStyle = dueClass === 'five_days' ? { backgroundColor: 'rgba(245, 158, 11, 0.15)' } : {};

  return (
    <div
      className={`group relative flex flex-col rounded-xl border border-[#EAECF0] border-l-[4px] shadow-sm hover:shadow transition-shadow duration-150 mb-1.5 select-none overflow-hidden ${
        dueClass === 'five_days' ? 'bg-amber-50/60' : 'bg-white'
      }`}
      style={{ borderLeftColor: statusBorderColor, ...amberStyle }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex items-center w-full min-h-[44px]">

        {/* Drag Handle */}
        <div className="flex flex-shrink-0 items-center justify-center w-5 self-stretch text-[#D0D5DD] hover:text-[#98A2B3] cursor-grab transition-colors">
          <GripVertical size={13} />
        </div>

        {/* Title */}
        <div className="flex flex-1 min-w-0 items-center py-2 pr-2 border-r border-[#F2F4F7]">
          {renaming ? (
            <div className="flex-1 min-w-0">
              <input
                type="text"
                maxLength={255}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void commitRename();
                  if (e.key === 'Escape') setRenaming(false);
                }}
                onBlur={() => void commitRename()}
                autoFocus
                onClick={(e) => e.stopPropagation()}
                className="w-full border-b border-[#175CD3] bg-transparent text-[13px] font-semibold text-[#101828] outline-none"
              />
              {renameValue.length > 200 && (
                <p className="text-[10px] text-amber-500 mt-0.5">{255 - renameValue.length} chars left</p>
              )}
            </div>
          ) : (
            <h3
              onClick={(e) => {
                e.stopPropagation();
                const now = Date.now();
                if (now - lastTapRef.current < 300) startRename(e as unknown as React.MouseEvent);
                updateLastTap(now);
              }}
              onDoubleClick={(e) => { e.stopPropagation(); startRename(e as unknown as React.MouseEvent); }}
              onTouchStart={onTouchStartInternal}
              onTouchEnd={onTouchEndInternal}
              onTouchMove={onTouchMoveInternal}
              className={`flex-1 min-w-0 text-[13px] font-semibold leading-snug truncate cursor-text select-none ${
                dueClass === 'five_days'
                  ? 'text-amber-800'
                  : task.status?.toUpperCase() === 'DONE'
                  ? 'line-through text-[#B0B8C8]'
                  : 'text-[#1A1F2E]'
              }`}
            >
              {task.title}
            </h3>
          )}
        </div>

        {/* Scrollable Metadata */}
        <div className="flex items-center gap-1.5 px-2 overflow-x-auto no-scrollbar [scrollbar-width:none] [-webkit-overflow-scrolling:touch]">

          {/* Priority → Status → Delete */}
          <div className="flex-shrink-0 flex items-center gap-1.5 border-r border-[#F2F4F7] pr-2" onClick={(e) => e.stopPropagation()}>
            {/* Priority pill */}
            <span className={`flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${priorityStyle}`}>
              {priorityKey}
            </span>
            {/* Status */}
            {!hideStatus && (
              <div ref={statusRef}>
                <button
                  type="button"
                  onClick={() => openStatus()}
                  className={`flex h-[26px] min-w-[78px] items-center justify-center gap-1 rounded-md px-2 text-[10px] font-semibold uppercase tracking-wide transition-all active:scale-95 ${displayStyle}`}
                >
                  <span className="truncate">{displayLabel}</span>
                  <ChevronDown size={8} className="opacity-50 flex-shrink-0" />
                </button>
              </div>
            )}
            {/* Delete */}
            <button
              type="button"
              onClick={() => canDelete && onDeleteTask(task.id)}
              className="flex h-[26px] w-[26px] items-center justify-center rounded-md text-[#C1C9D4] hover:text-[#F04438] hover:bg-[#FEF3F2] active:scale-90 transition-all"
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* Assignee */}
          <div className="flex-shrink-0 flex items-center" ref={assignRef} onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => openAssign()} className="flex items-center active:scale-90 transition-transform">
              {task.assigneeName && task.assigneeName !== 'Unassigned' ? (
                <AssigneeAvatar name={task.assigneeName} profilePicUrl={task.assigneePhotoUrl} size={22} />
              ) : (
                <div className="flex h-[26px] w-[26px] items-center justify-center rounded-full border border-dashed border-[#D0D5DD] text-[#C1C9D4]">
                  <UserPlus size={11} />
                </div>
              )}
            </button>
          </div>

          {/* Points */}
          <div className="flex-shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <input
              type="number"
              value={task.storyPoints}
              title="Story Points"
              onChange={(e) => onStoryPointsChange(task.id, Number(e.target.value))}
              className="text-[11px] font-semibold text-[#344054] bg-[#F2F4F7] rounded-md px-1 outline-none w-8 text-center h-[26px] border-0"
            />
          </div>

          {/* Due Date */}
          {onDueDateChange && (
            <div className="flex-shrink-0 flex items-center" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={openDatePicker}
                title={formatDate(task.dueDate)}
                className={`text-[10px] font-semibold whitespace-nowrap px-2 rounded-md h-[26px] transition-colors ${
                  dueClass === 'overdue' || dueClass === 'old'
                    ? 'text-[#F04438] bg-[#FEF3F2]'
                    : 'text-[#667085] bg-[#F2F4F7]'
                }`}
              >
                {dueClass === 'overdue' ? 'Overdue' : formatDate(task.dueDate)}
              </button>
              <input
                ref={dateRef}
                type="date"
                value={task.dueDate || ''}
                onChange={(e) => onDueDateChange(task.id, e.target.value)}
                className="sr-only"
              />
            </div>
          )}
        </div>
      </div>

      {/* Status Portal */}
      {!hideStatus && statusOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={statusPortalRef}
          style={{ position: 'fixed', top: `${statusPosition.top}px`, left: `${statusPosition.left}px`, width: '156px' }}
          className="z-[9999] overflow-hidden rounded-xl border border-[#E4E7EC] bg-white shadow-lg animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 pt-2.5 pb-1.5 text-[10px] font-bold text-[#98A2B3] uppercase tracking-widest border-b border-[#F2F4F7]">
            Change Status
          </div>
          <div className="max-h-[220px] overflow-y-auto p-1">
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <button
                key={s}
                onClick={() => { onStatusChange(task.id, s); setStatusOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors ${
                  task.status?.toUpperCase() === s
                    ? 'bg-[#EFF8FF] text-[#175CD3] font-semibold'
                    : 'text-[#344054] hover:bg-[#F9FAFB]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{
                  background: task.status?.toUpperCase() === s ? '#175CD3' : '#D0D5DD'
                }} />
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}

      {/* Assignee Portal */}
      {assignOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={assignPortalRef}
          style={{ position: 'fixed', top: `${assignPosition.top}px`, left: `${assignPosition.left}px`, width: 'max-content', minWidth: '196px' }}
          className="z-[9999] overflow-hidden rounded-xl border border-[#E4E7EC] bg-white shadow-lg animate-in fade-in zoom-in-95 duration-150"
        >
          <div className="px-3 pt-2.5 pb-1.5 text-[10px] font-bold text-[#98A2B3] uppercase tracking-widest border-b border-[#F2F4F7]">
            Assign To
          </div>
          <div className="max-h-[240px] overflow-y-auto p-1">
            {teamMembers.map((m) => (
              <button
                key={m.user.userId}
                onClick={() => { void onAssignTask(task.id, m.user.userId); setAssignOpen(false); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-[12px] font-medium text-[#344054] hover:bg-[#F9FAFB] rounded-lg transition-colors"
              >
                <AssigneeAvatar name={m.user.fullName || m.user.username} profilePicUrl={m.user.profilePicUrl} size={22} />
                <span className="truncate">{m.user.fullName || m.user.username}</span>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

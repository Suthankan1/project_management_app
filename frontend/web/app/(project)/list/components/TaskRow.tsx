'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Archive, CalendarDays, ChevronDown, Minus, MoreHorizontal, Plus, Lock, RefreshCw, RotateCcw } from 'lucide-react';
import { hexToLabelStyle } from '@/components/shared/LabelPicker';
import { AvatarStack } from '@/components/ui/Avatar';
import { tasksApi } from '@/services/tasks-contract';
import type { Label, MilestoneResponse, Task } from '@/types';
import { PRIORITY_CONFIG, STATUS_CONFIG, STATUS_ORDER } from '../lib/list-config';
import { resolveProfilePhotoUrl } from '@/lib/profile-photo';


const PRIORITY_ORDER = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

const TaskRow = React.memo(function TaskRow({
  task,
  onOpenModal,
  onStatusChange,
  onDelete,
  onArchive,
  onRestore,
  onTaskUpdated,
  members,
  availableLabels,
  milestones,
  onDueDateChange,
  onAssigneesChange,
  onToggleLabel,
  onMilestoneChange,
  selected = false,
  onToggleSelect,
  projectStatuses,
  canModifyTasks = true,
  showArchived = false,
}: {
  task: Task;
  onOpenModal: (id: number) => void;
  onStatusChange: (id: number, status: string) => void;
  onDelete: (id: number) => void;
  onArchive: (id: number) => void;
  onRestore: (id: number) => void;
  onTaskUpdated?: (taskId: number, updates: Partial<Task>) => void;
  members: Array<{ id: number; name: string; photoUrl?: string | null }>;
  availableLabels: Label[];
  milestones: MilestoneResponse[];
  onDueDateChange: (taskId: number, dueDate: string | null) => void;
  onAssigneesChange: (taskId: number, assigneeIds: number[]) => void;
  onToggleLabel: (taskId: number, label: Label, shouldAttach: boolean) => void;
  onMilestoneChange: (taskId: number, milestoneId: number | null) => void;
  selected?: boolean;
  onToggleSelect?: (taskId: number) => void;
  projectStatuses?: Array<{ name: string; status: string; color: string }>;
  canModifyTasks?: boolean;
  showArchived?: boolean;
}) {
  const [statusOpen, setStatusOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [milestoneOpen, setMilestoneOpen] = useState(false);
  const [localPriority, setLocalPriority] = useState(task.priority ?? '');
  const statusRef = useRef<HTMLDivElement>(null);
  const priorityRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const assigneeRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const milestoneRef = useRef<HTMLDivElement>(null);
  const assigneeMenuRef = useRef<HTMLDivElement>(null);
  const labelsMenuRef = useRef<HTMLDivElement>(null);
  const milestoneMenuRef = useRef<HTMLDivElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const assigneePhotoUrl = resolveProfilePhotoUrl(task.assigneePhotoUrl, task.assigneeId);
  const assignedUsers = (task.assignees && task.assignees.length > 0)
    ? task.assignees.map((person) => ({ name: person.name, src: resolveProfilePhotoUrl(person.avatar, person.id) }))
    : task.assigneeName
      ? [{ name: task.assigneeName, src: assigneePhotoUrl }]
      : [];

  const currentStatus = projectStatuses?.find((s: { status: string; name: string; color: string }) => s.status === task.status) || { name: task.status, status: task.status, color: STATUS_CONFIG[task.status]?.badge || 'bg-gray-100 text-gray-600' };
  
  const sConf = STATUS_CONFIG[task.status] ?? { label: currentStatus.name, badge: currentStatus.color };
  const pConf = localPriority ? PRIORITY_CONFIG[localPriority] : null;
  const PriorityIcon = pConf?.icon ?? Minus;
  const priorityColor = pConf?.color ?? '#9CA3AF';

  const isOverdue = !!(
    task.dueDate &&
    task.status !== 'DONE' &&
    new Date(task.dueDate + 'T00:00:00') < new Date(new Date().toDateString())
  );

  const isBlocked = task.dependencies?.some(d => d.relation === 'BLOCKED_BY' && d.status !== 'DONE') ?? false;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
      if (priorityRef.current && !priorityRef.current.contains(e.target as Node)) setPriorityOpen(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (assigneeRef.current && !assigneeRef.current.contains(e.target as Node)) setAssigneeOpen(false);
      if (labelsRef.current && !labelsRef.current.contains(e.target as Node)) setLabelsOpen(false);
      if (milestoneRef.current && !milestoneRef.current.contains(e.target as Node)) setMilestoneOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setStatusOpen(false);
        setPriorityOpen(false);
        setMenuOpen(false);
        setAssigneeOpen(false);
        setLabelsOpen(false);
        setMilestoneOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  const handlePriorityChange = async (priority: string) => {
    setLocalPriority(priority);
    setPriorityOpen(false);
    await tasksApi.updatePriority(task.id, priority as 'LOW' | 'NORMAL' | 'MEDIUM' | 'HIGH' | 'URGENT').catch(() => {});
    onTaskUpdated?.(task.id, { priority });
  };

  const focusFirstDropdownItem = (container: HTMLDivElement | null) => {
    const first = container?.querySelector<HTMLButtonElement>('button');
    first?.focus();
  };

  const handleDropdownListKeyDown = (
    e: React.KeyboardEvent<HTMLDivElement>,
    close: () => void,
  ) => {
    const items = Array.from(
      e.currentTarget.querySelectorAll<HTMLButtonElement>('button')
    );
    if (items.length === 0) return;
    const currentIndex = items.findIndex((btn) => btn === document.activeElement);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
      items[nextIndex]?.focus();
      return;
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
      items[nextIndex]?.focus();
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };

  useEffect(() => {
    if (labelsOpen) focusFirstDropdownItem(labelsMenuRef.current);
  }, [labelsOpen]);

  useEffect(() => {
    if (milestoneOpen) focusFirstDropdownItem(milestoneMenuRef.current);
  }, [milestoneOpen]);

  useEffect(() => {
    if (assigneeOpen) focusFirstDropdownItem(assigneeMenuRef.current);
  }, [assigneeOpen]);

  return (
    <div
      className={`flex items-center gap-2 px-4 min-h-[42px] border-b border-cu-border cursor-pointer transition-colors group ${
        selected ? 'bg-cu-primary/5' : 'bg-cu-bg hover:bg-cu-hover'
      }`}
      onClick={() => { if (!statusOpen && !priorityOpen && !menuOpen && !assigneeOpen && !labelsOpen && !milestoneOpen) onOpenModal(task.id); }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !statusOpen && !priorityOpen && !menuOpen && !assigneeOpen && !labelsOpen && !milestoneOpen) {
          e.preventDefault();
          onOpenModal(task.id);
        }
      }}
      tabIndex={0}
    >
      <div className="w-6 shrink-0 flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect?.(task.id)}
          className="h-4 w-4 rounded border-cu-border accent-cu-primary cursor-pointer"
          aria-label={`Select ${task.title}`}
        />
      </div>

      {/* Priority bar */}
      <span className="w-1.5 h-6 rounded-full shrink-0" style={{ background: priorityColor }} />

      {/* Priority dropdown */}
      <div className="w-16 shrink-0 hidden lg:flex items-center relative" ref={priorityRef} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setPriorityOpen((v) => !v)}
          className="flex items-center gap-1 w-full hover:bg-cu-hover rounded px-1 py-0.5"
        >
          <PriorityIcon size={12} color={priorityColor} className="shrink-0" />
          <span className="text-[11px] font-medium truncate" style={{ color: priorityColor }}>
            {pConf?.label ?? '—'}
          </span>
        </button>
        {priorityOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-cu-bg border border-cu-border rounded-xl shadow-lg py-1 min-w-[120px]">
            {PRIORITY_ORDER.map((p) => {
              const pc = PRIORITY_CONFIG[p];
              const Icon = pc.icon;
              return (
                <button
                  key={p}
                  onClick={() => void handlePriorityChange(p)}
                  className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-cu-hover transition-colors flex items-center gap-2 ${localPriority === p ? 'font-semibold' : ''}`}
                >
                  <Icon size={12} color={pc.color} />
                  <span style={{ color: pc.color }}>{pc.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Title */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <p className="text-[13px] font-medium truncate text-cu-text-primary">
          {task.title}
        </p>
        {task.recurrenceRule && (
          <span
            className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
              task.recurrenceActive === false
                ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30'
                : 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30'
            }`}
            title={task.recurrenceActive === false ? 'Recurring (Paused)' : `Recurring (${task.recurrenceRule})`}
          >
            <RefreshCw size={9} className="flex-shrink-0" />
            <span>Recurring{task.recurrenceActive === false ? ' (Paused)' : ''}</span>
          </span>
        )}
        {isBlocked && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-500 shrink-0">
            <Lock size={9} className="flex-shrink-0" /> Blocked
          </span>
        )}
        {task.archived && (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-cu-bg-tertiary text-cu-text-secondary shrink-0">
            <Archive size={9} className="flex-shrink-0" /> Archived
          </span>
        )}
      </div>

      {/* Labels */}
      <div className="w-32 shrink-0 hidden lg:block relative" ref={labelsRef} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setLabelsOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setLabelsOpen(true);
            }
          }}
          className="w-full flex items-center gap-1 hover:bg-cu-hover rounded px-1.5 py-1"
          aria-label="Edit labels"
        >
          <div className="flex gap-1 overflow-hidden">
            {task.labels && task.labels.length > 0
              ? task.labels.slice(0, 2).map((l) => (
                  <span key={l.id} style={hexToLabelStyle(l.color ?? '#6366F1')} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium whitespace-nowrap">
                    {l.name}
                  </span>
                ))
              : <span className="text-[11px] text-cu-text-muted">Tags</span>
            }
          </div>
          <Plus size={11} className="text-cu-text-muted" />
        </button>
        {labelsOpen && (
          <div
            ref={labelsMenuRef}
            onKeyDown={(e) => handleDropdownListKeyDown(e, () => setLabelsOpen(false))}
            className="absolute top-full left-0 mt-1 z-50 bg-cu-bg border border-cu-border rounded-xl shadow-lg py-1 min-w-[180px] max-h-56 overflow-y-auto"
          >
            {availableLabels.map((label) => {
              const attached = Boolean(task.labels?.some((l) => l.id === label.id));
              return (
                <button
                  key={label.id}
                  onClick={() => {
                    onToggleLabel(task.id, label, !attached);
                    setLabelsOpen(false);
                  }}
                  className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-cu-hover flex items-center justify-between gap-2"
                >
                  <span style={hexToLabelStyle(label.color ?? '#6366F1')} className="px-1.5 py-0.5 rounded-full text-[10px] font-medium">
                    {label.name}
                  </span>
                  {attached ? <span className="text-cu-primary text-[11px] font-semibold">Added</span> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Milestone */}
      <div className="w-32 shrink-0 hidden xl:block relative" ref={milestoneRef} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMilestoneOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setMilestoneOpen(true);
            }
          }}
          className="w-full text-left hover:bg-cu-hover rounded px-1.5 py-1"
          aria-label="Edit milestone"
        >
          {task.milestoneName
            ? <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-500/10 text-purple-500 border border-purple-500/20 truncate max-w-full">
                {task.milestoneName}
              </span>
            : <span className="text-[11px] text-cu-text-muted">Milestone</span>
          }
        </button>
        {milestoneOpen && (
          <div
            ref={milestoneMenuRef}
            onKeyDown={(e) => handleDropdownListKeyDown(e, () => setMilestoneOpen(false))}
            className="absolute top-full left-0 mt-1 z-50 bg-cu-bg border border-cu-border rounded-xl shadow-lg py-1 min-w-[180px] max-h-56 overflow-y-auto"
          >
            <button onClick={() => { onMilestoneChange(task.id, null); setMilestoneOpen(false); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-cu-hover text-cu-text-muted">
              No milestone
            </button>
            {milestones.map((m) => (
              <button
                key={m.id}
                onClick={() => { onMilestoneChange(task.id, m.id); setMilestoneOpen(false); }}
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-cu-hover text-cu-text-primary"
              >
                {m.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Assignee */}
      <div className="w-32 shrink-0 hidden md:block relative" ref={assigneeRef} onClick={(e) => e.stopPropagation()}>
        <button
          className="w-full flex items-center gap-1.5 overflow-hidden hover:bg-cu-hover rounded px-1.5 py-1"
          onClick={() => setAssigneeOpen((v) => !v)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setAssigneeOpen(true);
            }
          }}
          aria-label="Edit assignee"
        >
          {assignedUsers.length > 0 ? (
            <>
              <AvatarStack users={assignedUsers} size="xs" max={3} />
              <span className="text-[11px] text-cu-text-secondary truncate">{assignedUsers[0]?.name}{assignedUsers.length > 1 ? ` +${assignedUsers.length - 1}` : ''}</span>
            </>
          ) : (
            <span className="text-[11px] text-cu-text-muted">Assignee</span>
          )}
        </button>
        {assigneeOpen && (
          <div
            ref={assigneeMenuRef}
            onKeyDown={(e) => handleDropdownListKeyDown(e, () => setAssigneeOpen(false))}
            className="absolute top-full left-0 mt-1 z-50 bg-cu-bg border border-cu-border rounded-xl shadow-lg py-1 min-w-[180px] max-h-56 overflow-y-auto"
          >
            <button onClick={() => { onAssigneesChange(task.id, []); setAssigneeOpen(false); }} className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-cu-hover text-cu-text-muted">
              Unassigned
            </button>
            {members.map((member) => (
              <button
                key={member.id}
                onClick={() => {
                  const existingIds = (task.assignees ?? []).map((person) => person.id).filter(Boolean) as number[];
                  const has = existingIds.includes(member.id);
                  const nextIds = has ? existingIds.filter((id) => id !== member.id) : [...existingIds, member.id];
                  onAssigneesChange(task.id, nextIds);
                  setAssigneeOpen(false);
                }}
                className="w-full text-left px-3 py-1.5 text-[12px] hover:bg-cu-hover text-cu-text-primary flex items-center justify-between"
              >
                {member.name}
                {(task.assignees ?? []).some((person) => person.id === member.id) ? <span className="text-cu-primary font-semibold">Added</span> : null}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="w-28 shrink-0 relative" ref={statusRef} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setStatusOpen((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium w-full justify-between ${sConf.badge}`}
        >
          <span className="truncate">{sConf.label}</span>
          <ChevronDown size={10} className="shrink-0" />
        </button>
        {statusOpen && (
          <div className="absolute top-full left-0 mt-1 z-50 bg-cu-bg border border-cu-border rounded-xl shadow-lg py-1 min-w-[130px]">
            {projectStatuses && projectStatuses.length > 0 ? (
              projectStatuses.map((s: { status: string; name: string; color: string }) => (
                <button
                  key={s.status}
                  onClick={() => { onStatusChange(task.id, s.status); setStatusOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-cu-hover transition-colors ${task.status === s.status ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
                >
                  {s.name}
                </button>
              ))
            ) : (
              STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  onClick={() => { onStatusChange(task.id, s); setStatusOpen(false); }}
                  className={`w-full text-left px-3 py-1.5 text-[12px] hover:bg-cu-hover transition-colors ${task.status === s ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
                >
                  {STATUS_CONFIG[s]?.label ?? s}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* Due date */}
      <div className="w-24 shrink-0 hidden sm:block" onClick={(e) => e.stopPropagation()}>
        <button
          className={`inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded-full border ${
            isOverdue
              ? 'bg-red-500/10 text-red-500 border-red-500/30'
              : 'bg-cu-bg-secondary text-cu-text-secondary border-cu-border'
          }`}
          onClick={() => dateInputRef.current?.showPicker?.() ?? dateInputRef.current?.click()}
          aria-label="Edit due date"
        >
          <CalendarDays size={11} />
          {task.dueDate
            ? new Date(task.dueDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : 'Set date'}
        </button>
        <input
          ref={dateInputRef}
          type="date"
          className="sr-only"
          value={task.dueDate ?? ''}
          onChange={(e) => onDueDateChange(task.id, e.target.value || null)}
        />
      </div>

      {/* Actions menu */}
      <div className="w-8 shrink-0 relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="p-1 rounded hover:bg-cu-hover text-cu-text-muted transition-colors"
        >
          <MoreHorizontal size={14} />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-cu-bg border border-cu-border rounded-xl shadow-lg py-1 min-w-[120px]">
            <button
              onClick={() => { setMenuOpen(false); onOpenModal(task.id); }}
              className="w-full text-left px-3 py-1.5 text-[12px] text-cu-text-primary hover:bg-cu-hover transition-colors"
            >
              Edit
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                if (showArchived) {
                  if (window.confirm(`Restore "${task.title}" to active tasks?`)) onRestore(task.id);
                } else if (window.confirm(`Archive "${task.title}"? You can restore it from Archived Tasks.`)) {
                  onArchive(task.id);
                }
              }}
              disabled={!canModifyTasks}
              title={!canModifyTasks ? 'Viewers cannot archive or restore tasks' : showArchived ? 'Restore task' : 'Archive task'}
              className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors flex items-center gap-2 ${
                canModifyTasks ? 'text-cu-text-primary hover:bg-cu-hover' : 'text-cu-text-muted cursor-not-allowed'
              }`}
            >
              {showArchived ? <RotateCcw size={12} /> : <Archive size={12} />}
              {showArchived ? 'Restore' : 'Archive'}
            </button>
            <button
              onClick={() => { setMenuOpen(false); onDelete(task.id); }}
              disabled={!canModifyTasks}
              title={!canModifyTasks ? 'Viewers cannot delete tasks' : 'Delete task'}
              className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${
                canModifyTasks ? 'text-cu-danger hover:bg-cu-danger/10' : 'text-cu-text-muted cursor-not-allowed'
              }`}
            >
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

export default TaskRow;

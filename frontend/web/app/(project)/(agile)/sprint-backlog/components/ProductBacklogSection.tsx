'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  CornerDownLeft,
  Rocket,
} from 'lucide-react';
import CreateTaskModal, { type CreateTaskData } from '@/components/shared/CreateTaskModal';
import type { TaskItem } from '@/types';
import api from '@/lib/axios';
import { toast } from '@/components/ui';
import TaskRow from './TaskRow';
import TaskCardModal from '@/app/taskcard/TaskCardModal';
import ConfirmModal from './backlog-card/ConfirmModal';
import { motion, AnimatePresence } from 'framer-motion';

interface TeamMemberInfo {
  id: number;
  user: { userId: number; fullName: string; username: string; profilePicUrl?: string | null };
}

interface ProductBacklogSectionProps {
  tasks: TaskItem[];
  projectId: string;
  projectKey: string;
  sprintCount: number;
  currentUserRole?: string | null;
  onToggleTask: (id: number) => void;
  onStoryPointsChange: (id: number, points: number) => void;
  onCreateTask: (data: CreateTaskData) => Promise<void>;
  onDeleteTask?: (id: number) => void;
  onCreateSprint: () => void;
  onDropTask: (taskId: number, targetIndex?: number) => void;
  onAssignTask: (taskId: number, assigneeName: string, assigneePhotoUrl: string | null) => void;
  onStatusChange: (taskId: number, status: string) => void;
  onDueDateChange?: (taskId: number, dueDate: string) => Promise<void>;
  onRenameTask?: (taskId: number, title: string) => void;
  externalShowCreateModal?: boolean;
  onCloseCreateModal?: () => void;
  projectLabels?: Array<{ id: number; name: string; color?: string }>;
  onCreateLabel?: (name: string) => Promise<{ id: number; name: string; color?: string }>;
}



export default function ProductBacklogSection({
  tasks,
  projectId,
  projectKey,
  sprintCount: _sprintCount,
  currentUserRole,
  onToggleTask: _onToggleTask,
  onStoryPointsChange,
  onCreateTask,
  onDeleteTask,
  onCreateSprint,
  onDropTask,
  onAssignTask,
  onStatusChange,
  onDueDateChange,
  onRenameTask,
  externalShowCreateModal,
  onCloseCreateModal,
  projectLabels = [],
  onCreateLabel,
}: ProductBacklogSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showCreateModalInternal, setShowCreateModalInternal] = useState(false);

  // Sync external modal state with internal state and expand section
  const showCreateModal = externalShowCreateModal ?? showCreateModalInternal;
  const setShowCreateModal = (val: boolean) => {
    if (onCloseCreateModal && !val) {
      onCloseCreateModal();
    } else {
      setShowCreateModalInternal(val);
    }
  };

  useEffect(() => {
    if (externalShowCreateModal) {
      setIsOpen(true);
    }
  }, [externalShowCreateModal]);

  const [taskToDeleteId, setTaskToDeleteId] = useState<number | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberInfo[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [labelCache, setLabelCache] = useState<Record<number, Array<{ id: number; name: string; color?: string }>>>({});
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [showCreateTaskBox, setShowCreateTaskBox] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskTitleLength, setNewTaskTitleLength] = useState(0);
  const [dropIndex, setDropIndex] = useState<number | null>(null);

  const canDeleteTask = currentUserRole !== 'VIEWER';

  const getMemberDisplayName = (member: TeamMemberInfo) => member.user.fullName || member.user.username;

  useEffect(() => {
    void fetchTeamMembers(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);
  const fetchTeamMembers = async (showError = true) => {
    if (loadingMembers) return;

    try {
      setLoadingMembers(true);
      const projectRes = await api.get(`/api/projects/${projectId}`);
      const teamId = projectRes.data.teamId;
      const membersRes = await api.get(`/api/teams/${teamId}/members`);
      const data = membersRes.data;
      setTeamMembers(Array.isArray(data) ? data : []);
    } catch {
      if (showError) {
        toast('Failed to load team members.', 'error');
      }
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAssignTask = async (taskId: number, userId: number) => {
    try {
      await api.patch(`/api/tasks/${taskId}/assign/${userId}`);
      const member = teamMembers.find((m) => m.user.userId === userId);
      if (member) {
        onAssignTask(taskId, getMemberDisplayName(member), member.user.profilePicUrl || null);
      }
    } catch {
      toast('Failed to assign task.', 'error');
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (onDeleteTask) onDeleteTask(taskId);
    try {
      await api.delete(`/api/tasks/${taskId}`);
    } catch {
      // silent — parent state was already updated optimistically
    }
  };

  const handleRenameTask = async (taskId: number, title: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;
    if (onRenameTask) onRenameTask(taskId, trimmed);
    else {
      try {
        await api.put(`/api/tasks/${taskId}`, { title: trimmed });
      } catch {
        // silent
      }
    }
  };

  const handleAddLabel = async (taskId: number, labelId: number) => {
    try {
      await api.post(`/api/tasks/${taskId}/label/${labelId}`);
      const label = projectLabels.find((l) => l.id === labelId);
      if (label) {
        setLabelCache((prev) => {
          const existing = prev[taskId] ?? tasks.find((t) => t.id === taskId)?.labels ?? [];
          if (existing.some((l) => l.id === labelId)) return prev;
          return { ...prev, [taskId]: [...existing, label] };
        });
      }
    } catch {
      // silent
    }
  };

  const handleRemoveLabel = async (taskId: number, labelId: number) => {
    try {
      await api.delete(`/api/tasks/${taskId}/label/${labelId}`);
      setLabelCache((prev) => {
        const existing = prev[taskId] ?? tasks.find((t) => t.id === taskId)?.labels ?? [];
        return { ...prev, [taskId]: existing.filter((l) => l.id !== labelId) };
      });
    } catch {
      // silent
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropIndex(null);
    const taskId = Number(e.dataTransfer.getData('text/plain'));
    if (taskId) {
      onDropTask(taskId);
    }
  };

  const handleDropAtIndex = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDropIndex(null);
    const taskId = Number(e.dataTransfer.getData('text/plain'));
    if (taskId) {
      onDropTask(taskId, index);
    }
  };

  const totals = useMemo(() => {
    const total = tasks.reduce((sum, task) => sum + (task.storyPoints ?? 0), 0);
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'IN_REVIEW').length;
    const done = tasks.filter(t => t.status === 'DONE').length;
    return { total, inProgress, done, count: tasks.length };
  }, [tasks]);

  return (
    <div className="rounded-xl border border-cu-border bg-cu-bg-secondary p-4 sm:p-5 shadow-cu-sm">
<div className="mb-3 flex min-h-10 flex-wrap items-center justify-between border-b border-cu-border pb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="flex-shrink-0 text-cu-text-secondary hover:text-cu-text-primary hover:bg-cu-hover p-0.5 rounded transition-colors"
          >
            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <span className="text-[14px] font-bold text-cu-text-primary truncate">Backlog</span>
          <span className="flex-shrink-0 rounded-full bg-cu-bg-tertiary px-2 py-0.5 text-[12px] font-bold text-cu-text-secondary">
            {totals.count}
          </span>
          {totals.total > 0 && (
            <span className="flex-shrink-0 rounded-full border border-cu-border bg-cu-bg px-2 py-0.5 text-[12px] font-semibold text-cu-text-primary hidden sm:inline">
              {totals.total} pts
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => { setIsOpen(true); setShowCreateTaskBox(true); }}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-cu-border bg-cu-bg px-3 py-1.5 text-[12px] font-bold text-cu-text-primary hover:bg-cu-hover shadow-cu-sm transition-all active:scale-95"
          >
            <span className="text-[14px] leading-none">+</span>
            <span>Task</span>
          </button>
          <button
            onClick={() => onCreateSprint()}
            className="flex min-h-[44px] items-center gap-1.5 rounded-lg border border-cu-primary bg-cu-primary px-3 py-1.5 text-[12px] font-bold text-white hover:bg-cu-primary-hover shadow-cu-sm transition-all active:scale-95"
          >
            <Rocket size={14} />
            <span>Create Sprint</span>
          </button>
        </div>
      </div>

      {isOpen && (
        <div>
          <motion.div layout className="flex flex-col gap-[5px]" onDragOver={(e) => { e.preventDefault(); setDropIndex(tasks.length); }} onDrop={handleDrop}>
            <AnimatePresence initial={false}>
              {tasks.map((task, index) => (
                <div key={task.id}>
                  {dropIndex === index && (
                    <motion.div
                      layout
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 44, opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="rounded-lg border-2 border-dashed border-cu-primary bg-cu-primary/5 mb-[5px]"
                    />
                  )}
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30, mass: 1 }}
                    className="rounded-lg overflow-hidden border border-cu-border"
                  >
                    <div
                      draggable
                      onDragStart={(e: React.DragEvent<HTMLDivElement>) => {
                        e.dataTransfer.setData('text/plain', String(task.id));
                        (e.target as HTMLElement).style.opacity = '0.5';
                      }}
                      onDragEnd={(e: React.DragEvent<HTMLDivElement>) => {
                        (e.target as HTMLElement).style.opacity = '1';
                        setDropIndex(null);
                      }}
                      onDragOver={(e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setDropIndex(index); }}
                      onDrop={(e: React.DragEvent<HTMLDivElement>) => handleDropAtIndex(e, index)}
                    >
                      <TaskRow
                        task={{ ...task, status: task.status ?? 'TODO', labels: labelCache[task.id] ?? task.labels ?? [] }}
                        teamMembers={teamMembers}
                        loadingMembers={loadingMembers}
                        canDelete={canDeleteTask}
                        showCheckbox={false}
                        hideStatus={true}
                        onStatusChange={(id, status) => onStatusChange(id, status)}
                        onStoryPointsChange={onStoryPointsChange}
                        onRenameTask={handleRenameTask}
                        onAssignTask={handleAssignTask}
                        onDueDateChange={(taskId, dueDate) => { void onDueDateChange?.(taskId, dueDate); }}
                        onDeleteTask={(id) => setTaskToDeleteId(id)}
                        onOpenTask={(id) => setSelectedTaskId(id)}
                      projectLabels={projectLabels}
                      onAddLabel={handleAddLabel}
                      onRemoveLabel={handleRemoveLabel}
                      onCreateLabel={onCreateLabel}
                      onMoveUp={() => onDropTask(task.id, Math.max(0, index - 1))}
                      onMoveDown={() => onDropTask(task.id, Math.min(tasks.length, index + 2))}
                      projectKey={projectKey}
                    />
                  </div>
                </motion.div>
                </div>
              ))}
            </AnimatePresence>
            {dropIndex === tasks.length && tasks.length > 0 && (
              <motion.div
                layout
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 44, opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="rounded-lg border-2 border-dashed border-cu-primary bg-cu-primary/5"
              />
            )}
          </motion.div>


           {/* ── Inline Create Task ── */}
          {showCreateTaskBox && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newTaskTitle.trim()) { setShowCreateTaskBox(false); setNewTaskTitle(''); setNewTaskTitleLength(0); return; }
                void onCreateTask({ title: newTaskTitle.trim(), storyPoint: 0, priority: 'MEDIUM' });
                setNewTaskTitle('');
                setNewTaskTitleLength(0);
                setShowCreateTaskBox(false);
              }}
              className="mt-2 flex items-center gap-3 rounded-lg border-2 border-cu-primary bg-cu-bg px-3 py-1.5 transition-all duration-200"
            >
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  maxLength={255}
                  value={newTaskTitle}
                  onChange={(e) => {
                    setNewTaskTitle(e.target.value);
                    setNewTaskTitleLength(e.target.value.length);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') { setShowCreateTaskBox(false); setNewTaskTitle(''); setNewTaskTitleLength(0); }
                  }}
                  placeholder="Task name"
                  autoFocus
                  className="w-full bg-transparent text-[12px] font-medium text-cu-text-primary outline-none placeholder:text-cu-text-tertiary"
                />
                {newTaskTitleLength > 200 && (
                  <p className="text-xs text-amber-500 mt-1">
                    {255 - newTaskTitleLength} characters remaining
                  </p>
                )}
              </div>
              <button
                type="submit"
                disabled={!newTaskTitle.trim()}
                className="flex h-11 w-11 items-center justify-center shrink-0 rounded-md bg-cu-primary text-white hover:bg-cu-primary-hover disabled:opacity-50 transition-colors duration-150"
                title="Create Task"
              >
                <CornerDownLeft size={14} />
              </button>
            </form>
          )}

           {/* ── Create Task Modal (header New Task button) ── */}
          <CreateTaskModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onCreateTask={onCreateTask}
            projectId={parseInt(projectId, 10)}
          />

          {/* ── Task Delete Confirmation Modal ── */}
          <ConfirmModal
            open={taskToDeleteId !== null}
            onCancel={() => setTaskToDeleteId(null)}
            onConfirm={() => {
              if (taskToDeleteId) {
                handleDeleteTask(taskToDeleteId);
                setTaskToDeleteId(null);
              }
            }}
            title="Delete Task"
            message="Are you sure you want to delete this task? This action cannot be undone."
            confirmLabel="Delete"
            loading={false}
            variant="danger"
          />
        </div>
      )}

    {selectedTaskId !== null && (
      <TaskCardModal
        taskId={selectedTaskId}
        onClose={(wasModified) => {
          setSelectedTaskId(null);
          if (wasModified) {
            window.dispatchEvent(new CustomEvent('planora:task-updated'));
          }
        }}
      />
    )}
    </div>
  );
}

// ConfirmModal imported from shared module

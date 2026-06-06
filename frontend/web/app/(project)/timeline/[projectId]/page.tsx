'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TimelineView from '../../kanban/components/TimelineView';
import { Task } from '../../kanban/types';
import { fetchTasksByProject } from '../../kanban/api';
import { AlertCircle, CalendarRange, Diamond, ListChecks, RefreshCw } from 'lucide-react';
import TaskCardModal from '@/app/taskcard/TaskCardModal';
import { useTaskWebSocket } from '@/hooks/useTaskWebSocket';
import { getMilestones } from '@/services/milestone-service';
import type { MilestoneResponse } from '@/types';
import EmptyState from '@/components/shared/EmptyState';

export default function TimelinePage() {
  const router = useRouter();
  const { projectId } = useParams<{ projectId: string }>();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [milestones, setMilestones] = useState<MilestoneResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const timelineStats = useMemo(() => {
    const dated = tasks.filter((task) => task.startDate || task.dueDate).length;
    const overdue = tasks.filter((task) => {
      if (!task.dueDate || (task.status ?? '').toUpperCase() === 'DONE') return false;
      const due = new Date((task.dueDate.length === 10 ? task.dueDate + 'T00:00:00' : task.dueDate));
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      due.setHours(0, 0, 0, 0);
      return due < today;
    }).length;
    return {
      total: tasks.length,
      dated,
      overdue,
      milestones: milestones.length,
    };
  }, [tasks, milestones]);

  useTaskWebSocket(projectId, (event) => {
    if (event.type === 'TASK_UPDATED' && event.task) {
      setTasks((prev) =>
        prev.map((t) => (t.id === event.task!.id ? { ...t, ...(event.task! as Partial<Task>) } : t))
      );
    } else if (event.type === 'TASK_CREATED' && event.task) {
      setTasks((prev) => [...prev, event.task! as unknown as Task]);
    } else if (event.type === 'TASK_DELETED' && event.taskId != null) {
      setTasks((prev) => prev.filter((t) => t.id !== event.taskId));
    }
  });

  const loadTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const projectIdNum = parseInt(projectId, 10);
      if (isNaN(projectIdNum)) {
        throw new Error('Invalid project ID');
      }
      const fetchedTasks = await fetchTasksByProject(projectIdNum);
      setTasks(fetchedTasks);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load tasks';
      setError(errorMsg);
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  const loadMilestones = useCallback(async () => {
    const pid = parseInt(projectId, 10);
    if (isNaN(pid)) return;
    try {
      const data = await getMilestones(pid);
      setMilestones(data);
    } catch {
      setMilestones([]);
    }
  }, [projectId]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  useEffect(() => {
    const onTaskUpdated = () => { void loadTasks(); };
    window.addEventListener('planora:task-updated', onTaskUpdated);
    return () => window.removeEventListener('planora:task-updated', onTaskUpdated);
  }, [loadTasks]);

  useEffect(() => {
    void loadMilestones();
  }, [loadMilestones]);

  useEffect(() => {
    const refreshMilestones = () => { void loadMilestones(); };
    window.addEventListener('planora:task-updated', refreshMilestones);
    window.addEventListener('planora:milestone-updated', refreshMilestones);
    return () => {
      window.removeEventListener('planora:task-updated', refreshMilestones);
      window.removeEventListener('planora:milestone-updated', refreshMilestones);
    };
  }, [loadMilestones]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-gray-50 overflow-y-auto">
      <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-[1400px] mx-auto w-full">
        {/* Header */}
        <div className="sticky-section-header glass-panel border border-cu-border rounded-2xl px-4 sm:px-6 py-4 mb-4 flex items-center gap-3 flex-wrap">
          <div>
            <h1 className="text-[20px] sm:text-2xl font-bold text-cu-text-primary">Timeline</h1>
            <p className="text-[12px] sm:text-[13px] text-cu-text-secondary mt-0.5">Modern gantt planning view with drag/resize scheduling.</p>
          </div>
          <div className="ml-auto grid grid-cols-2 sm:grid-cols-4 gap-2 w-full sm:w-auto">
            <div className="rounded-xl border border-cu-border bg-cu-bg px-3 py-2 min-w-[120px]">
              <p className="text-[10px] font-semibold text-cu-text-secondary uppercase">Tasks</p>
              <p className="text-[16px] font-bold text-cu-text-primary">{timelineStats.total}</p>
            </div>
            <div className="rounded-xl border border-cu-border bg-cu-bg px-3 py-2 min-w-[120px]">
              <p className="text-[10px] font-semibold text-cu-text-secondary uppercase inline-flex items-center gap-1"><CalendarRange size={11} />Scheduled</p>
              <p className="text-[16px] font-bold text-cu-primary">{timelineStats.dated}</p>
            </div>
            <div className="rounded-xl border border-cu-border bg-cu-bg px-3 py-2 min-w-[120px]">
              <p className="text-[10px] font-semibold text-cu-text-secondary uppercase inline-flex items-center gap-1"><ListChecks size={11} />Overdue</p>
              <p className="text-[16px] font-bold text-red-600">{timelineStats.overdue}</p>
            </div>
            <div className="rounded-xl border border-cu-border bg-cu-bg px-3 py-2 min-w-[120px]">
              <p className="text-[10px] font-semibold text-cu-text-secondary uppercase inline-flex items-center gap-1"><Diamond size={11} />Milestones</p>
              <p className="text-[16px] font-bold text-purple-600">{timelineStats.milestones}</p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-5">
            <EmptyState
              icon={<AlertCircle size={24} />}
              title="Unable to load timeline"
              subtitle={error}
              action={
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => void loadTasks()}
                    className="inline-flex items-center gap-2 rounded-xl bg-cu-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-cu-primary-hover transition-colors"
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push(`/backlog?projectId=${projectId}`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-cu-border bg-cu-bg px-4 py-2.5 text-sm font-semibold text-cu-text-primary hover:bg-cu-hover transition-colors"
                  >
                    Open backlog
                  </button>
                </div>
              }
            />
          </div>
        )}

        {!loading && !error && tasks.length === 0 && (
          <EmptyState
            icon={<CalendarRange size={24} />}
            title="No scheduled tasks yet"
            subtitle="Add due dates or start dates to tasks to see them on the timeline."
            action={
              <button
                type="button"
                onClick={() => router.push(`/backlog?projectId=${projectId}`)}
                className="inline-flex items-center gap-2 rounded-xl bg-cu-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-cu-primary-hover transition-colors"
              >
                Open backlog
              </button>
            }
          />
        )}

        {/* Loading skeleton */}
        {loading ? (
          <div className="space-y-3">
            <div className="skeleton h-10 w-full rounded-xl" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="skeleton h-12 rounded-xl w-full" style={{ opacity: 1 - i * 0.12 }} />
            ))}
          </div>
        ) : (
          <TimelineView
            tasks={tasks}
            onOpenTask={setSelectedTaskId}
            onTaskUpdated={(taskId, updates) => {
              setTasks((prev) =>
                prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
              );
            }}
            milestones={milestones.map(ms => ({ id: ms.id, name: ms.name, dueDate: ms.dueDate, status: ms.status }))}
          />
        )}

        {selectedTaskId !== null && (
          <TaskCardModal
            taskId={selectedTaskId}
            onClose={(wasModified) => {
              setSelectedTaskId(null);
              if (wasModified) {
                void loadTasks();
              }
            }}
          />
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/axios';
import { T } from '../constants/tokens';
import { offlineSyncManager, QueuedMutation } from '../services/offlineSyncManager';

export interface BoardLabel {
  id: number;
  name: string;
  color?: string | null;
}

export interface BoardSubtask {
  id: number;
  title: string;
  status: string;
}

export interface BoardTask {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  dueDate?: string | null;
  startDate?: string | null;
  updatedAt?: string | null;
  createdAt?: string | null;
  completedAt?: string | null;
  assigneeName?: string | null;
  assigneePhotoUrl?: string | null;
  projectId?: number;
  sprintId?: number | null;
  storyPoint?: number | null;
  projectTaskNumber?: number | null;
  labels?: BoardLabel[];
  subtasks?: BoardSubtask[];
  commentCount?: number;
  attachmentCount?: number;
  // Offline-first tracking fields
  syncStatus?: 'pending' | 'syncing' | 'failed';
  syncError?: string;
  originalData?: Partial<BoardTask>;
}

export interface BoardMember {
  id: number;
  userId: number;
  name: string;
  role?: string | null;
}

export interface KanbanBoardColumn {
  id: number;
  name: string;
  status: string;
  position: number;
  color?: string | null;
  wipLimit?: number | null;
}

export interface KanbanBoardData {
  kanbanId: number;
  name?: string;
  projectId: number;
  columns: KanbanBoardColumn[];
}

const FALLBACK_COLUMNS: KanbanBoardColumn[] = [
  { id: 0, name: 'To Do', status: 'TODO', position: 0, color: T.statusTodo.dot, wipLimit: 0 },
  { id: 0, name: 'In Progress', status: 'IN_PROGRESS', position: 1, color: T.statusInProg.dot, wipLimit: 0 },
  { id: 0, name: 'In Review', status: 'IN_REVIEW', position: 2, color: T.statusInReview.dot, wipLimit: 0 },
  { id: 0, name: 'Done', status: 'DONE', position: 3, color: T.statusDone.dot, wipLimit: 0 },
];

function normalizeColumns(columns?: KanbanBoardColumn[]) {
  const source = columns?.length ? columns : FALLBACK_COLUMNS;
  return [...source]
    .filter((column) => !!column.status)
    .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

// Helper to overlay queued offline changes on top of raw task data
function applyQueuedMutations(
  baseTasks: BoardTask[],
  queue: QueuedMutation[],
  projectId: number,
  members: BoardMember[]
): BoardTask[] {
  let tasks = [...baseTasks];

  const projectMutations = queue.filter(
    (m) => m.projectId === projectId || (m.originalTask && m.originalTask.projectId === projectId)
  );

  projectMutations.forEach((item) => {
    if (item.type === 'CREATE_TASK') {
      const tempId = item.taskId ?? -Number(item.id.replace(/\D/g, '').substring(0, 7));
      if (!tasks.some((t) => t.id === tempId)) {
        const assignee = members.find((m) => m.userId === item.payload.assigneeId);
        tasks.push({
          id: tempId,
          title: item.payload.title,
          status: item.payload.status,
          dueDate: item.payload.dueDate,
          priority: item.payload.priority || 'MEDIUM',
          assigneeName: assignee ? assignee.name : null,
          assigneePhotoUrl: null,
          projectId,
          syncStatus: item.status,
          syncError: item.error,
        });
      }
    } else {
      const taskId = item.taskId;
      const index = tasks.findIndex((t) => t.id === taskId);
      if (index !== -1) {
        const task = tasks[index];
        tasks[index] = {
          ...task,
          syncStatus: item.status,
          syncError: item.error,
        };

        if (item.type === 'UPDATE_STATUS') {
          tasks[index].status = item.payload.status;
        } else if (item.type === 'UPDATE_ASSIGNEE') {
          const assignee = members.find((m) => m.userId === item.payload.assigneeId);
          tasks[index].assigneeName = assignee ? assignee.name : null;
        } else if (item.type === 'UPDATE_DUE_DATE') {
          tasks[index].dueDate = item.payload.dueDate;
        }
      }
    }
  });

  return tasks;
}

export function useProjectBoard(projectId: number) {
  const [board, setBoard] = useState<KanbanBoardData | null>(null);
  const [rawTasks, setRawTasks] = useState<BoardTask[]>([]);
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isOnline, setIsOnline] = useState(offlineSyncManager.getOnlineStatus());
  const [isStale, setIsStale] = useState(true);
  const [mutationQueue, setMutationQueue] = useState<QueuedMutation[]>(offlineSyncManager.getQueue());

  const columns = useMemo(() => normalizeColumns(board?.columns), [board?.columns]);

  const CACHE_KEY = `board_data_${projectId}`;

  // Apply queued mutations on top of rawTasks
  const tasks = useMemo(() => {
    return applyQueuedMutations(rawTasks, mutationQueue, projectId, members);
  }, [rawTasks, mutationQueue, projectId, members]);

  // ── Load cache on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!projectId) return;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const { cachedBoard, cachedTasks, cachedMembers } = JSON.parse(cached);
          if (cachedBoard) setBoard(cachedBoard);
          if (cachedTasks) setRawTasks(cachedTasks);
          if (cachedMembers) setMembers(cachedMembers);
          setIsStale(true);
        }
      } catch (e) {
        console.error('Failed to load board cache', e);
      }
    })();
  }, [projectId, CACHE_KEY]);

  const fetchBoard = useCallback(async (background = false) => {
    if (!projectId) return;

    if (background) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [boardRes, tasksRes, membersRes] = await Promise.all([
        api.get(`/api/kanbans/project/${projectId}/board`),
        api.get(`/api/tasks/project/${projectId}`),
        api.get(`/api/projects/${projectId}/members`).catch(() => ({ data: [] })),
      ]);

      const rawBoard = boardRes.data as KanbanBoardData | null;
      const normalizedBoard = rawBoard ? { ...rawBoard, columns: normalizeColumns(rawBoard.columns) } : null;
      const fetchedTasks = Array.isArray(tasksRes.data) ? tasksRes.data : [];
      const rawMembers = Array.isArray(membersRes.data) ? membersRes.data : [];

      const parsedMembers = rawMembers.map((member: {
        id?: number;
        userId?: number;
        role?: string | null;
        user?: { userId?: number; fullName?: string | null; username?: string | null };
        name?: string | null;
      }) => {
        const userId = member.user?.userId ?? member.userId ?? member.id ?? 0;
        const name = member.name || member.user?.fullName || member.user?.username || `Member ${userId}`;
        return {
          id: member.id ?? userId,
          userId,
          name,
          role: member.role ?? null,
        };
      }).filter((member: BoardMember) => member.userId > 0);

      setBoard(normalizedBoard);
      setRawTasks(fetchedTasks);
      setMembers(parsedMembers);
      setIsStale(false);

      // Save to cache
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({
          cachedBoard: normalizedBoard,
          cachedTasks: fetchedTasks,
          cachedMembers: parsedMembers,
        })
      );
    } catch {
      setError('Failed to load board. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, CACHE_KEY]);

  useEffect(() => {
    void fetchBoard(false);
  }, [fetchBoard]);

  // ── Listen to Sync Manager connection & queue events ────────────────────────
  useEffect(() => {
    const removeListener = offlineSyncManager.addListener((event) => {
      if (event.type === 'CONNECTION_CHANGED') {
        setIsOnline(event.isOnline);
      } else if (event.type === 'QUEUE_CHANGED') {
        setMutationQueue(event.queue);
      } else if (event.type === 'SYNC_COMPLETED' || event.type === 'TASK_CREATED' || event.type === 'TASK_UPDATED') {
        void fetchBoard(true);
      }
    });
    return removeListener;
  }, [fetchBoard]);

  const refresh = useCallback(() => fetchBoard(true), [fetchBoard]);

  // status patch
  const moveTask = useCallback(async (task: BoardTask, status: string) => {
    if (task.status === status) return;

    if (!isOnline) {
      // Offline queue mutation
      await offlineSyncManager.addMutation({
        projectId,
        taskId: task.id,
        type: 'UPDATE_STATUS',
        payload: { status },
        originalTask: task,
      });
      return;
    }

    const previous = rawTasks;
    setRawTasks((current) => current.map((item) => (
      item.id === task.id ? { ...item, status } : item
    )));

    try {
      const response = await api.patch(`/api/tasks/${task.id}/status`, { status });
      const updated = response.data as BoardTask;
      setRawTasks((current) => current.map((item) => (
        item.id === task.id ? { ...item, ...updated } : item
      )));
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        // Offline fall back
        setRawTasks(previous);
        await offlineSyncManager.addMutation({
          projectId,
          taskId: task.id,
          type: 'UPDATE_STATUS',
          payload: { status },
          originalTask: task,
        });
      } else {
        setRawTasks(previous);
        throw err;
      }
    }
  }, [isOnline, projectId, rawTasks]);

  // task create
  const createTask = useCallback(async ({
    title,
    status,
    dueDate,
    assigneeId,
  }: {
    title: string;
    status: string;
    dueDate?: string | null;
    assigneeId?: number | null;
  }) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    const payload = {
      projectId,
      title: cleanTitle,
      status,
      priority: 'MEDIUM',
      dueDate: dueDate || undefined,
      assigneeId: assigneeId || undefined,
    };

    if (!isOnline) {
      const tempId = -Math.floor(Math.random() * 1000000 + 1);
      await offlineSyncManager.addMutation({
        projectId,
        taskId: tempId,
        type: 'CREATE_TASK',
        payload,
      });
      return;
    }

    try {
      const response = await api.post('/api/tasks', payload);
      const created = response.data as BoardTask;
      setRawTasks((current) => current.some((task) => task.id === created.id) ? current : [...current, created]);
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        const tempId = -Math.floor(Math.random() * 1000000 + 1);
        await offlineSyncManager.addMutation({
          projectId,
          taskId: tempId,
          type: 'CREATE_TASK',
          payload,
        });
      } else {
        throw err;
      }
    }
  }, [isOnline, projectId]);

  // update task due date
  const updateTaskDueDate = useCallback(async (taskId: number, dueDate: string | null) => {
    const originalTask = rawTasks.find((t) => t.id === taskId);
    if (!originalTask) return;

    if (!isOnline) {
      await offlineSyncManager.addMutation({
        projectId,
        taskId,
        type: 'UPDATE_DUE_DATE',
        payload: { dueDate },
        originalTask,
      });
      return;
    }

    const previous = rawTasks;
    setRawTasks((current) => current.map((task) => (
      task.id === taskId ? { ...task, dueDate } : task
    )));

    try {
      await api.patch(`/api/tasks/${taskId}/dates`, { dueDate });
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setRawTasks(previous);
        await offlineSyncManager.addMutation({
          projectId,
          taskId,
          type: 'UPDATE_DUE_DATE',
          payload: { dueDate },
          originalTask,
        });
      } else {
        setRawTasks(previous);
        throw err;
      }
    }
  }, [isOnline, projectId, rawTasks]);

  // update task assignee (NEW offline-first helper)
  const updateTaskAssignee = useCallback(async (taskId: number, assigneeId: number | null) => {
    const originalTask = rawTasks.find((t) => t.id === taskId);
    if (!originalTask) return;

    if (!isOnline) {
      await offlineSyncManager.addMutation({
        projectId,
        taskId,
        type: 'UPDATE_ASSIGNEE',
        payload: { assigneeId },
        originalTask,
      });
      return;
    }

    const previous = rawTasks;
    const assignee = members.find((m) => m.userId === assigneeId);
    setRawTasks((current) => current.map((task) => (
      task.id === taskId ? { ...task, assigneeName: assignee ? assignee.name : null } : task
    )));

    try {
      if (assigneeId) {
        await api.patch(`/api/tasks/${taskId}/assign/${assigneeId}`);
      } else {
        await api.delete(`/api/tasks/${taskId}/assignee`);
      }
    } catch (err: any) {
      if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        setRawTasks(previous);
        await offlineSyncManager.addMutation({
          projectId,
          taskId,
          type: 'UPDATE_ASSIGNEE',
          payload: { assigneeId },
          originalTask,
        });
      } else {
        setRawTasks(previous);
        throw err;
      }
    }
  }, [isOnline, projectId, rawTasks, members]);

  // delete task
  const deleteTask = useCallback(async (taskId: number) => {
    const previous = rawTasks;
    setRawTasks((current) => current.filter((task) => task.id !== taskId));
    try {
      await api.delete(`/api/tasks/${taskId}`);
    } catch (err) {
      setRawTasks(previous);
      throw err;
    }
  }, [rawTasks]);

  // update task title
  const updateTaskTitle = useCallback(async (taskId: number, title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const previous = rawTasks;
    setRawTasks((current) => current.map((task) => (
      task.id === taskId ? { ...task, title: cleanTitle } : task
    )));
    try {
      const response = await api.put(`/api/tasks/${taskId}`, { title: cleanTitle });
      const updated = response.data as BoardTask;
      setRawTasks((current) => current.map((task) => (
        task.id === taskId ? { ...task, ...updated } : task
      )));
    } catch (err) {
      setRawTasks(previous);
      throw err;
    }
  }, [rawTasks]);

  // create column
  const createColumn = useCallback(async (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    if (!board?.kanbanId) {
      throw new Error('Board configuration is not loaded.');
    }

    const response = await api.post('/api/kanban-columns', {
      name: cleanName,
      position: columns.length,
      kanbanId: board.kanbanId,
    });
    const created = response.data as KanbanBoardColumn;
    setBoard((current) => current ? {
      ...current,
      columns: normalizeColumns([...current.columns, created]),
    } : current);
  }, [board?.kanbanId, columns.length]);

  // delete column
  const deleteColumn = useCallback(async (columnId: number) => {
    if (!columnId) return;

    const previous = board;
    setBoard((current) => current ? {
      ...current,
      columns: current.columns.filter((column) => column.id !== columnId),
    } : current);

    try {
      await api.delete(`/api/kanban-columns/${columnId}`);
    } catch (err) {
      setBoard(previous);
      throw err;
    }
  }, [board]);

  return {
    board,
    columns,
    tasks,
    members,
    loading,
    refreshing,
    error,
    refresh,
    moveTask,
    createTask,
    deleteTask,
    updateTaskTitle,
    updateTaskDueDate,
    updateTaskAssignee,
    createColumn,
    deleteColumn,
    isOnline,
    isStale,
  };
}

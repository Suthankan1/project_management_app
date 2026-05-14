import React, { useMemo, useRef, useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import { T, STATUS_MAP, StatusKey } from '../../constants/tokens';
import {
  BoardLabel,
  BoardTask,
  KanbanBoardColumn,
  useProjectBoard,
} from '../../hooks/useProjectBoard';

const PRIORITY_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  URGENT: { dot: '#EF4444', text: '#B91C1C', bg: '#FEF2F2' },
  HIGH: { dot: '#F97316', text: '#C2410C', bg: '#FFF7ED' },
  MEDIUM: { dot: '#F59E0B', text: '#B45309', bg: '#FFFBEB' },
  NORMAL: { dot: '#3B82F6', text: '#1D4ED8', bg: '#EFF6FF' },
  LOW: { dot: '#94A3B8', text: '#64748B', bg: '#F8FAFC' },
};

function statusAccent(status: string, color?: string | null) {
  if (color?.startsWith('#')) return color;
  return STATUS_MAP[status as StatusKey]?.dot ?? T.primary;
}

function formatColumnName(column: KanbanBoardColumn) {
  return column.name || column.status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDate(dateString?: string | null) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isOverdue(task: BoardTask) {
  if (!task.dueDate || task.status === 'DONE') return false;
  const due = new Date(task.dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return !Number.isNaN(due.getTime()) && due < today;
}

function initialsFromName(name?: string | null) {
  if (!name) return '--';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function labelStyle(label: BoardLabel) {
  const color = label.color?.startsWith('#') ? label.color : T.primary;
  return {
    backgroundColor: `${color}16`,
    borderColor: `${color}30`,
    color,
  };
}

function SearchIcon() {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={11} cy={11} r={8} />
      <Path d="m21 21-4.3-4.3" />
    </Svg>
  );
}

function PlusIcon({ color = '#FFFFFF' }: { color?: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </Svg>
  );
}

function TaskCard({
  task,
  onMove,
  onDelete,
}: {
  task: BoardTask;
  onMove: (task: BoardTask) => void;
  onDelete: (task: BoardTask) => void;
}) {
  const priority = task.priority ? PRIORITY_STYLES[task.priority.toUpperCase()] ?? PRIORITY_STYLES.LOW : null;
  const due = formatDate(task.dueDate);
  const overdue = isOverdue(task);
  const labels = (task.labels || []).slice(0, 2);
  const completedSubtasks = task.subtasks?.filter((subtask) => subtask.status === 'DONE').length ?? 0;
  const totalSubtasks = task.subtasks?.length ?? 0;

  return (
    <TouchableOpacity activeOpacity={0.82} onLongPress={() => onMove(task)} onPress={() => onMove(task)}>
      <View style={card.card}>
        <View style={card.topRow}>
          {priority && task.priority ? (
            <View style={[card.priority, { backgroundColor: priority.bg, borderColor: `${priority.dot}24` }]}>
              <View style={[card.priorityDot, { backgroundColor: priority.dot }]} />
              <Text style={[card.priorityText, { color: priority.text }]}>{task.priority}</Text>
            </View>
          ) : <View />}

          <TouchableOpacity hitSlop={10} onPress={() => onDelete(task)} style={card.iconBtn}>
            <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M3 6h18" />
              <Path d="M8 6V4h8v2" />
              <Path d="M19 6l-1 14H6L5 6" />
            </Svg>
          </TouchableOpacity>
        </View>

        <Text style={card.title} numberOfLines={3}>{task.title}</Text>

        {!!task.description && (
          <Text style={card.description} numberOfLines={2}>{task.description}</Text>
        )}

        <View style={card.metaRow}>
          {task.projectTaskNumber != null && (
            <View style={card.codePill}>
              <Text style={card.codeText}>TSK-{task.projectTaskNumber}</Text>
            </View>
          )}
          {task.storyPoint != null && task.storyPoint > 0 && (
            <View style={card.codePill}>
              <Text style={card.codeText}>{task.storyPoint} pts</Text>
            </View>
          )}
          {due && <Text style={[card.dueDate, overdue && card.overdue]}>{due}</Text>}
        </View>

        {labels.length > 0 && (
          <View style={card.labelRow}>
            {labels.map((label) => {
              const colors = labelStyle(label);
              return (
                <View key={label.id} style={[card.labelPill, { backgroundColor: colors.backgroundColor, borderColor: colors.borderColor }]}>
                  <Text style={[card.labelText, { color: colors.color }]} numberOfLines={1}>{label.name}</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={card.footerRow}>
          <View style={card.assigneeRow}>
            <View style={card.avatar}>
              <Text style={card.avatarText}>{initialsFromName(task.assigneeName)}</Text>
            </View>
            <Text style={card.assigneeName} numberOfLines={1}>{task.assigneeName || 'Unassigned'}</Text>
          </View>

          {totalSubtasks > 0 && (
            <View style={card.subtaskWrap}>
              <Text style={card.subtaskCount}>{completedSubtasks}/{totalSubtasks}</Text>
              <View style={card.progressTrack}>
                <View style={[card.progressFill, { width: `${Math.max(4, (completedSubtasks / totalSubtasks) * 100)}%` }]} />
              </View>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

function BoardColumn({
  column,
  tasks,
  onMoveTask,
  onDeleteTask,
  onCreateTask,
}: {
  column: KanbanBoardColumn;
  tasks: BoardTask[];
  onMoveTask: (task: BoardTask) => void;
  onDeleteTask: (task: BoardTask) => void;
  onCreateTask: (column: KanbanBoardColumn) => void;
}) {
  const accent = statusAccent(column.status, column.color);
  const wipExceeded = !!column.wipLimit && column.wipLimit > 0 && tasks.length > column.wipLimit;

  return (
    <View style={columnStyles.card}>
      <View style={[columnStyles.accent, { backgroundColor: accent }]} />
      <View style={columnStyles.header}>
        <View style={columnStyles.headerLeft}>
          <View style={[columnStyles.statusDot, { backgroundColor: accent }]} />
          <Text style={columnStyles.title} numberOfLines={1}>{formatColumnName(column)}</Text>
        </View>
        <View style={[wipExceeded ? columnStyles.wipPill : columnStyles.countPill, { borderColor: `${accent}30` }]}>
          <Text style={[columnStyles.countText, wipExceeded ? columnStyles.wipText : { color: accent }]}>
            {wipExceeded ? `${tasks.length}/${column.wipLimit}` : tasks.length}
          </Text>
        </View>
      </View>

      <View style={columnStyles.body}>
        {tasks.length === 0 ? (
          <TouchableOpacity activeOpacity={0.75} onPress={() => onCreateTask(column)} style={columnStyles.emptyState}>
            <Text style={columnStyles.emptyTitle}>No tasks yet</Text>
            <Text style={columnStyles.emptyText}>Tap to add one here.</Text>
          </TouchableOpacity>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onMove={onMoveTask} onDelete={onDeleteTask} />
          ))
        )}
      </View>

      <TouchableOpacity activeOpacity={0.8} onPress={() => onCreateTask(column)} style={columnStyles.addTaskBtn}>
        <PlusIcon color={accent} />
        <Text style={[columnStyles.addTaskText, { color: accent }]}>Add task</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProjectBoardScreen({
  projectId,
  projectName,
  topOffset = 0,
}: {
  projectId: number;
  projectName?: string;
  topOffset?: number;
}) {
  const { width } = useWindowDimensions();
  const {
    board,
    columns,
    tasks,
    loading,
    refreshing,
    error,
    refresh,
    moveTask,
    createTask,
    deleteTask,
    createColumn,
  } = useProjectBoard(projectId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTask, setSelectedTask] = useState<BoardTask | null>(null);
  const [taskTarget, setTaskTarget] = useState<KanbanBoardColumn | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 280, useNativeDriver: true }).start();
  }, [fade]);

  const visibleTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return tasks;
    return tasks.filter((task) => {
      const labels = task.labels?.some((label) => label.name.toLowerCase().includes(term));
      return labels || [
        task.title,
        task.description || '',
        task.assigneeName || '',
        task.priority || '',
        task.status || '',
        `tsk-${task.projectTaskNumber ?? task.id}`,
      ].some((value) => value.toLowerCase().includes(term));
    });
  }, [searchTerm, tasks]);

  const columnTasks = useMemo(() => {
    const grouped: Record<string, BoardTask[]> = {};
    columns.forEach((column) => { grouped[column.status] = []; });
    visibleTasks.forEach((task) => {
      if (!grouped[task.status]) grouped[task.status] = [];
      grouped[task.status].push(task);
    });
    return grouped;
  }, [columns, visibleTasks]);

  const metrics = useMemo(() => {
    const total = visibleTasks.length;
    const done = visibleTasks.filter((task) => task.status === 'DONE').length;
    const doing = visibleTasks.filter((task) => task.status === 'IN_PROGRESS').length;
    const progress = total ? Math.round((done / total) * 100) : 0;
    return { total, done, doing, progress };
  }, [visibleTasks]);

  const openCreateTask = (column: KanbanBoardColumn) => {
    setTaskTarget(column);
    setNewTaskTitle('');
    setShowTaskModal(true);
  };

  const submitCreateTask = async () => {
    if (!taskTarget || !newTaskTitle.trim()) return;
    setSubmitting(true);
    try {
      await createTask(newTaskTitle, taskTarget.status);
      setShowTaskModal(false);
      setTaskTarget(null);
      setNewTaskTitle('');
    } catch {
      Alert.alert('Task not created', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitCreateColumn = async () => {
    if (!newColumnName.trim()) return;
    setSubmitting(true);
    try {
      await createColumn(newColumnName);
      setShowColumnModal(false);
      setNewColumnName('');
    } catch {
      Alert.alert('Column not created', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMoveTask = async (column: KanbanBoardColumn) => {
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      await moveTask(selectedTask, column.status);
      setSelectedTask(null);
    } catch {
      Alert.alert('Move failed', 'The task could not be moved.');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteTask = (task: BoardTask) => {
    Alert.alert('Delete task', `Delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task.id);
          } catch {
            Alert.alert('Delete failed', 'The task could not be deleted.');
          }
        },
      },
    ]);
  };

  const columnWidth = Math.min(width * 0.84, 326);

  return (
    <SafeAreaView style={s.safe} edges={topOffset ? ['left', 'right'] : ['top', 'left', 'right']}>
      <StatusBar style="dark" />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: topOffset }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={T.primary} colors={[T.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[s.hero, { opacity: fade }]}>
          <View style={s.heroTop}>
            <View style={s.boardMark}>
              <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <Path d="M4 4h5v16H4z" />
                <Path d="M10.5 4h4.5v11h-4.5z" />
                <Path d="M16.5 4H20v14h-3.5z" />
              </Svg>
            </View>
            <View style={s.heroTitleWrap}>
              <Text style={s.eyebrow}>KANBAN BOARD</Text>
              <Text style={s.title} numberOfLines={1}>{projectName || board?.name || 'Board'}</Text>
            </View>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowColumnModal(true)} style={s.iconAction}>
              <PlusIcon color={T.primary} />
            </TouchableOpacity>
          </View>

          <View style={s.progressWrap}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${metrics.progress}%` }]} />
            </View>
            <Text style={s.progressText}>{metrics.progress}% complete</Text>
          </View>

          <View style={s.metricsRow}>
            <Metric label="Tasks" value={metrics.total} accent={T.primary} />
            <Metric label="Doing" value={metrics.doing} accent={T.statusInProg.dot} />
            <Metric label="Done" value={metrics.done} accent={T.statusDone.dot} />
          </View>

          <View style={s.searchWrap}>
            <SearchIcon />
            <TextInput
              style={s.searchInput}
              placeholder="Search tasks, assignees, labels..."
              placeholderTextColor="#94A3B8"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
        </Animated.View>

        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={T.primary} />
            <Text style={s.loadingText}>Loading board...</Text>
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.boardRow}
            decelerationRate="fast"
            snapToInterval={columnWidth + 14}
            snapToAlignment="start"
          >
            {columns.map((column) => (
              <View key={column.status} style={{ width: columnWidth }}>
                <BoardColumn
                  column={column}
                  tasks={columnTasks[column.status] || []}
                  onMoveTask={setSelectedTask}
                  onDeleteTask={confirmDeleteTask}
                  onCreateTask={openCreateTask}
                />
              </View>
            ))}
          </ScrollView>
        )}

        <View style={s.bottomPad} />
      </ScrollView>

      <Modal visible={!!selectedTask} transparent animationType="slide">
        <SafeAreaView style={modal.safe}>
          <View style={modal.sheet}>
            <View style={modal.handle} />
            <Text style={modal.title} numberOfLines={2}>{selectedTask?.title}</Text>
            <Text style={modal.subtitle}>Move to column</Text>
            {columns.map((column) => {
              const accent = statusAccent(column.status, column.color);
              const active = selectedTask?.status === column.status;
              return (
                <TouchableOpacity
                  key={column.status}
                  activeOpacity={0.78}
                  disabled={active || submitting}
                  style={[modal.option, active && modal.optionActive]}
                  onPress={() => handleMoveTask(column)}
                >
                  <View style={[modal.optionDot, { backgroundColor: accent }]} />
                  <Text style={modal.optionText}>{formatColumnName(column)}</Text>
                  {active && <Text style={modal.currentText}>Current</Text>}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setSelectedTask(null)} style={modal.secondaryBtn}>
              <Text style={modal.secondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showTaskModal} transparent animationType="slide">
        <SafeAreaView style={modal.safe}>
          <View style={modal.sheet}>
            <View style={modal.handle} />
            <Text style={modal.title}>New task</Text>
            <Text style={modal.subtitle}>{taskTarget ? formatColumnName(taskTarget) : 'Column'}</Text>
            <TextInput
              style={modal.input}
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              placeholder="Task title"
              placeholderTextColor="#94A3B8"
              editable={!submitting}
              autoFocus
            />
            <TouchableOpacity activeOpacity={0.85} disabled={submitting || !newTaskTitle.trim()} onPress={submitCreateTask} style={[modal.primaryBtn, (!newTaskTitle.trim() || submitting) && modal.disabled]}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={modal.primaryText}>Create task</Text>}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowTaskModal(false)} style={modal.secondaryBtn}>
              <Text style={modal.secondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={showColumnModal} transparent animationType="slide">
        <SafeAreaView style={modal.safe}>
          <View style={modal.sheet}>
            <View style={modal.handle} />
            <Text style={modal.title}>New column</Text>
            <Text style={modal.subtitle}>Add another workflow stage</Text>
            <TextInput
              style={modal.input}
              value={newColumnName}
              onChangeText={setNewColumnName}
              placeholder="Column name"
              placeholderTextColor="#94A3B8"
              editable={!submitting}
              autoFocus
            />
            <TouchableOpacity activeOpacity={0.85} disabled={submitting || !newColumnName.trim()} onPress={submitCreateColumn} style={[modal.primaryBtn, (!newColumnName.trim() || submitting) && modal.disabled]}>
              {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={modal.primaryText}>Create column</Text>}
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowColumnModal(false)} style={modal.secondaryBtn}>
              <Text style={modal.secondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function Metric({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <View style={[s.metric, { backgroundColor: `${accent}10`, borderColor: `${accent}24` }]}>
      <Text style={[s.metricValue, { color: accent }]}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

const shadow = Platform.select({
  ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18 },
  android: { elevation: 3 },
});

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bgSecondary },
  scroll: { flex: 1, backgroundColor: T.bgSecondary },
  scrollContent: { paddingTop: 4 },
  hero: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  boardMark: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitleWrap: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginTop: 2 },
  iconAction: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 6, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#22C55E' },
  progressText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metric: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  metricValue: { fontSize: 20, fontWeight: '900' },
  metricLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', paddingVertical: 0 },
  errorBox: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { fontSize: 12, color: '#991B1B', fontWeight: '700' },
  loadingWrap: { paddingVertical: 34, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  boardRow: { paddingHorizontal: 12, paddingTop: 14, gap: 14 },
  bottomPad: { height: 94 },
});

const columnStyles = StyleSheet.create({
  card: {
    backgroundColor: '#F8F9FB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.95)',
    overflow: 'hidden',
    minHeight: 360,
  },
  accent: { height: 5 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  headerLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  title: { flex: 1, fontSize: 15, fontWeight: '900', color: '#0F172A' },
  countPill: {
    minWidth: 30,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wipPill: {
    minWidth: 46,
    height: 24,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: { fontSize: 12, fontWeight: '900' },
  wipText: { color: '#DC2626' },
  body: { paddingHorizontal: 12, gap: 10 },
  emptyState: {
    minHeight: 128,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    gap: 4,
  },
  emptyTitle: { fontSize: 13, fontWeight: '900', color: '#64748B' },
  emptyText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  addTaskBtn: {
    margin: 12,
    marginTop: 10,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addTaskText: { fontSize: 13, fontWeight: '900' },
});

const card = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 13,
    gap: 10,
    ...shadow,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 },
  priority: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
  },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  iconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  title: { fontSize: 14, fontWeight: '900', color: '#0F172A', lineHeight: 20 },
  description: { fontSize: 12, color: '#64748B', lineHeight: 17 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  codePill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
  },
  codeText: { fontSize: 10, fontWeight: '900', color: '#4338CA' },
  dueDate: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  overdue: { color: '#DC2626' },
  labelRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  labelPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: '100%',
  },
  labelText: { fontSize: 10, fontWeight: '900' },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  assigneeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 },
  avatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 9, color: '#FFFFFF', fontWeight: '900' },
  assigneeName: { fontSize: 11, fontWeight: '800', color: '#64748B', flex: 1 },
  subtaskWrap: { alignItems: 'flex-end', gap: 4, minWidth: 70 },
  subtaskCount: { fontSize: 10, fontWeight: '900', color: '#64748B' },
  progressTrack: { width: 70, height: 4, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: T.primary },
});

const modal = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.38)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 22,
    gap: 10,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: -4 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  optionActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  optionDot: { width: 11, height: 11, borderRadius: 6 },
  optionText: { flex: 1, fontSize: 14, fontWeight: '800', color: '#0F172A' },
  currentText: { fontSize: 11, fontWeight: '900', color: T.primary },
  input: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0F172A',
  },
  primaryBtn: {
    minHeight: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.primary,
  },
  disabled: { opacity: 0.55 },
  primaryText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  secondaryBtn: {
    minHeight: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  secondaryText: { fontSize: 14, fontWeight: '900', color: '#64748B' },
});

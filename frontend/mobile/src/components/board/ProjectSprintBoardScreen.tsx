import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { SprintboardTask, Sprintcolumn, SprintSummary, useProjectSprintBoard } from '../../hooks/useProjectSprintBoard';

const PRIORITY_STYLES: Record<string, { dot: string; text: string; bg: string }> = {
  URGENT: { dot: '#EF4444', text: '#B91C1C', bg: '#FEF2F2' },
  HIGH: { dot: '#F97316', text: '#C2410C', bg: '#FFF7ED' },
  MEDIUM: { dot: '#F59E0B', text: '#B45309', bg: '#FFFBEB' },
  LOW: { dot: '#94A3B8', text: '#64748B', bg: '#F8FAFC' },
};

function statusAccent(status: string) {
  return STATUS_MAP[status as StatusKey]?.dot ?? T.primary;
}

function formatDate(dateString?: string | null) {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initialsFromName(name?: string | null) {
  if (!name) return '--';
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function SprintIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 4h16" />
      <Path d="M4 12h16" />
      <Path d="M4 20h16" />
      <Circle cx={8} cy={4} r={2} fill="#FFFFFF" stroke="none" />
      <Circle cx={14} cy={12} r={2} fill="#FFFFFF" stroke="none" />
      <Circle cx={10} cy={20} r={2} fill="#FFFFFF" stroke="none" />
    </Svg>
  );
}

function ChevronIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="m6 9 6 6 6-6" />
    </Svg>
  );
}

function PlusIcon({ color = T.primary }: { color?: string }) {
  return (
    <Svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 5v14" />
      <Path d="M5 12h14" />
    </Svg>
  );
}

function TaskCard({ task }: { task: SprintboardTask }) {
  const priority = task.priority ? PRIORITY_STYLES[task.priority.toUpperCase()] ?? PRIORITY_STYLES.LOW : null;
  const due = formatDate(task.dueDate);
  const labelColor = task.labelColor?.startsWith('#') ? task.labelColor : T.primary;

  return (
    <View style={taskStyles.card}>
      {priority && task.priority && (
        <View style={[taskStyles.priority, { backgroundColor: priority.bg, borderColor: `${priority.dot}24` }]}>
          <View style={[taskStyles.priorityDot, { backgroundColor: priority.dot }]} />
          <Text style={[taskStyles.priorityText, { color: priority.text }]}>{task.priority}</Text>
        </View>
      )}
      <Text style={taskStyles.title} numberOfLines={3}>{task.title}</Text>
      <View style={taskStyles.metaRow}>
        {task.projectTaskNumber != null && (
          <View style={taskStyles.codePill}>
            <Text style={taskStyles.codeText}>TSK-{task.projectTaskNumber}</Text>
          </View>
        )}
        {!!task.storyPoint && task.storyPoint > 0 && (
          <View style={taskStyles.codePill}>
            <Text style={taskStyles.codeText}>{task.storyPoint} pts</Text>
          </View>
        )}
        {due && <Text style={taskStyles.dueDate}>{due}</Text>}
      </View>
      {!!task.labelName && (
        <View style={[taskStyles.labelPill, { borderColor: `${labelColor}30`, backgroundColor: `${labelColor}16` }]}>
          <Text style={[taskStyles.labelText, { color: labelColor }]}>{task.labelName}</Text>
        </View>
      )}
      <View style={taskStyles.footerRow}>
        <View style={taskStyles.avatar}>
          <Text style={taskStyles.avatarText}>{initialsFromName(task.assigneeName)}</Text>
        </View>
        <Text style={taskStyles.assigneeName} numberOfLines={1}>{task.assigneeName || 'Unassigned'}</Text>
      </View>
    </View>
  );
}

function SprintColumn({ column, onCreateTask }: { column: Sprintcolumn; onCreateTask: (column: Sprintcolumn) => void }) {
  const accent = statusAccent(column.columnStatus);
  return (
    <View style={columnStyles.card}>
      <View style={[columnStyles.accent, { backgroundColor: accent }]} />
      <View style={columnStyles.header}>
        <View style={columnStyles.headerLeft}>
          <View style={[columnStyles.statusDot, { backgroundColor: accent }]} />
          <Text style={columnStyles.title} numberOfLines={1}>{column.columnName}</Text>
        </View>
        <View style={columnStyles.countPill}>
          <Text style={columnStyles.countText}>{column.tasks.length}</Text>
        </View>
      </View>
      <View style={columnStyles.body}>
        {column.tasks.length === 0 ? (
          <View style={columnStyles.emptyState}>
            <Text style={columnStyles.emptyTitle}>No sprint tasks</Text>
          </View>
        ) : (
          column.tasks.map((task) => <TaskCard key={task.taskId} task={task} />)
        )}
      </View>
      <TouchableOpacity activeOpacity={0.8} onPress={() => onCreateTask(column)} style={columnStyles.addTaskBtn}>
        <PlusIcon />
        <Text style={columnStyles.addTaskText}>Add task</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ProjectSprintBoardScreen({
  projectId,
  projectName,
  topOffset = 0,
}: {
  projectId: number;
  projectName?: string;
  topOffset?: number;
}) {
  const { width } = useWindowDimensions();
  const { sprints, selectedSprintId, board, loading, refreshing, error, refresh, selectSprint, createTask, addColumn } = useProjectSprintBoard(projectId);
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [taskTarget, setTaskTarget] = useState<Sprintcolumn | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showColumnModal, setShowColumnModal] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const metrics = useMemo(() => {
    const stats = board?.stats;
    const total = stats?.totalTasks ?? board?.columns?.flatMap((column) => column.tasks).length ?? 0;
    const done = stats?.doneTasks ?? board?.columns?.find((column) => column.columnStatus === 'DONE')?.tasks.length ?? 0;
    const points = stats?.totalStoryPoints ?? 0;
    const progress = total ? Math.round((done / total) * 100) : 0;
    return { total, done, points, progress };
  }, [board]);

  const columnWidth = Math.min(width * 0.84, 326);
  const sprintName = board?.sprintName || sprints.find((sprint) => sprint.id === selectedSprintId)?.sprintName || sprints.find((sprint) => sprint.id === selectedSprintId)?.name || 'Sprint Board';

  const openCreateTask = (column: Sprintcolumn) => {
    setTaskTarget(column);
    setNewTaskTitle('');
  };

  const submitCreateTask = async () => {
    if (!taskTarget || !newTaskTitle.trim()) return;
    setSubmitting(true);
    try {
      await createTask(newTaskTitle, taskTarget.columnStatus);
      setTaskTarget(null);
      setNewTaskTitle('');
    } catch {
      Alert.alert('Task not created', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAddColumn = async () => {
    if (!newColumnName.trim()) return;
    setSubmitting(true);
    try {
      await addColumn(newColumnName);
      setShowColumnModal(false);
      setNewColumnName('');
    } catch {
      Alert.alert('Column not created', 'Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={s.safe} edges={topOffset ? ['left', 'right'] : ['top', 'left', 'right']}>
      <StatusBar style="dark" />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingTop: topOffset }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={T.primary} colors={[T.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hero}>
          <View style={s.heroTop}>
            <View style={s.boardMark}><SprintIcon /></View>
            <View style={s.heroTitleWrap}>
              <Text style={s.eyebrow}>SPRINT BOARD</Text>
              <Text style={s.title} numberOfLines={1}>{projectName || 'Agile project'}</Text>
            </View>
          </View>

          <TouchableOpacity activeOpacity={0.82} onPress={() => setShowSprintModal(true)} style={s.sprintSelect}>
            <View>
              <Text style={s.sprintLabel}>ACTIVE SPRINT</Text>
              <Text style={s.sprintName} numberOfLines={1}>{sprintName}</Text>
            </View>
            <ChevronIcon />
          </TouchableOpacity>

          <View style={s.progressWrap}>
            <View style={s.progressTrack}>
              <View style={[s.progressFill, { width: `${metrics.progress}%` }]} />
            </View>
            <Text style={s.progressText}>{metrics.progress}% complete</Text>
          </View>

          <View style={s.metricsRow}>
            <Metric label="Tasks" value={metrics.total} accent={T.primary} />
            <Metric label="Done" value={metrics.done} accent={T.statusDone.dot} />
            <Metric label="Points" value={metrics.points} accent="#8B5CF6" />
          </View>

          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}
        </View>

        {loading ? (
          <View style={s.loadingWrap}>
            <ActivityIndicator color={T.primary} />
            <Text style={s.loadingText}>Loading sprint board...</Text>
          </View>
        ) : !board ? (
          <View style={s.emptyBoard}>
            <Text style={s.emptyBoardTitle}>No active sprint board</Text>
            <Text style={s.emptyBoardText}>Start a sprint from the web app to see it here.</Text>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.boardRow} decelerationRate="fast" snapToInterval={columnWidth + 14} snapToAlignment="start">
            {board.columns.map((column) => (
              <View key={column.id} style={{ width: columnWidth }}>
                <SprintColumn column={column} onCreateTask={openCreateTask} />
              </View>
            ))}
            <View style={{ width: columnWidth }}>
              <TouchableOpacity activeOpacity={0.82} onPress={() => setShowColumnModal(true)} style={s.addColumnCard}>
                <View style={s.addColumnIcon}>
                  <PlusIcon />
                </View>
                <Text style={s.addColumnText}>Add column</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
        <View style={s.bottomPad} />
      </ScrollView>

      <Modal visible={showSprintModal} transparent animationType="slide">
        <SafeAreaView style={modal.safe}>
          <View style={modal.sheet}>
            <View style={modal.handle} />
            <Text style={modal.title}>Select sprint</Text>
            {sprints.map((sprint: SprintSummary) => {
              const active = sprint.id === selectedSprintId;
              return (
                <TouchableOpacity
                  key={sprint.id}
                  activeOpacity={0.78}
                  style={[modal.option, active && modal.optionActive]}
                  onPress={() => {
                    selectSprint(sprint.id);
                    setShowSprintModal(false);
                  }}
                >
                  <View style={[modal.optionDot, { backgroundColor: active ? T.primary : '#CBD5E1' }]} />
                  <Text style={modal.optionText}>{sprint.sprintName || sprint.name || `Sprint #${sprint.id}`}</Text>
                  {active && <Text style={modal.currentText}>Selected</Text>}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity activeOpacity={0.8} onPress={() => setShowSprintModal(false)} style={modal.secondaryBtn}>
              <Text style={modal.secondaryText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      <Modal visible={!!taskTarget} transparent animationType="slide">
        <SafeAreaView style={modal.safe}>
          <View style={modal.sheet}>
            <View style={modal.handle} />
            <Text style={modal.title}>New task</Text>
            <Text style={modal.subtitle}>{taskTarget?.columnName}</Text>
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
            <TouchableOpacity activeOpacity={0.8} onPress={() => setTaskTarget(null)} style={modal.secondaryBtn}>
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
            <Text style={modal.subtitle}>Add another sprint workflow stage</Text>
            <TextInput
              style={modal.input}
              value={newColumnName}
              onChangeText={setNewColumnName}
              placeholder="Column name"
              placeholderTextColor="#94A3B8"
              editable={!submitting}
              autoFocus
            />
            <TouchableOpacity activeOpacity={0.85} disabled={submitting || !newColumnName.trim()} onPress={submitAddColumn} style={[modal.primaryBtn, (!newColumnName.trim() || submitting) && modal.disabled]}>
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
  hero: { backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 12 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  boardMark: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#8B5CF6', alignItems: 'center', justifyContent: 'center' },
  heroTitleWrap: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 10, fontWeight: '800', color: '#94A3B8', letterSpacing: 1 },
  title: { fontSize: 20, fontWeight: '900', color: '#0F172A', marginTop: 2 },
  sprintSelect: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sprintLabel: { fontSize: 10, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.8 },
  sprintName: { fontSize: 15, fontWeight: '900', color: '#0F172A', marginTop: 2 },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressTrack: { flex: 1, height: 6, borderRadius: 999, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999, backgroundColor: '#22C55E' },
  progressText: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metric: { flex: 1, borderRadius: 12, borderWidth: 1, paddingVertical: 10, alignItems: 'center' },
  metricValue: { fontSize: 20, fontWeight: '900' },
  metricLabel: { fontSize: 10, fontWeight: '800', color: '#64748B', letterSpacing: 0.6, textTransform: 'uppercase' },
  errorBox: { borderRadius: 12, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 10 },
  errorText: { fontSize: 12, color: '#991B1B', fontWeight: '700' },
  loadingWrap: { paddingVertical: 34, alignItems: 'center', gap: 10 },
  loadingText: { fontSize: 13, color: '#64748B', fontWeight: '700' },
  emptyBoard: { margin: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', padding: 24, alignItems: 'center', gap: 6 },
  emptyBoardTitle: { fontSize: 16, fontWeight: '900', color: '#0F172A' },
  emptyBoardText: { fontSize: 12, fontWeight: '700', color: '#64748B', textAlign: 'center' },
  boardRow: { paddingHorizontal: 12, paddingTop: 14, gap: 14 },
  addColumnCard: { minHeight: 360, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: '#DDD6FE', backgroundColor: '#F5F3FF', alignItems: 'center', justifyContent: 'center', gap: 10 },
  addColumnIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#DDD6FE', alignItems: 'center', justifyContent: 'center' },
  addColumnText: { fontSize: 15, fontWeight: '900', color: T.primary },
  bottomPad: { height: 94 },
});

const columnStyles = StyleSheet.create({
  card: { backgroundColor: '#F8F9FB', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.95)', overflow: 'hidden', minHeight: 360 },
  accent: { height: 5 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 14, paddingVertical: 12 },
  headerLeft: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  title: { flex: 1, fontSize: 15, fontWeight: '900', color: '#0F172A' },
  countPill: { minWidth: 32, height: 28, paddingHorizontal: 9, borderRadius: 999, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  countText: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  body: { paddingHorizontal: 12, paddingBottom: 12, gap: 10 },
  emptyState: { minHeight: 128, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 13, fontWeight: '900', color: '#64748B' },
  addTaskBtn: { marginHorizontal: 12, marginBottom: 12, height: 42, borderRadius: 12, borderWidth: 1, borderColor: '#BFDBFE', backgroundColor: '#EFF6FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  addTaskText: { fontSize: 13, fontWeight: '900', color: T.primary },
});

const taskStyles = StyleSheet.create({
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 13, gap: 10, ...shadow },
  priority: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  priorityDot: { width: 6, height: 6, borderRadius: 3 },
  priorityText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  title: { fontSize: 14, fontWeight: '900', color: '#0F172A', lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  codePill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6, backgroundColor: '#EEF2FF' },
  codeText: { fontSize: 10, fontWeight: '900', color: '#4338CA' },
  dueDate: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  labelPill: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1 },
  labelText: { fontSize: 10, fontWeight: '900' },
  footerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 26, height: 26, borderRadius: 13, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 9, color: '#FFFFFF', fontWeight: '900' },
  assigneeName: { fontSize: 11, fontWeight: '800', color: '#64748B', flex: 1 },
});

const modal = StyleSheet.create({
  safe: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.38)' },
  sheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 22, gap: 10 },
  handle: { width: 40, height: 4, borderRadius: 999, backgroundColor: '#CBD5E1', alignSelf: 'center', marginBottom: 8 },
  title: { fontSize: 18, fontWeight: '900', color: '#0F172A' },
  subtitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: -4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  optionActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  optionDot: { width: 11, height: 11, borderRadius: 6 },
  optionText: { flex: 1, fontSize: 14, fontWeight: '800', color: '#0F172A' },
  currentText: { fontSize: 11, fontWeight: '900', color: T.primary },
  input: { minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', paddingHorizontal: 14, fontSize: 14, color: '#0F172A' },
  primaryBtn: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: T.primary },
  disabled: { opacity: 0.55 },
  primaryText: { fontSize: 14, fontWeight: '900', color: '#FFFFFF' },
  secondaryBtn: { minHeight: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  secondaryText: { fontSize: 14, fontWeight: '900', color: '#64748B' },
});

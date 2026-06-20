import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { T } from '../../constants/tokens';
import { RecurringTask, taskService } from '../../services/task-service';

function ruleLabel(task: RecurringTask) {
  if (!task.recurrenceRule) return '—';
  const rule = task.recurrenceRule.toUpperCase();
  if (rule.startsWith('CUSTOM_')) {
    const unit = rule.replace('CUSTOM_', '').toLowerCase();
    const interval = task.customInterval ?? 1;
    return `Every ${interval} ${interval === 1 ? unit.slice(0, -1) : unit}`;
  }
  return rule.charAt(0) + rule.slice(1).toLowerCase();
}

function endConditionLabel(task: RecurringTask) {
  if (task.recurrenceEnd) {
    return `Ends ${new Date(`${task.recurrenceEnd}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', year: 'numeric',
    })}`;
  }
  if (task.recurrenceLimit) return `Limit: ${task.recurrenceLimit} occurrences`;
  return 'Never ends';
}

function nextLabel(task: RecurringTask) {
  if (!task.recurrenceActive) return 'Paused';
  if (!task.nextOccurrence) return '—';
  return new Date(`${task.nextOccurrence}T00:00:00`).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric',
  });
}

export default function RecurringSchedulesManager({ projectId }: { projectId: number }) {
  const [tasks, setTasks] = useState<RecurringTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const all = await taskService.listAllByProject(projectId);
      const recurring = (Array.isArray(all) ? all : []).filter(
        (t: RecurringTask) => t.recurrenceRule != null,
      );
      setTasks(recurring as RecurringTask[]);
    } catch {
      Alert.alert('Error', 'Failed to load recurring schedules');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  const handleToggle = async (task: RecurringTask) => {
    setBusyId(task.id);
    const nextActive = !task.recurrenceActive;
    try {
      await taskService.setRecurrence(task.id, { recurrenceActive: nextActive });
      await load();
    } catch {
      Alert.alert('Error', 'Failed to update recurrence status');
    } finally {
      setBusyId(null);
    }
  };

  const handleRemove = (task: RecurringTask) => {
    Alert.alert(
      'Remove schedule',
      'Delete the recurring schedule for this task? It will convert back to a standard task.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setBusyId(task.id);
            try {
              await taskService.setRecurrence(task.id, {
                recurrenceRule: null,
                recurrenceEnd: null,
                customInterval: null,
                recurrenceLimit: null,
              });
              setTasks((prev) => prev.filter((t) => t.id !== task.id));
            } catch {
              Alert.alert('Error', 'Failed to delete recurring schedule');
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <View>
      <View style={styles.infoBanner}>
        <MaterialCommunityIcons name="information-outline" size={16} color={T.primary} />
        <Text style={styles.infoText}>
          Recurring tasks act as templates — the system spawns new occurrences at each interval.
          Pausing stops future occurrences until resumed.
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={T.primary} size="small" />
          <Text style={styles.loadingText}>Loading schedules…</Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="autorenew" size={26} color={T.textMuted} />
          <Text style={styles.emptyTitle}>No recurring schedules</Text>
          <Text style={styles.emptyText}>
            Create a recurrence from a task&apos;s recurrence editor to automate task creation.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {tasks.map((task) => {
            const isBusy = busyId === task.id;
            return (
              <View key={task.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
                    <Text style={styles.taskId}>#{task.id}</Text>
                  </View>
                  <View style={[
                    styles.statusBadge,
                    task.recurrenceActive ? styles.statusActive : styles.statusPaused,
                  ]}>
                    <Text style={[
                      styles.statusBadgeText,
                      { color: task.recurrenceActive ? '#15803D' : '#B45309' },
                    ]}>
                      {task.recurrenceActive ? 'ACTIVE' : 'PAUSED'}
                    </Text>
                  </View>
                </View>

                <View style={styles.metaGrid}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>SCHEDULE</Text>
                    <View style={styles.scheduleChip}>
                      <MaterialCommunityIcons name="autorenew" size={12} color={T.primary} />
                      <Text style={styles.scheduleChipText}>{ruleLabel(task)}</Text>
                    </View>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>NEXT</Text>
                    <Text style={styles.metaValue}>{nextLabel(task)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>ENDS</Text>
                    <Text style={styles.metaValue}>{endConditionLabel(task)}</Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>SPAWNED</Text>
                    <Text style={styles.metaValue}>{task.recurrenceCount}</Text>
                  </View>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, task.recurrenceActive ? styles.pauseBtn : styles.resumeBtn]}
                    onPress={() => handleToggle(task)}
                    disabled={isBusy}
                    activeOpacity={0.8}
                  >
                    {isBusy ? (
                      <ActivityIndicator size="small" color={task.recurrenceActive ? '#B45309' : '#15803D'} />
                    ) : (
                      <MaterialCommunityIcons
                        name={task.recurrenceActive ? 'pause' : 'play'}
                        size={15}
                        color={task.recurrenceActive ? '#B45309' : '#15803D'}
                      />
                    )}
                    <Text style={[
                      styles.actionBtnText,
                      { color: task.recurrenceActive ? '#B45309' : '#15803D' },
                    ]}>
                      {task.recurrenceActive ? 'Pause' : 'Resume'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.removeBtn]}
                    onPress={() => handleRemove(task)}
                    disabled={isBusy}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="trash-can-outline" size={15} color="#EF4444" />
                    <Text style={[styles.actionBtnText, { color: '#EF4444' }]}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  infoBanner: {
    flexDirection: 'row', gap: 9, alignItems: 'flex-start',
    backgroundColor: T.primaryLight, borderRadius: 12, padding: 12, marginBottom: 14,
  },
  infoText: { flex: 1, fontSize: 12, lineHeight: 17, color: T.textSecondary },

  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  loadingText: { color: T.textSecondary, fontSize: 13, fontWeight: '600' },

  empty: { alignItems: 'center', gap: 6, paddingVertical: 24 },
  emptyTitle: { fontSize: 14.5, fontWeight: '800', color: T.textPrimary },
  emptyText: { fontSize: 12.5, color: T.textMuted, textAlign: 'center', paddingHorizontal: 20 },

  card: { backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 14, padding: 14 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  taskTitle: { fontSize: 14.5, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.2, lineHeight: 19 },
  taskId: { fontSize: 11, color: T.textMuted, marginTop: 2, fontWeight: '600' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusActive: { backgroundColor: '#F0FDF4' },
  statusPaused: { backgroundColor: '#FFFBEB' },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 12 },
  metaItem: { width: '50%' },
  metaLabel: { fontSize: 10, fontWeight: '800', color: T.textMuted, letterSpacing: 0.5, marginBottom: 4 },
  metaValue: { fontSize: 13, fontWeight: '600', color: T.textPrimary },
  scheduleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: T.primaryLight, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8,
  },
  scheduleChipText: { fontSize: 11.5, fontWeight: '800', color: T.primary },

  actions: { flexDirection: 'row', gap: 9, marginTop: 14 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 9, borderRadius: 11, borderWidth: 1,
  },
  pauseBtn: { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' },
  resumeBtn: { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' },
  removeBtn: { backgroundColor: '#FEF2F2', borderColor: '#FECACA' },
  actionBtnText: { fontSize: 13, fontWeight: '800' },
});

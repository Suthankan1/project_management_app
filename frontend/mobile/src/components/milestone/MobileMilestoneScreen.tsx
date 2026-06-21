import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { T } from '../../constants/tokens';
import { projectService } from '../../services/project-service';

interface Milestone {
  id: number;
  projectId: number;
  name: string;
  description?: string | null;
  dueDate?: string | null;
  status?: string | null;
  taskCount: number;
  completedTaskCount: number;
  progressPercent: number;
}

const STATUS_TONES: Record<string, { bg: string; text: string; dot: string }> = {
  COMPLETED: { bg: '#F0FDF4', text: '#15803D', dot: '#22C55E' },
  IN_PROGRESS: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  ACTIVE: { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  UPCOMING: { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
  PLANNED: { bg: '#F3F4F6', text: '#374151', dot: '#9CA3AF' },
  OVERDUE: { bg: '#FEF2F2', text: '#B91C1C', dot: '#EF4444' },
};

function statusTone(status?: string | null) {
  return STATUS_TONES[(status || 'PLANNED').toUpperCase()] ?? STATUS_TONES.PLANNED;
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(value?: string | null) {
  const date = parseDate(value);
  if (!date) return null;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isOverdue(milestone: Milestone) {
  const due = parseDate(milestone.dueDate);
  if (!due) return false;
  if ((milestone.status || '').toUpperCase() === 'COMPLETED') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  return due < today;
}

function MilestoneCard({ milestone }: { milestone: Milestone }) {
  const overdue = isOverdue(milestone);
  const tone = overdue ? STATUS_TONES.OVERDUE : statusTone(milestone.status);
  const due = formatDate(milestone.dueDate);
  const progress = Math.max(0, Math.min(100, milestone.progressPercent ?? 0));
  const statusLabel = overdue ? 'OVERDUE' : (milestone.status || 'PLANNED').replace(/_/g, ' ').toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.flag, { backgroundColor: tone.dot + '1A' }]}>
          <MaterialCommunityIcons name="flag-checkered" size={18} color={tone.dot} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardTitle} numberOfLines={2}>{milestone.name}</Text>
          {due ? (
            <View style={styles.dueRow}>
              <MaterialCommunityIcons
                name="calendar-outline"
                size={13}
                color={overdue ? '#DC2626' : T.textMuted}
              />
              <Text style={[styles.dueText, overdue && styles.overdueText]}>{due}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.statusChip, { backgroundColor: tone.bg }]}>
          <Text style={[styles.statusChipText, { color: tone.text }]}>{statusLabel}</Text>
        </View>
      </View>

      {milestone.description ? (
        <Text style={styles.cardDesc} numberOfLines={3}>{milestone.description}</Text>
      ) : null}

      <View style={styles.progressRow}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: tone.dot }]} />
        </View>
        <Text style={styles.progressPct}>{progress}%</Text>
      </View>

      <Text style={styles.taskSummary}>
        {milestone.completedTaskCount}/{milestone.taskCount} tasks completed
      </Text>
    </View>
  );
}

export default function MobileMilestoneScreen({
  projectId,
  projectName,
  topOffset = 0,
}: {
  projectId: number;
  projectName?: string;
  topOffset?: number;
}) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMilestones = useCallback(async (background = false) => {
    if (!projectId) return;
    if (background) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await projectService.getMilestones(projectId);
      setMilestones(Array.isArray(data) ? (data as Milestone[]) : []);
    } catch {
      setError('Failed to load milestones. Pull down to retry.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => {
    void fetchMilestones(false);
  }, [fetchMilestones]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: topOffset }]}>
        <ActivityIndicator color={T.primary} />
        <Text style={styles.centerText}>Loading milestones...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: topOffset }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => fetchMilestones(true)} tintColor={T.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name="flag-checkered" size={22} color={T.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow} numberOfLines={1}>{projectName || 'Project'}</Text>
          <Text style={styles.title}>Milestones</Text>
        </View>
        <View style={styles.totalBadge}>
          <Text style={styles.totalBadgeText}>{milestones.length}</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#B91C1C" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {milestones.length ? (
        milestones.map((milestone) => (
          <MilestoneCard key={milestone.id} milestone={milestone} />
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="flag-outline" size={34} color={T.textMuted} />
          <Text style={styles.emptyTitle}>No milestones yet</Text>
          <Text style={styles.emptyText}>Milestones created for this project will appear here.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bgSecondary },
  content: { padding: 16, paddingBottom: 48 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  centerText: { color: T.textSecondary, fontSize: 13, fontWeight: '600' },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconWrap: {
    width: 42, height: 42, borderRadius: 13,
    backgroundColor: T.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  eyebrow: { fontSize: 11, fontWeight: '700', color: T.textMuted, letterSpacing: 0.6, textTransform: 'uppercase' },
  title: { fontSize: 22, fontWeight: '900', color: T.textPrimary, letterSpacing: -0.5 },
  totalBadge: {
    minWidth: 34, height: 28, paddingHorizontal: 10, borderRadius: 14,
    backgroundColor: T.bg, borderWidth: 1, borderColor: T.border,
    alignItems: 'center', justifyContent: 'center',
  },
  totalBadgeText: { fontSize: 13, fontWeight: '800', color: T.textPrimary },

  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1,
    borderRadius: 12, padding: 12, marginBottom: 14,
  },
  errorText: { color: '#B91C1C', fontSize: 13, fontWeight: '600', flex: 1 },

  card: {
    backgroundColor: T.bg, borderRadius: 16, borderWidth: 1, borderColor: T.border,
    padding: 15, marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  flag: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: T.textPrimary, letterSpacing: -0.2, lineHeight: 20 },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  dueText: { fontSize: 12, fontWeight: '600', color: T.textSecondary },
  overdueText: { color: '#DC2626', fontWeight: '800' },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusChipText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },

  cardDesc: { fontSize: 13, color: T.textSecondary, lineHeight: 18, marginTop: 11 },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  progressTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: T.bgTertiary, overflow: 'hidden' },
  progressFill: { height: 8, borderRadius: 4 },
  progressPct: { fontSize: 12.5, fontWeight: '800', color: T.textPrimary, minWidth: 38, textAlign: 'right' },

  taskSummary: { fontSize: 12, fontWeight: '600', color: T.textMuted, marginTop: 8 },

  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 64 },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: T.textPrimary },
  emptyText: { fontSize: 13, color: T.textMuted, textAlign: 'center', paddingHorizontal: 40 },
});

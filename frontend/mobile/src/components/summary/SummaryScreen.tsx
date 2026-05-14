import React, { useRef, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Animated,
  TouchableOpacity, RefreshControl, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle, Path } from 'react-native-svg';
import { useProjectSummary } from '../../hooks/useProjectSummary';

const BLUE = '#155DFC';
const GREEN = '#00875A';
const AMBER = '#F59E0B';
const RED = '#EF4444';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(d?: string | null) {
  if (!d) return '';
  const mins = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
  return `${Math.floor(mins / 1440)}d ago`;
}

function fmtDate(d?: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Fade-in wrapper ──────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const op = useRef(new Animated.Value(0)).current;
  const ty = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(op, { toValue: 1, duration: 340, delay, useNativeDriver: true }),
      Animated.spring(ty, { toValue: 0, delay, useNativeDriver: true, tension: 160, friction: 20 }),
    ]).start();
  }, []);
  return <Animated.View style={{ opacity: op, transform: [{ translateY: ty }] }}>{children}</Animated.View>;
}

// ─── Glass Card ───────────────────────────────────────────────────────────────

function Card({ title, accent = BLUE, children }: { title: string; accent?: string; children: React.ReactNode }) {
  return (
    <View style={s.card}>
      <View style={[s.cardAccent, { backgroundColor: accent }]} />
      <Text style={s.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ h = 14, w = '100%' as any, mb = 8 }) {
  const op = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(op, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(op, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return <Animated.View style={{ height: h, width: w, backgroundColor: '#E2E8F0', borderRadius: 6, marginBottom: mb, opacity: op }} />;
}

// ─── Circular Progress ────────────────────────────────────────────────────────

function CircularProgress({ pct }: { pct: number }) {
  const R = 36, C = 2 * Math.PI * R;
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: pct, duration: 1200, useNativeDriver: false }).start();
  }, [pct]);
  const offset = anim.interpolate({ inputRange: [0, 100], outputRange: [C, 0] });
  const AnimCircle = Animated.createAnimatedComponent(Circle);
  const label = pct === 100 ? 'Complete' : pct >= 50 ? 'On Track' : 'At Risk';
  const color = pct === 100 ? GREEN : pct >= 50 ? BLUE : AMBER;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
      <View style={{ width: 88, height: 88, alignItems: 'center', justifyContent: 'center' }}>
        <Svg width={88} height={88} viewBox="0 0 88 88" style={{ position: 'absolute' }}>
          <Circle cx={44} cy={44} r={R} fill="none" stroke="#F1F5F9" strokeWidth={8} />
          <AnimCircle cx={44} cy={44} r={R} fill="none" stroke={color} strokeWidth={8}
            strokeLinecap="round" strokeDasharray={C}
            strokeDashoffset={offset}
            transform="rotate(-90 44 44)" />
        </Svg>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0F172A' }}>{Math.round(pct)}%</Text>
      </View>
      <View>
        <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '500' }}>Overall Progress</Text>
        <Text style={{ fontSize: 22, fontWeight: '800', color, marginTop: 2 }}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Metric Pill ──────────────────────────────────────────────────────────────

function MetricPill({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  return (
    <View style={[s.pill, { borderColor: color + '22', backgroundColor: color + '0D' }]}>
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>{value}</Text>
      <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748B', textAlign: 'center' }}>{label}</Text>
    </View>
  );
}

// ─── Activity Item ────────────────────────────────────────────────────────────

function ActivityItem({ task }: { task: { id: number; title: string; assigneeName?: string; status?: string; updatedAt?: string } }) {
  const done = task.status === 'DONE';
  const initials = task.assigneeName?.substring(0, 2).toUpperCase() || '??';
  return (
    <View style={s.activityRow}>
      <View style={[s.avatar, { backgroundColor: done ? GREEN : BLUE }]}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.activityAction} numberOfLines={1}>
          <Text style={{ fontWeight: '700' }}>{task.assigneeName || 'Someone'}</Text>
          {done ? ' completed ' : ' updated '}
          <Text style={{ color: BLUE }}>TSK-{task.id}</Text>
        </Text>
        <Text style={s.activitySub} numberOfLines={1}>{task.title}</Text>
      </View>
      <Text style={s.timeAgo}>{timeAgo(task.updatedAt)}</Text>
    </View>
  );
}

// ─── Due Task Item ────────────────────────────────────────────────────────────

function DueItem({ task }: { task: { id: number; title: string; dueDate?: string; assigneeName?: string } }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const diff = due ? Math.ceil((due.getTime() - today.getTime()) / 86400000) : null;
  const urgency = diff === 0 ? RED : diff !== null && diff <= 2 ? AMBER : BLUE;
  const label = diff === null ? '' : diff === 0 ? 'Due Today' : `In ${diff}d`;
  return (
    <View style={s.listRow}>
      <View style={{ flex: 1 }}>
        <Text style={s.listTitle} numberOfLines={1}>{task.title}</Text>
        <Text style={s.listSub}>{task.assigneeName || 'Unassigned'} · TSK-{task.id}</Text>
      </View>
      {label ? <View style={[s.badge, { backgroundColor: urgency + '18', borderColor: urgency + '33' }]}>
        <Text style={{ fontSize: 10, fontWeight: '700', color: urgency }}>{label}</Text>
      </View> : null}
    </View>
  );
}

// ─── Completed Task Item ──────────────────────────────────────────────────────

function CompletedItem({ task, rank }: { task: { id: number; title: string; assigneeName?: string; updatedAt?: string }; rank: number }) {
  const initials = task.assigneeName?.substring(0, 2).toUpperCase() || '??';
  return (
    <View style={s.listRow}>
      <Text style={{ fontSize: 10, fontWeight: '900', color: '#CBD5E1', width: 18 }}>#{rank}</Text>
      <View style={[s.avatar, { backgroundColor: GREEN }]}>
        <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>{initials}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.listTitle} numberOfLines={1}>{task.title}</Text>
        <Text style={s.listSub}>by {task.assigneeName || 'Someone'}</Text>
      </View>
      <Text style={s.timeAgo}>{timeAgo(task.updatedAt)}</Text>
    </View>
  );
}

// ─── Milestone Item ───────────────────────────────────────────────────────────

function MilestoneItem({ m }: { m: { id: number; name: string; status: string; dueDate?: string; taskCount?: number } }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const due = m.dueDate ? new Date(m.dueDate) : null;
  const diff = due ? Math.ceil((due.getTime() - today.getTime()) / 86400000) : null;
  const overdue = due && due < today && m.status !== 'COMPLETED';
  const statusColor: Record<string, string> = { OPEN: BLUE, IN_PROGRESS: AMBER, COMPLETED: GREEN, CANCELLED: '#94A3B8' };
  const c = statusColor[m.status] || BLUE;
  return (
    <View style={[s.listRow, { alignItems: 'flex-start' }]}>
      <Text style={{ fontSize: 14, marginTop: 1 }}>🚩</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.listTitle} numberOfLines={1}>{m.name}</Text>
        <Text style={[s.listSub, overdue && { color: RED }]}>
          {due ? fmtDate(m.dueDate) : 'No date'} {diff !== null ? (overdue ? `· ${Math.abs(diff)}d overdue` : diff === 0 ? '· Due today' : `· In ${diff}d`) : ''}
        </Text>
      </View>
      <View style={[s.badge, { backgroundColor: c + '18', borderColor: c + '33' }]}>
        <Text style={{ fontSize: 9, fontWeight: '700', color: c }}>{m.status.replace('_', ' ')}</Text>
      </View>
    </View>
  );
}

// ─── Priority Bar Chart ───────────────────────────────────────────────────────

function PriorityBars({ tasks }: { tasks: { priority?: string }[] }) {
  const priorities = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
  const colors: Record<string, string> = { URGENT: RED, HIGH: AMBER, MEDIUM: BLUE, LOW: '#94A3B8' };
  const counts = priorities.map(p => ({ key: p, count: tasks.filter(t => (t.priority || 'MEDIUM').toUpperCase() === p).length }));
  const max = Math.max(...counts.map(c => c.count), 1);
  return (
    <View style={{ gap: 8 }}>
      {counts.map(({ key, count }) => (
        <View key={key} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ width: 54, fontSize: 10, fontWeight: '700', color: '#64748B' }}>{key.charAt(0) + key.slice(1).toLowerCase()}</Text>
          <View style={{ flex: 1, height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' }}>
            <Animated.View style={{ height: 8, borderRadius: 4, backgroundColor: colors[key], width: `${(count / max) * 100}%` }} />
          </View>
          <Text style={{ width: 20, fontSize: 11, fontWeight: '800', color: '#334155', textAlign: 'right' }}>{count}</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function SummaryScreen({ projectId, projectName }: { projectId: number; projectName?: string }) {
  const { data, milestones, loading, error, refresh } = useProjectSummary(projectId);

  const recentActivity = useMemo(() =>
    [...(data?.tasks || [])].filter(t => t.updatedAt).sort((a, b) => new Date(b.updatedAt!).getTime() - new Date(a.updatedAt!).getTime()).slice(0, 6),
    [data?.tasks]);

  const dueTasks = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const limit = new Date(today); limit.setDate(limit.getDate() + 5); limit.setHours(23, 59, 59, 999);
    return [...(data?.tasks || [])].filter(t => {
      if (!t.dueDate || t.status === 'DONE') return false;
      const d = new Date(t.dueDate);
      return d >= today && d <= limit;
    }).sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()).slice(0, 5);
  }, [data?.tasks]);

  const completed = useMemo(() =>
    [...(data?.tasks || [])].filter(t => t.status === 'DONE').sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()).slice(0, 5),
    [data?.tasks]);

  const upcomingMilestones = useMemo(() =>
    [...milestones].filter(m => m.status === 'OPEN' || m.status === 'IN_PROGRESS').sort((a, b) => {
      if (!a.dueDate) return 1; if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    }).slice(0, 4),
    [milestones]);

  const pct = data ? (data.metrics.totalTasks > 0 ? (data.metrics.completedTasks / data.metrics.totalTasks) * 100 : 0) : 0;

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle} numberOfLines={1}>{projectName || 'Summary'}</Text>
        <Text style={s.headerSub}>Project Overview</Text>
      </View>

      <ScrollView
        style={{ flex: 1, backgroundColor: '#F7F8FA' }}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={BLUE} colors={[BLUE]} />}
      >
        {loading ? (
          <View style={{ padding: 20, gap: 16 }}>
            {[1, 2, 3, 4].map(i => <View key={i} style={s.card}><Skeleton h={100} /></View>)}
          </View>
        ) : error ? (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
            <TouchableOpacity style={s.retryBtn} onPress={refresh}>
              <Text style={{ color: BLUE, fontWeight: '700', fontSize: 13 }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* ── 1. Overall Progress ── */}
            <FadeIn delay={0}>
              <Card title="Overall Progress">
                <CircularProgress pct={pct} />
              </Card>
            </FadeIn>

            {/* ── 2. Metric Pills ── */}
            <FadeIn delay={60}>
              <View style={s.pillRow}>
                <MetricPill label="Total Tasks" value={data!.metrics.totalTasks} color={BLUE} icon="📋" />
                <MetricPill label="Completed" value={data!.metrics.completedTasks} color={GREEN} icon="✅" />
                <MetricPill label="Overdue" value={data!.metrics.overdueTasks} color={RED} icon="⚠️" />
              </View>
            </FadeIn>

            {/* ── 3. Task Priority ── */}
            <FadeIn delay={120}>
              <Card title="Task Priority" accent={AMBER}>
                <PriorityBars tasks={data!.tasks} />
              </Card>
            </FadeIn>

            {/* ── 4. Recent Activity ── */}
            <FadeIn delay={180}>
              <Card title="Recent Activity">
                {recentActivity.length === 0
                  ? <Text style={s.empty}>No recent activity</Text>
                  : recentActivity.map(t => <ActivityItem key={t.id} task={t} />)}
              </Card>
            </FadeIn>

            {/* ── 5. Due in 5 Days ── */}
            <FadeIn delay={240}>
              <Card title="Due in 5 Days" accent={RED}>
                {dueTasks.length === 0
                  ? <Text style={s.empty}>No tasks due in the next 5 days 🎉</Text>
                  : dueTasks.map(t => <DueItem key={t.id} task={t} />)}
              </Card>
            </FadeIn>

            {/* ── 6. Recently Completed ── */}
            <FadeIn delay={300}>
              <Card title="Recently Completed" accent={GREEN}>
                {completed.length === 0
                  ? <Text style={s.empty}>No completed tasks yet</Text>
                  : completed.map((t, i) => <CompletedItem key={t.id} task={t} rank={i + 1} />)}
              </Card>
            </FadeIn>

            {/* ── 7. Upcoming Milestones ── */}
            <FadeIn delay={360}>
              <Card title="Upcoming Milestones" accent={AMBER}>
                {upcomingMilestones.length === 0
                  ? <Text style={s.empty}>No upcoming milestones</Text>
                  : upcomingMilestones.map(m => <MilestoneItem key={m.id} m={m} />)}
              </Card>
            </FadeIn>
          </>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 12, fontWeight: '600', color: '#94A3B8', marginTop: 2 },
  scrollContent: { padding: 16, gap: 14 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    ...Platform.select({
      ios: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  cardAccent: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  cardTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 6 },
  pillRow: { flexDirection: 'row', gap: 10 },
  pill: {
    flex: 1, borderRadius: 14, borderWidth: 1, padding: 12,
    alignItems: 'center', gap: 4,
  },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 0.8, borderBottomColor: '#F8FAFC' },
  listTitle: { fontSize: 13, fontWeight: '700', color: '#0F172A' },
  listSub: { fontSize: 11, fontWeight: '500', color: '#94A3B8', marginTop: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  activityRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 0.8, borderBottomColor: '#F8FAFC' },
  activityAction: { fontSize: 12.5, color: '#334155' },
  activitySub: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  timeAgo: { fontSize: 10, color: '#CBD5E1', fontWeight: '600' },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  errorBox: { margin: 20, padding: 20, backgroundColor: '#FEF2F2', borderRadius: 14, alignItems: 'center', gap: 12 },
  errorText: { fontSize: 13, color: '#DC2626', textAlign: 'center', fontWeight: '500' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: BLUE },
});

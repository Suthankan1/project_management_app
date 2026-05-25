import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { T, STATUS_MAP, StatusKey } from '../../constants/tokens';
import {
  TimelineMilestone,
  TimelineTask,
  useMobileTimeline,
} from '../../hooks/useMobileTimeline';

type ZoomLevel = 'Day' | 'Week' | 'Month';
type GroupBy = 'none' | 'status' | 'assignee' | 'milestone';

const ZOOM_WIDTHS: Record<ZoomLevel, number> = { Day: 34, Week: 22, Month: 15 };
const DAY_MS = 24 * 60 * 60 * 1000;

const shadow = Platform.select({
  ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18 },
  android: { elevation: 3 },
});

function Icon({ name, color = T.primary, size = 18 }: { name: 'timeline' | 'search' | 'calendar' | 'warning' | 'diamond' | 'user' | 'flag'; color?: string; size?: number }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: color, strokeWidth: 2.2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'search') return <Svg {...p}><Circle cx={11} cy={11} r={8} /><Path d="m21 21-4.3-4.3" /></Svg>;
  if (name === 'calendar') return <Svg {...p}><Rect x={3} y={4} width={18} height={18} rx={3} /><Path d="M16 2v4" /><Path d="M8 2v4" /><Path d="M3 10h18" /></Svg>;
  if (name === 'warning') return <Svg {...p}><Path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" /><Path d="M12 9v4" /><Path d="M12 17h.01" /></Svg>;
  if (name === 'diamond') return <Svg {...p}><Path d="M12 2 22 12 12 22 2 12 12 2Z" /></Svg>;
  if (name === 'user') return <Svg {...p}><Circle cx={12} cy={7} r={4} /><Path d="M5 21v-2a7 7 0 0 1 14 0v2" /></Svg>;
  if (name === 'flag') return <Svg {...p}><Path d="M4 22V4" /><Path d="M4 5h12l-1 5 1 5H4" /></Svg>;
  return <Svg {...p}><Path d="M4 19V5" /><Path d="M8 19V9" /><Path d="M12 19V7" /><Path d="M16 19V11" /><Path d="M20 19V4" /></Svg>;
}

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function startOfWeek(date: Date) {
  const next = new Date(date);
  const day = next.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(next, diff);
}

function endOfWeek(date: Date) {
  return addDays(startOfWeek(date), 6);
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value?: string | null) {
  const date = parseDate(value);
  if (!date) return 'No date';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function initials(name?: string | null) {
  if (!name) return '--';
  return name.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
}

function statusMeta(status?: string | null) {
  return STATUS_MAP[(status || 'TODO') as StatusKey] ?? T.statusTodo;
}

function milestoneName(task: TimelineTask, milestones: TimelineMilestone[]) {
  return task.milestoneName || task.milestoneTitle || milestones.find((item) => item.id === task.milestoneId)?.name || 'No milestone';
}

function TimelineBackdrop() {
  return (
    <View pointerEvents="none" style={s.backdrop}>
      <LinearGradient
        colors={['rgba(21, 93, 252, 0.15)', 'rgba(34, 197, 94, 0.09)', 'rgba(247, 248, 250, 0)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.backdropTop}
      />
      <LinearGradient
        colors={['rgba(139, 92, 246, 0.10)', 'rgba(245, 158, 11, 0.07)', 'rgba(247, 248, 250, 0)']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={s.backdropBottom}
      />
    </View>
  );
}

function Stat({ label, value, color, icon }: { label: string; value: number; color: string; icon: 'timeline' | 'calendar' | 'warning' | 'diamond' }) {
  return (
    <View style={[s.stat, { backgroundColor: `${color}10`, borderColor: `${color}24` }]}>
      <Icon name={icon} color={color} size={14} />
      <Text style={[s.statValue, { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function Header({ stats }: { stats: { total: number; scheduled: number; overdue: number; milestones: number } }) {
  return (
    <View style={s.hero}>
      <View pointerEvents="none" style={s.glassLayer}>
        <BlurView intensity={28} tint="light" style={StyleSheet.absoluteFill} />
        <View style={s.glassWash} />
      </View>
      <View style={s.heroTop}>
        <LinearGradient colors={[T.primary, '#4D8BFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.heroIcon}>
          <Icon name="timeline" color="#FFFFFF" size={21} />
        </LinearGradient>
        <View style={s.heroTitleWrap}>
          <Text style={s.eyebrow}>PROJECT TIMELINE</Text>
          <Text style={s.title}>Planning view</Text>
          <Text style={s.heroSub}>Tasks mapped by start date and due date.</Text>
        </View>
      </View>
      <View style={s.statRow}>
        <Stat label="Tasks" value={stats.total} color="#0F172A" icon="timeline" />
        <Stat label="Scheduled" value={stats.scheduled} color={T.primary} icon="calendar" />
        <Stat label="Overdue" value={stats.overdue} color="#DC2626" icon="warning" />
        <Stat label="Milestones" value={stats.milestones} color="#7C3AED" icon="diamond" />
      </View>
    </View>
  );
}

function FilterControls({
  search,
  setSearch,
  zoom,
  setZoom,
  groupBy,
  setGroupBy,
}: {
  search: string;
  setSearch: (value: string) => void;
  zoom: ZoomLevel;
  setZoom: (value: ZoomLevel) => void;
  groupBy: GroupBy;
  setGroupBy: (value: GroupBy) => void;
}) {
  return (
    <View style={s.controls}>
      <View style={s.searchWrap}>
        <Icon name="search" color="#94A3B8" size={15} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search timeline..."
          placeholderTextColor="#94A3B8"
          style={s.searchInput}
        />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chipRow}>
        {(['Day', 'Week', 'Month'] as ZoomLevel[]).map((item) => (
          <TouchableOpacity key={item} activeOpacity={0.8} onPress={() => setZoom(item)} style={[s.chip, zoom === item && s.chipActive]}>
            <Text style={[s.chipText, zoom === item && s.chipTextActive]}>{item}</Text>
          </TouchableOpacity>
        ))}
        {([
          ['none', 'All'],
          ['status', 'Status'],
          ['assignee', 'Assignee'],
          ['milestone', 'Milestone'],
        ] as Array<[GroupBy, string]>).map(([key, label]) => (
          <TouchableOpacity key={key} activeOpacity={0.8} onPress={() => setGroupBy(key)} style={[s.chip, groupBy === key && s.chipActive]}>
            <Text style={[s.chipText, groupBy === key && s.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

export default function MobileTimelineScreen({
  projectId,
  topOffset = 0,
}: {
  projectId: number;
  projectName?: string;
  topOffset?: number;
}) {
  const { width } = useWindowDimensions();
  const timeline = useMobileTimeline(projectId);
  const [zoom, setZoom] = useState<ZoomLevel>('Week');
  const [groupBy, setGroupBy] = useState<GroupBy>('none');
  const [search, setSearch] = useState('');

  const dayWidth = ZOOM_WIDTHS[zoom];
  const taskColWidth = Math.min(Math.max(width * 0.42, 142), 190);

  const computed = useMemo(() => {
    const term = search.trim().toLowerCase();
    const dated: Array<TimelineTask & { startObj: Date; dueObj: Date }> = [];
    const noDates: TimelineTask[] = [];

    timeline.tasks
      .filter((task) => {
        if (!term) return true;
        return [
          task.title,
          task.assigneeName || '',
          task.status || '',
          task.priority || '',
          milestoneName(task, timeline.milestones),
          `tsk-${task.projectTaskNumber ?? task.id}`,
        ].some((value) => value.toLowerCase().includes(term));
      })
      .forEach((task) => {
        const start = parseDate(task.startDate) ?? parseDate(task.createdAt) ?? parseDate(task.dueDate);
        const due = parseDate(task.dueDate) ?? start;
        if (!start || !due) {
          noDates.push(task);
          return;
        }
        dated.push({ ...task, startObj: start <= due ? start : due, dueObj: start <= due ? due : start });
      });

    dated.sort((a, b) => a.startObj.getTime() - b.startObj.getTime() || a.dueObj.getTime() - b.dueObj.getTime());

    if (!dated.length) return { dated, noDates, days: [] as Date[], timelineWidth: 0, todayIndex: -1, groups: [] as Array<{ label: string; tasks: typeof dated }> };

    const minStart = dated.reduce((min, task) => task.startObj < min ? task.startObj : min, dated[0].startObj);
    const maxDue = dated.reduce((max, task) => task.dueObj > max ? task.dueObj : max, dated[0].dueObj);
    const first = startOfWeek(minStart);
    const last = endOfWeek(maxDue);
    const days: Date[] = [];
    for (let cursor = new Date(first); cursor <= last; cursor = addDays(cursor, 1)) days.push(new Date(cursor));

    const todayKey = dateKey(new Date());
    const todayIndex = days.findIndex((day) => dateKey(day) === todayKey);
    const timelineWidth = days.length * dayWidth;

    const map = new Map<string, typeof dated>();
    dated.forEach((task) => {
      const label = groupBy === 'status'
        ? (task.status || 'TODO').replace(/_/g, ' ')
        : groupBy === 'assignee'
          ? task.assigneeName || 'Unassigned'
          : groupBy === 'milestone'
            ? milestoneName(task, timeline.milestones)
            : '';
      if (!map.has(label)) map.set(label, []);
      map.get(label)!.push(task);
    });

    return {
      dated,
      noDates,
      days,
      timelineWidth,
      todayIndex,
      groups: Array.from(map.entries()).map(([label, tasks]) => ({ label, tasks })),
    };
  }, [dayWidth, groupBy, search, timeline.milestones, timeline.tasks]);

  if (timeline.loading) {
    return (
      <View style={[s.loading, { paddingTop: topOffset }]}>
        <ActivityIndicator color={T.primary} />
        <Text style={s.loadingText}>Loading timeline...</Text>
      </View>
    );
  }

  return (
    <View style={s.safe}>
      <TimelineBackdrop />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingTop: topOffset }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={timeline.refreshing} onRefresh={timeline.refresh} tintColor={T.primary} colors={[T.primary]} />}
      >
        <Header stats={timeline.stats} />
        <FilterControls search={search} setSearch={setSearch} zoom={zoom} setZoom={setZoom} groupBy={groupBy} setGroupBy={setGroupBy} />

        {!!timeline.error && (
          <View style={s.errorBox}>
            <Text style={s.errorTitle}>Timeline error</Text>
            <Text style={s.errorText}>{timeline.error}</Text>
          </View>
        )}

        {computed.dated.length === 0 ? (
          <View style={s.emptyPanel}>
            <Icon name="calendar" color="#94A3B8" size={32} />
            <Text style={s.emptyTitle}>No scheduled tasks</Text>
            <Text style={s.emptyText}>Add start dates or due dates to see work on the timeline.</Text>
          </View>
        ) : (
          <View style={s.timelineCard}>
            <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: taskColWidth + computed.timelineWidth }}>
              <View>
                <View style={s.timelineHeader}>
                  <View style={[s.taskHeaderCell, { width: taskColWidth }]}>
                    <Text style={s.headerLabel}>Task</Text>
                  </View>
                  <View style={[s.daysRow, { width: computed.timelineWidth }]}>
                    {computed.days.map((day) => {
                      const isToday = dateKey(day) === dateKey(new Date());
                      return (
                        <View key={day.toISOString()} style={[s.dayCell, { width: dayWidth }, isToday && s.todayHeader]}>
                          <Text style={[s.dayNumber, isToday && s.todayText]}>{zoom === 'Month' ? day.getDate() : day.toLocaleDateString('en-US', { day: 'numeric' })}</Text>
                          {zoom === 'Day' && <Text style={s.dayName}>{day.toLocaleDateString('en-US', { weekday: 'narrow' })}</Text>}
                        </View>
                      );
                    })}
                  </View>
                </View>

                {computed.groups.map((group) => (
                  <View key={group.label || 'all'}>
                    {!!group.label && (
                      <View style={[s.groupHeader, { width: taskColWidth + computed.timelineWidth }]}>
                        <Text style={s.groupTitle}>{group.label}</Text>
                      </View>
                    )}
                    {group.tasks.map((task) => (
                      <TimelineRow
                        key={task.id}
                        task={task}
                        days={computed.days}
                        dayWidth={dayWidth}
                        taskColWidth={taskColWidth}
                        timelineWidth={computed.timelineWidth}
                        todayIndex={computed.todayIndex}
                        milestones={timeline.milestones}
                      />
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {computed.noDates.length > 0 && (
          <View style={s.noDateCard}>
            <Text style={s.noDateTitle}>Tasks without dates</Text>
            {computed.noDates.map((task) => {
              const status = statusMeta(task.status);
              return (
                <View key={task.id} style={s.noDateRow}>
                  <View style={[s.statusDot, { backgroundColor: status.dot }]} />
                  <View style={s.noDateMain}>
                    <Text style={s.noDateTask} numberOfLines={1}>{task.title}</Text>
                    <Text style={s.noDateMeta}>{task.assigneeName || 'Unassigned'} • {(task.status || 'TODO').replace(/_/g, ' ')}</Text>
                  </View>
                  <Text style={s.noDateBadge}>No date</Text>
                </View>
              );
            })}
          </View>
        )}

        <View style={s.bottomPad} />
      </ScrollView>
    </View>
  );
}

function TimelineRow({
  task,
  days,
  dayWidth,
  taskColWidth,
  timelineWidth,
  todayIndex,
  milestones,
}: {
  task: TimelineTask & { startObj: Date; dueObj: Date };
  days: Date[];
  dayWidth: number;
  taskColWidth: number;
  timelineWidth: number;
  todayIndex: number;
  milestones: TimelineMilestone[];
}) {
  const startIndex = Math.max(0, days.findIndex((day) => dateKey(day) === dateKey(task.startObj)));
  const dueIndex = Math.max(startIndex, days.findIndex((day) => dateKey(day) === dateKey(task.dueObj)));
  const duration = Math.max(dueIndex - startIndex + 1, 1);
  const status = statusMeta(task.status);
  const isOverdue = task.dueObj < parseDate(dateKey(new Date()))! && (task.status ?? '').toUpperCase() !== 'DONE';

  return (
    <View style={s.row}>
      <View style={[s.taskCell, { width: taskColWidth }]}>
        <Text style={s.taskCode}>TSK-{task.projectTaskNumber ?? task.id}</Text>
        <Text style={s.taskTitle} numberOfLines={2}>{task.title}</Text>
        <View style={s.metaRow}>
          <View style={s.avatar}><Text style={s.avatarText}>{initials(task.assigneeName)}</Text></View>
          <Text style={s.metaText} numberOfLines={1}>{task.assigneeName || 'Unassigned'}</Text>
        </View>
      </View>
      <View style={[s.gridCell, { width: timelineWidth }]}>
        {days.map((day) => (
          <View key={day.toISOString()} style={[s.gridLine, { width: dayWidth }]} />
        ))}
        {todayIndex >= 0 && <View style={[s.todayLine, { left: todayIndex * dayWidth + dayWidth / 2 }]} />}
        <View
          style={[
            s.bar,
            {
              left: startIndex * dayWidth + 4,
              width: Math.max(duration * dayWidth - 8, 28),
              backgroundColor: status.dot,
            },
            isOverdue && s.barOverdue,
          ]}
        >
          <Text style={s.barText} numberOfLines={1}>{formatDate(task.startDate)} - {formatDate(task.dueDate)}</Text>
        </View>
        {task.milestoneId != null && (
          <View style={[s.milestonePill, { left: Math.max(dueIndex * dayWidth - 18, 2) }]}>
            <Icon name="diamond" color="#7C3AED" size={11} />
            <Text style={s.milestoneText} numberOfLines={1}>{milestoneName(task, milestones)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bgSecondary },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: '#F7F8FA' },
  backdropTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 360 },
  backdropBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 280 },
  scroll: { flex: 1, backgroundColor: 'transparent' },
  content: { paddingHorizontal: 14, gap: 10 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: T.bgSecondary },
  loadingText: { fontSize: 13, fontWeight: '700', color: T.textSecondary },
  hero: { backgroundColor: 'rgba(255, 255, 255, 0.78)', borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.92)', padding: 12, gap: 10, overflow: 'hidden', ...shadow },
  glassLayer: { ...StyleSheet.absoluteFillObject, borderRadius: 20, overflow: 'hidden' },
  glassWash: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255, 255, 255, 0.48)' },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  heroIcon: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  heroTitleWrap: { flex: 1, minWidth: 0 },
  eyebrow: { fontSize: 9, fontWeight: '900', color: '#94A3B8', letterSpacing: 0.9 },
  title: { fontSize: 19, fontWeight: '900', color: '#0F172A', letterSpacing: -0.3 },
  heroSub: { fontSize: 12, fontWeight: '700', color: '#64748B', marginTop: 1 },
  statRow: { flexDirection: 'row', gap: 7 },
  stat: { flex: 1, minHeight: 62, borderRadius: 12, borderWidth: 1, paddingVertical: 6, alignItems: 'center', justifyContent: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: '900' },
  statLabel: { fontSize: 7, fontWeight: '900', color: '#64748B', textTransform: 'uppercase' },
  controls: { backgroundColor: 'rgba(255, 255, 255, 0.84)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.9)', padding: 7, gap: 7, ...shadow },
  searchWrap: { minHeight: 38, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.78)', backgroundColor: 'rgba(248, 250, 252, 0.86)', paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A', paddingVertical: 0 },
  chipRow: { gap: 7 },
  chip: { height: 32, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  chipActive: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  chipText: { fontSize: 12, fontWeight: '900', color: '#64748B' },
  chipTextActive: { color: T.primary },
  errorBox: { borderRadius: 14, borderWidth: 1, borderColor: '#FECACA', backgroundColor: '#FEF2F2', padding: 12 },
  errorTitle: { fontSize: 13, fontWeight: '900', color: '#991B1B' },
  errorText: { fontSize: 12, fontWeight: '700', color: '#B91C1C', marginTop: 2 },
  emptyPanel: { minHeight: 190, borderRadius: 18, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', padding: 20, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '900', color: '#64748B' },
  emptyText: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textAlign: 'center' },
  timelineCard: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.92)', backgroundColor: '#FFFFFF', overflow: 'hidden', ...shadow },
  timelineHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#F8FAFC' },
  taskHeaderCell: { height: 46, paddingHorizontal: 12, justifyContent: 'center', borderRightWidth: 1, borderRightColor: '#E2E8F0' },
  headerLabel: { fontSize: 11, fontWeight: '900', color: '#64748B', textTransform: 'uppercase' },
  daysRow: { flexDirection: 'row' },
  dayCell: { height: 46, borderRightWidth: 1, borderRightColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  todayHeader: { backgroundColor: '#EFF6FF' },
  dayNumber: { fontSize: 11, fontWeight: '900', color: '#64748B' },
  dayName: { fontSize: 9, fontWeight: '800', color: '#94A3B8', marginTop: 1 },
  todayText: { color: T.primary },
  groupHeader: { height: 28, justifyContent: 'center', paddingHorizontal: 12, backgroundColor: '#F8FAFC', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  groupTitle: { fontSize: 11, fontWeight: '900', color: '#64748B', textTransform: 'uppercase' },
  row: { flexDirection: 'row', minHeight: 76, borderBottomWidth: 1, borderBottomColor: '#EEF2F7' },
  taskCell: { paddingHorizontal: 10, paddingVertical: 8, borderRightWidth: 1, borderRightColor: '#E2E8F0', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  taskCode: { fontSize: 10, fontWeight: '900', color: '#64748B' },
  taskTitle: { fontSize: 13, fontWeight: '900', color: '#0F172A', lineHeight: 16, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  avatar: { width: 18, height: 18, borderRadius: 9, backgroundColor: T.primary, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 7, fontWeight: '900', color: '#FFFFFF' },
  metaText: { flex: 1, fontSize: 10, fontWeight: '800', color: '#64748B' },
  gridCell: { position: 'relative', flexDirection: 'row', backgroundColor: '#FFFFFF' },
  gridLine: { borderRightWidth: 1, borderRightColor: '#F1F5F9' },
  todayLine: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: T.primary, opacity: 0.62 },
  bar: { position: 'absolute', top: 20, height: 28, borderRadius: 999, paddingHorizontal: 9, justifyContent: 'center' },
  barOverdue: { backgroundColor: '#DC2626' },
  barText: { fontSize: 10, fontWeight: '900', color: '#FFFFFF' },
  milestonePill: { position: 'absolute', top: 50, maxWidth: 120, height: 20, borderRadius: 999, borderWidth: 1, borderColor: '#DDD6FE', backgroundColor: '#F5F3FF', paddingHorizontal: 6, flexDirection: 'row', alignItems: 'center', gap: 3 },
  milestoneText: { fontSize: 9, fontWeight: '900', color: '#7C3AED' },
  noDateCard: { borderRadius: 18, borderWidth: 1, borderColor: 'rgba(226, 232, 240, 0.92)', backgroundColor: '#FFFFFF', padding: 10, gap: 8, ...shadow },
  noDateTitle: { fontSize: 15, fontWeight: '900', color: '#0F172A' },
  noDateRow: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  noDateMain: { flex: 1, minWidth: 0 },
  noDateTask: { fontSize: 13, fontWeight: '900', color: '#0F172A' },
  noDateMeta: { fontSize: 11, fontWeight: '700', color: '#64748B', marginTop: 2 },
  noDateBadge: { fontSize: 10, fontWeight: '900', color: '#B45309', backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
  bottomPad: { height: 100 },
});

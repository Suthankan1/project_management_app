import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Svg, { Circle, Defs, Line, Path, Rect, Stop, LinearGradient as SvgGradient, Text as SvgText } from 'react-native-svg';
import { T } from '../../constants/tokens';
import { BurndownPoint, BurndownSprint, useMobileBurndown } from '../../hooks/useMobileBurndown';

type ChartPoint = BurndownPoint & { x: number; yActual: number; yIdeal: number };

function formatShortDate(value?: string | null) {
  if (!value) return 'No date';
  return new Date(`${value.slice(0, 10)}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

function formatSprintRange(sprint?: BurndownSprint | null) {
  if (!sprint?.startDate || !sprint.endDate) return 'Dates not set';
  return `${formatShortDate(sprint.startDate)} - ${formatShortDate(sprint.endDate)}`;
}

function linePath(points: { x: number; y: number }[]) {
  if (!points.length) return '';
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' ');
}

function StatCard({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: `${tone}14` }]}>
        <MaterialCommunityIcons name="chart-timeline-variant" size={16} color={tone} />
      </View>
      <Text style={[styles.statValue, { color: tone }]} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel} numberOfLines={1}>{label}</Text>
    </View>
  );
}

function SprintChip({
  sprint,
  active,
  onPress,
}: {
  sprint: BurndownSprint;
  active: boolean;
  onPress: () => void;
}) {
  const tint = active ? '#155DFC' : '#475569';
  return (
    <Pressable onPress={onPress} style={[styles.sprintChip, active && styles.sprintChipActive]}>
      <View style={[styles.sprintDot, { backgroundColor: sprint.status === 'ACTIVE' ? '#16A34A' : '#CBD5E1' }]} />
      <View style={{ maxWidth: 170 }}>
        <Text style={[styles.sprintName, { color: tint }]} numberOfLines={1}>
          {sprint.name || `Sprint ${sprint.id}`}
        </Text>
        <Text style={styles.sprintDate} numberOfLines={1}>{formatSprintRange(sprint)}</Text>
      </View>
    </Pressable>
  );
}

function BurndownChart({
  points,
  totalStoryPoints,
}: {
  points: BurndownPoint[];
  totalStoryPoints: number;
}) {
  const { width } = useWindowDimensions();
  const chartWidth = Math.max(320, width - 40);
  const chartHeight = Math.min(280, Math.max(220, chartWidth * 0.66));
  const pad = { top: 24, right: 20, bottom: 42, left: 38 };
  const innerW = chartWidth - pad.left - pad.right;
  const innerH = chartHeight - pad.top - pad.bottom;
  const [activeIndex, setActiveIndex] = useState(Math.max(points.length - 1, 0));

  const model = useMemo(() => {
    const maxY = Math.max(totalStoryPoints, ...points.flatMap((p) => [p.remainingPoints, p.idealPoints]), 1);
    const x = (index: number) => pad.left + (points.length <= 1 ? innerW / 2 : (index / (points.length - 1)) * innerW);
    const y = (value: number) => pad.top + innerH - (value / maxY) * innerH;
    const chartPoints: ChartPoint[] = points.map((point, index) => ({
      ...point,
      x: x(index),
      yActual: y(point.remainingPoints),
      yIdeal: y(point.idealPoints),
    }));
    const actual = linePath(chartPoints.map((point) => ({ x: point.x, y: point.yActual })));
    const ideal = linePath(chartPoints.map((point) => ({ x: point.x, y: point.yIdeal })));
    const area = chartPoints.length > 1
      ? `${actual} L ${chartPoints[chartPoints.length - 1].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} L ${chartPoints[0].x.toFixed(1)} ${(pad.top + innerH).toFixed(1)} Z`
      : '';
    const yTicks = [0, Math.round(maxY / 2), Math.round(maxY)];
    const xStep = Math.max(1, Math.ceil(points.length / 4));
    const xTicks = chartPoints.filter((_, index) => index === 0 || index === chartPoints.length - 1 || index % xStep === 0);
    return { chartPoints, actual, ideal, area, yTicks, xTicks, maxY, y };
  }, [innerH, innerW, pad.left, pad.top, points, totalStoryPoints]);

  if (!points.length) {
    return (
      <View style={styles.emptyChart}>
        <MaterialCommunityIcons name="chart-line-variant" size={26} color={T.textMuted} />
        <Text style={styles.emptyText}>No burndown data for this sprint.</Text>
      </View>
    );
  }

  const active = model.chartPoints[Math.min(activeIndex, model.chartPoints.length - 1)];
  const hitWidth = Math.max(32, innerW / Math.max(points.length, 1));

  return (
    <View>
      <View style={styles.chartLegend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#155DFC' }]} />
          <Text style={styles.legendText}>Actual</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { backgroundColor: '#CBD5E1' }]} />
          <Text style={styles.legendText}>Ideal</Text>
        </View>
      </View>

      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <SvgGradient id="actualFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#155DFC" stopOpacity="0.16" />
            <Stop offset="100%" stopColor="#155DFC" stopOpacity="0.02" />
          </SvgGradient>
        </Defs>
        <Rect x={pad.left} y={pad.top} width={innerW} height={innerH} rx={10} fill="#F8FAFF" />
        {model.yTicks.map((tick) => (
          <React.Fragment key={`tick-${tick}`}>
            <Line
              x1={pad.left}
              y1={model.y(tick)}
              x2={pad.left + innerW}
              y2={model.y(tick)}
              stroke="#E2E8F0"
              strokeWidth={1}
              strokeDasharray={tick === 0 ? undefined : '4 4'}
            />
            <SvgText x={pad.left - 8} y={model.y(tick) + 4} textAnchor="end" fontSize={10} fill="#94A3B8">
              {tick}
            </SvgText>
          </React.Fragment>
        ))}
        {model.xTicks.map((point) => (
          <SvgText key={`x-${point.date}`} x={point.x} y={chartHeight - 14} textAnchor="middle" fontSize={10} fill="#94A3B8">
            {formatShortDate(point.date)}
          </SvgText>
        ))}
        {model.area ? <Path d={model.area} fill="url(#actualFill)" /> : null}
        <Path d={model.ideal} fill="none" stroke="#CBD5E1" strokeWidth={2} strokeDasharray="6 4" strokeLinecap="round" strokeLinejoin="round" />
        <Path d={model.actual} fill="none" stroke="#155DFC" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        <Line x1={active.x} y1={pad.top} x2={active.x} y2={pad.top + innerH} stroke="#155DFC" strokeWidth={1} strokeDasharray="3 3" opacity={0.35} />
        <Circle cx={active.x} cy={active.yIdeal} r={4} fill="#CBD5E1" stroke="#fff" strokeWidth={2} />
        <Circle cx={active.x} cy={active.yActual} r={5} fill="#155DFC" stroke="#fff" strokeWidth={2.5} />
        {model.chartPoints.map((point, index) => (
          <Rect
            key={`hit-${point.date}`}
            x={point.x - hitWidth / 2}
            y={pad.top}
            width={hitWidth}
            height={innerH}
            fill="transparent"
            onPress={() => setActiveIndex(index)}
          />
        ))}
      </Svg>

      <View style={styles.tooltip}>
        <Text style={styles.tooltipDate}>{formatShortDate(active.date)}</Text>
        <Text style={styles.tooltipValue}>Remaining {active.remainingPoints} pts</Text>
        <Text style={styles.tooltipMuted}>Ideal {active.idealPoints} pts</Text>
      </View>
    </View>
  );
}

export default function MobileBurndownScreen({
  projectId,
  projectName,
  topOffset = 0,
}: {
  projectId: number;
  projectName?: string;
  topOffset?: number;
}) {
  const {
    sprints,
    selectedSprint,
    selectedSprintId,
    burndown,
    loading,
    refreshing,
    error,
    refresh,
    selectSprint,
  } = useMobileBurndown(projectId);

  const summary = useMemo(() => {
    const remaining = burndown?.dataPoints[burndown.dataPoints.length - 1]?.remainingPoints ?? 0;
    const total = burndown?.totalStoryPoints ?? 0;
    const done = Math.max(0, total - remaining);
    const progress = total > 0 ? Math.round((done / total) * 100) : 0;
    return { remaining, total, done, progress };
  }, [burndown]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: topOffset }]}>
        <ActivityIndicator color={T.primary} />
        <Text style={styles.centerText}>Loading burndown...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[styles.content, { paddingTop: topOffset }]}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={T.primary} />}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <MaterialCommunityIcons name="chart-line-variant" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.eyebrow} numberOfLines={1}>{projectName || 'Project'}</Text>
          <Text style={styles.title}>Burndown</Text>
          <Text style={styles.subtitle}>Track sprint story points from your phone.</Text>
        </View>
      </View>

      {error ? (
        <View style={styles.errorCard}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#DC2626" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {sprints.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sprintRail}>
          {sprints.map((sprint) => (
            <SprintChip
              key={sprint.id}
              sprint={sprint}
              active={sprint.id === selectedSprintId}
              onPress={() => selectSprint(sprint.id)}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="run" size={28} color={T.textMuted} />
          <Text style={styles.emptyTitle}>No sprints found</Text>
          <Text style={styles.emptyText}>Create a sprint to view burndown progress.</Text>
        </View>
      )}

      {selectedSprint && (!selectedSprint.startDate || !selectedSprint.endDate) ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar-alert" size={28} color="#D97706" />
          <Text style={styles.emptyTitle}>Sprint dates needed</Text>
          <Text style={styles.emptyText}>Set start and end dates from sprint settings to generate the chart.</Text>
        </View>
      ) : null}

      {burndown ? (
        <>
          <View style={styles.statsRow}>
            <StatCard label="Total" value={summary.total} tone="#155DFC" />
            <StatCard label="Done" value={summary.done} tone="#16A34A" />
            <StatCard label="Left" value={summary.remaining} tone="#E11D48" />
            <StatCard label="Progress" value={`${summary.progress}%`} tone="#7C3AED" />
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle} numberOfLines={1}>{burndown.sprintName}</Text>
                <Text style={styles.chartSub}>{formatShortDate(burndown.startDate)} - {formatShortDate(burndown.endDate)}</Text>
              </View>
              <View style={styles.progressBadge}>
                <Text style={styles.progressBadgeText}>{summary.progress}%</Text>
              </View>
            </View>
            <BurndownChart points={burndown.dataPoints} totalStoryPoints={burndown.totalStoryPoints} />
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

const shadow = Platform.select({
  ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18 },
  android: { elevation: 3 },
});

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#F7F8FA' },
  content: { paddingHorizontal: 16, paddingBottom: 34, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F7F8FA', gap: 10 },
  centerText: { color: T.textSecondary, fontSize: 13, fontWeight: '700' },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: T.border, ...shadow },
  heroIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#155DFC' },
  eyebrow: { fontSize: 11, fontWeight: '800', color: T.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  title: { fontSize: 24, fontWeight: '900', color: T.textPrimary, lineHeight: 28 },
  subtitle: { fontSize: 12, color: T.textSecondary, marginTop: 2 },
  errorCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF2F2', borderColor: '#FECACA', borderWidth: 1, borderRadius: 16, padding: 12 },
  errorText: { flex: 1, color: '#B91C1C', fontSize: 12, fontWeight: '700' },
  sprintRail: { gap: 10, paddingRight: 16 },
  sprintChip: { minWidth: 172, flexDirection: 'row', alignItems: 'center', gap: 9, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: T.border },
  sprintChipActive: { borderColor: '#155DFC', backgroundColor: '#F8FAFF' },
  sprintDot: { width: 8, height: 8, borderRadius: 4 },
  sprintName: { fontSize: 13, fontWeight: '900' },
  sprintDate: { fontSize: 10, color: T.textMuted, fontWeight: '700', marginTop: 2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '46%', backgroundColor: '#fff', borderRadius: 18, padding: 14, borderWidth: 1, borderColor: T.border, ...shadow },
  statIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 24, fontWeight: '900', lineHeight: 27 },
  statLabel: { fontSize: 10, color: T.textMuted, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8 },
  chartCard: { backgroundColor: '#fff', borderRadius: 20, padding: 12, borderWidth: 1, borderColor: T.border, ...shadow },
  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, paddingBottom: 10 },
  chartTitle: { maxWidth: 220, fontSize: 16, fontWeight: '900', color: T.textPrimary },
  chartSub: { fontSize: 11, color: T.textMuted, fontWeight: '700', marginTop: 2 },
  progressBadge: { backgroundColor: T.primaryLight, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  progressBadgeText: { color: T.primary, fontSize: 12, fontWeight: '900' },
  chartLegend: { flexDirection: 'row', gap: 16, alignItems: 'center', paddingHorizontal: 4, paddingBottom: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine: { width: 20, height: 3, borderRadius: 2 },
  legendText: { fontSize: 11, color: T.textSecondary, fontWeight: '800' },
  tooltip: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#F8FAFC', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, marginTop: -4 },
  tooltipDate: { fontSize: 11, color: T.textPrimary, fontWeight: '900' },
  tooltipValue: { fontSize: 11, color: '#155DFC', fontWeight: '900' },
  tooltipMuted: { fontSize: 11, color: T.textMuted, fontWeight: '800' },
  emptyChart: { height: 220, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyState: { alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#fff', borderRadius: 20, padding: 24, borderWidth: 1, borderColor: T.border },
  emptyTitle: { color: T.textPrimary, fontSize: 15, fontWeight: '900' },
  emptyText: { color: T.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'center', lineHeight: 18 },
});

import React, { type ComponentProps, useRef, useEffect, useCallback, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Animated, TouchableWithoutFeedback, useWindowDimensions,
} from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { T } from '../../constants/tokens';

const INACTIVE_W = 48;
const ACTIVE_W = 124;
const ROW_H = 48;
const TAB_GAP = 8;
const ICON_SZ = 22;
const TOP_NAV_SIDE_PADDING = 12;
const MORE_GRID_COLUMNS = 3;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export type ProjectTab = 'summary' | 'backlog' | 'board' | 'chat' | 'more';
export type MoreTab =
  | 'timeline' | 'calendar' | 'burndown' | 'milestone'
  | 'members' | 'pages' | 'docs' | 'list' | 'report';

type PremiumIconName = ComponentProps<typeof MaterialCommunityIcons>['name'];

const TABS: { key: ProjectTab; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'board', label: 'Board' },
  { key: 'chat', label: 'Chat' },
  { key: 'more', label: 'More' },
];

type MoreItem = {
  key: MoreTab;
  label: string;
  icon: PremiumIconName;
  tint: string;
  tintSoft: string;
};

const MORE_ITEMS: MoreItem[] = [
  { key: 'timeline', label: 'Timeline', icon: 'timeline-clock-outline', tint: '#155DFC', tintSoft: '#E8F0FF' },
  { key: 'calendar', label: 'Calendar', icon: 'calendar-month-outline', tint: '#0F9F6E', tintSoft: '#E7F8F1' },
  { key: 'burndown', label: 'Burndown', icon: 'chart-line-variant', tint: '#E11D48', tintSoft: '#FFF0F4' },
  { key: 'milestone', label: 'Milestone', icon: 'flag-checkered', tint: '#7C3AED', tintSoft: '#F2ECFF' },
  { key: 'members', label: 'Members', icon: 'account-group-outline', tint: '#0891B2', tintSoft: '#E6F7FB' },
  { key: 'pages', label: 'Pages', icon: 'book-open-page-variant-outline', tint: '#D97706', tintSoft: '#FFF6E8' },
  { key: 'docs', label: 'Docs', icon: 'file-document-edit-outline', tint: '#4F46E5', tintSoft: '#EEF0FF' },
  { key: 'list', label: 'List', icon: 'format-list-checks', tint: '#475569', tintSoft: '#F1F5F9' },
  { key: 'report', label: 'Report', icon: 'file-chart-outline', tint: '#DB2777', tintSoft: '#FDF2F8' },
];

// ─── Icons ───────────────────────────────────────────────────────────────────
function TabIcon({ name, active }: { name: ProjectTab; active: boolean }) {
  const c = active ? T.primary : T.textSecondary;
  const sw = 2.2;
  const fa = active ? T.primary + '1A' : T.textSecondary + '25';
  const p = {
    width: ICON_SZ, height: ICON_SZ, viewBox: '0 0 24 24', fill: 'none',
    stroke: c, strokeWidth: sw,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  };

  if (name === 'summary') return (
    <Svg {...p}>
      <Rect x={3} y={3} width={8} height={8} rx={2.5} fill={fa} />
      <Rect x={13} y={3} width={8} height={8} rx={2.5} fill={fa} />
      <Rect x={3} y={13} width={8} height={8} rx={2.5} />
      <Rect x={13} y={13} width={8} height={8} rx={2.5} />
    </Svg>
  );
  if (name === 'backlog') return (
    <Svg {...p}>
      <Path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
      <Rect x={9} y={3} width={6} height={4} rx={1} fill={fa} />
      <Line x1={9} y1={12} x2={15} y2={12} />
      <Line x1={9} y1={16} x2={13} y2={16} />
    </Svg>
  );
  if (name === 'board') return (
    <Svg {...p}>
      <Rect x={3} y={3} width={5} height={18} rx={2} fill={fa} />
      <Rect x={10} y={3} width={5} height={12} rx={2} fill={fa} />
      <Rect x={17} y={3} width={4} height={15} rx={2} />
    </Svg>
  );
  if (name === 'chat') return (
    <Svg {...p}>
      <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" fill={fa} />
    </Svg>
  );
  return (
    <Svg {...p}>
      <Circle cx={5} cy={12} r={1.8} fill={c} stroke="none" />
      <Circle cx={12} cy={12} r={1.8} fill={c} stroke="none" />
      <Circle cx={19} cy={12} r={1.8} fill={c} stroke="none" />
    </Svg>
  );
}

// ─── Tab Button ───────────────────────────────────────────────────────────────
function TabBtn({
  tab, widthAnim, inactiveWidth, activeWidth, active, onPress, hasMoreDot,
}: {
  tab: typeof TABS[number];
  widthAnim: Animated.Value;
  inactiveWidth: number;
  activeWidth: number;
  active: boolean;
  onPress: () => void;
  hasMoreDot?: boolean;
}) {
  const press = useRef(new Animated.Value(1)).current;
  const labelTargetWidth = useMemo(
    () => Math.min(Math.max(tab.label.length * 8.4, 34), activeWidth - ICON_SZ - 22),
    [activeWidth, tab.label]
  );

  // Fade background early so it feels like a solid pill
  const activeBgOp = widthAnim.interpolate({
    inputRange: [inactiveWidth, inactiveWidth + 24, activeWidth],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  // Fade text/icon smoothly over the entire expansion
  const activeOp = widthAnim.interpolate({
    inputRange: [inactiveWidth, activeWidth],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Animate the label container width so content stays perfectly centered
  const labelWidth = widthAnim.interpolate({
    inputRange: [inactiveWidth, activeWidth],
    outputRange: [0, labelTargetWidth],
    extrapolate: 'clamp',
  });

  // Animate the gap so when inactive, the icon is perfectly alone in the center
  const labelMargin = widthAnim.interpolate({
    inputRange: [inactiveWidth, activeWidth],
    outputRange: [0, 8],
    extrapolate: 'clamp',
  });

  // Slide text leftwards when shrinking so it tucks behind the icon and escapes the collapsing right edge
  const textX = widthAnim.interpolate({
    inputRange: [inactiveWidth, activeWidth],
    outputRange: [-20, 0],
    extrapolate: 'clamp',
  });

  const pressIn = useCallback(() =>
    Animated.spring(press, { toValue: 0.9, tension: 700, friction: 14, useNativeDriver: false }).start(), []);
  const pressOut = useCallback(() =>
    Animated.spring(press, { toValue: 1, tension: 300, friction: 18, useNativeDriver: false }).start(), []);

  return (
    <Animated.View style={[ns.tabBtn, { width: widthAnim, transform: [{ scale: press }] }]}>
      {/* Subtle glass background for inactive tabs */}
      <View style={ns.inactiveBg} />

      {/* Solid white background for active tab */}
      <Animated.View style={[ns.activeBg, { opacity: activeBgOp }]} />

      {/* ContentWrapper clips the text when shrinking to a circle */}
      <View style={ns.contentWrapper}>
        <TouchableOpacity
          onPress={onPress}
          onPressIn={pressIn}
          onPressOut={pressOut}
          activeOpacity={1}
          style={ns.touchable}
          accessibilityLabel={tab.label}
          accessibilityRole="tab"
          accessibilityState={{ selected: active }}
        >
          <View style={ns.iconBox}>
            {/* Crossfade icons */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: Animated.subtract(1, activeOp) }]}>
              <TabIcon name={tab.key} active={false} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: activeOp }]}>
              <TabIcon name={tab.key} active={true} />
            </Animated.View>

            {hasMoreDot && !active && <View style={ns.moreDot} />}
          </View>

          <Animated.View style={[ns.labelBox, { opacity: activeOp, width: labelWidth, marginLeft: labelMargin }]}>
            <Animated.Text numberOfLines={1} style={[ns.label, { transform: [{ translateX: textX }] }]}>
              {tab.label}
            </Animated.Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Removed MorePopup completely. Dropping down from TopNav inline.

function PremiumMoreIcon({ item, selected }: { item: MoreItem; selected: boolean }) {
  const iconColors = selected
    ? [item.tint, T.primary] as const
    : [item.tint + '22', item.tintSoft] as const;

  return (
    <View style={[ds.iconShell, selected && ds.iconShellSel]}>
      <LinearGradient
        colors={iconColors}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ds.iconGradient}
      >
        <View style={[ds.iconAura, { backgroundColor: selected ? 'rgba(255,255,255,0.2)' : item.tintSoft }]} />
        <MaterialCommunityIcons
          name={item.icon}
          size={25}
          color={selected ? '#FFFFFF' : item.tint}
        />
      </LinearGradient>
    </View>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export interface ProjectTopNavProps {
  projectName?: string;
  activeTab: ProjectTab;
  activeMoreTab?: MoreTab;
  onTabChange: (tab: ProjectTab) => void;
  onMoreTabChange?: (tab: MoreTab) => void;
  onSettingsPress?: () => void;
}

export default function ProjectTopNav({
  projectName,
  activeTab, activeMoreTab, onTabChange, onMoreTabChange, onSettingsPress,
}: ProjectTopNavProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [moreOpen, setMoreOpen] = useState(false);

  const activeIdx = useMemo(() => TABS.findIndex(t => t.key === activeTab), [activeTab]);
  const tabMetrics = useMemo(() => {
    const availableWidth = Math.max(0, screenWidth - TOP_NAV_SIDE_PADDING * 2);
    const totalGap = TAB_GAP * (TABS.length - 1);
    const activeWidth = clamp(availableWidth * 0.32, 92, ACTIVE_W);
    const inactiveWidth = clamp((availableWidth - totalGap - activeWidth) / (TABS.length - 1), 36, INACTIVE_W);

    return { activeWidth, inactiveWidth };
  }, [screenWidth]);

  const moreGridMetrics = useMemo(() => {
    const horizontalPadding = screenWidth < 360 ? 12 : 16;
    const gap = screenWidth < 360 ? 10 : 12;
    const gridWidth = Math.max(0, screenWidth - horizontalPadding * 2);
    const cellWidth = Math.floor((gridWidth - gap * (MORE_GRID_COLUMNS - 1)) / MORE_GRID_COLUMNS);
    const cellHeight = clamp(cellWidth * 0.78, 78, 90);
    const rows = Math.ceil(MORE_ITEMS.length / MORE_GRID_COLUMNS);
    const dropdownHeight = 16 + 30 + cellHeight * rows + gap * (rows - 1) + 32;

    return { horizontalPadding, gap, cellWidth, cellHeight, dropdownHeight };
  }, [screenWidth]);

  const tabWidths = useRef(
    TABS.map((_, i) => new Animated.Value(i === activeIdx ? tabMetrics.activeWidth : tabMetrics.inactiveWidth))
  ).current;

  useEffect(() => {
    const cfg = { tension: 340, friction: 28, useNativeDriver: false };
    Animated.parallel(
      TABS.map((_, i) =>
        Animated.spring(tabWidths[i], {
          toValue: i === activeIdx ? tabMetrics.activeWidth : tabMetrics.inactiveWidth,
          ...cfg,
        })
      )
    ).start();
  }, [activeIdx, tabMetrics.activeWidth, tabMetrics.inactiveWidth, tabWidths]);

  const entryY = useRef(new Animated.Value(-80)).current;
  const entryOp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(entryY, { toValue: 0, tension: 200, friction: 24, useNativeDriver: true }),
      Animated.timing(entryOp, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const dropdownHeightAnim = useRef(new Animated.Value(0)).current;
  const dropdownOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (moreOpen) {
      Animated.parallel([
        Animated.spring(dropdownHeightAnim, { toValue: moreGridMetrics.dropdownHeight, tension: 300, friction: 26, useNativeDriver: false }),
        Animated.timing(dropdownOp, { toValue: 1, duration: 200, useNativeDriver: true, delay: 50 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(dropdownHeightAnim, { toValue: 0, tension: 300, friction: 26, useNativeDriver: false }),
        Animated.timing(dropdownOp, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [dropdownHeightAnim, dropdownOp, moreOpen, moreGridMetrics.dropdownHeight]);

  const handlePress = useCallback((tab: ProjectTab) => {
    if (tab === 'more') {
      const opening = !moreOpen;
      setMoreOpen(opening);
      onTabChange('more');
    } else {
      setMoreOpen(false);
      onTabChange(tab);
    }
  }, [moreOpen, onTabChange]);

  return (
    <>
      {/* Animated Frosted Glass Background Overlay */}
      <TouchableWithoutFeedback onPress={() => setMoreOpen(false)}>
        <Animated.View
          pointerEvents={moreOpen ? 'auto' : 'none'}
          style={[StyleSheet.absoluteFill, { zIndex: 90, opacity: dropdownOp }]}
        >
          <BlurView intensity={50} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
        </Animated.View>
      </TouchableWithoutFeedback>

      {/* The Main Top Navigation Bar Expanding Downwards */}
      <Animated.View style={[
        ns.container,
        { paddingTop: insets.top + 8, paddingBottom: 12, transform: [{ translateY: entryY }], opacity: entryOp },
      ]}>
        <BlurView intensity={50} tint="light" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />

        {/* Large Project Title (Apple iOS / Web Style) */}
        <View style={ns.titleRow}>
          <View style={ns.titleContent}>
            <View style={ns.breadcrumbRow}>
              <Text style={ns.breadcrumbText}>PROJECT</Text>
              <Text style={ns.breadcrumbSlash}>/</Text>
            </View>
            <Text style={ns.titleText} numberOfLines={1}>{projectName || 'Workspace'}</Text>
          </View>

          {onSettingsPress && (
            <TouchableOpacity
              onPress={onSettingsPress}
              style={ns.settingsBtn}
              activeOpacity={0.7}
              accessibilityLabel="Project Settings"
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="cog-outline" size={20} color={T.primary} />
            </TouchableOpacity>
          )}
        </View>

        <View style={ns.row}>
          {TABS.map((tab, idx) => (
            <TabBtn
              key={tab.key}
              tab={tab}
              widthAnim={tabWidths[idx]}
              inactiveWidth={tabMetrics.inactiveWidth}
              activeWidth={tabMetrics.activeWidth}
              active={idx === activeIdx}
              onPress={() => handlePress(tab.key)}
              hasMoreDot={tab.key === 'more' && !!activeMoreTab}
            />
          ))}
        </View>

        {/* The Inline Full-Width Dropdown Area */}
        <Animated.View style={{ height: dropdownHeightAnim, overflow: 'hidden' }}>
          <Animated.View style={{
            opacity: dropdownOp,
            paddingHorizontal: moreGridMetrics.horizontalPadding,
            paddingTop: 16,
            paddingBottom: 32,
          }}>
            <View style={ds.hdr}>
              <View style={ds.hdrAccent} />
              <Text style={ds.hdrTxt}>MORE VIEWS</Text>
            </View>

            <View style={[ds.grid, { gap: moreGridMetrics.gap }]}>
              {MORE_ITEMS.map(item => {
                const isSel = activeMoreTab === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => { onMoreTabChange?.(item.key); setMoreOpen(false); }}
                    activeOpacity={0.7}
                    style={[
                      ds.cell,
                      { width: moreGridMetrics.cellWidth, height: moreGridMetrics.cellHeight },
                      isSel && ds.cellSel,
                    ]}
                  >
                    <PremiumMoreIcon item={item} selected={isSel} />
                    <Text style={ds.cellLbl}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ns = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(0,0,0,0.08)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 24 },
      android: { elevation: 12 },
    }),
  },
  titleRow: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    height: 56,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleContent: {
    flex: 1,
    marginRight: 10,
  },
  settingsBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: `${T.primary}0F`,
    borderWidth: 1,
    borderColor: `${T.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    ...Platform.select({
      ios: { shadowColor: T.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  breadcrumbText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 1.2,
  },
  breadcrumbSlash: {
    fontSize: 10,
    fontWeight: '600',
    color: '#CBD5E1',
  },
  titleText: {
    fontSize: 26,
    fontWeight: '900', // Matches web's black/extrabold style
    color: T.primary, // Web uses blue for mobile
    letterSpacing: -0.8,
  },
  row: {
    flexDirection: 'row',
    gap: TAB_GAP,
    justifyContent: 'center',
    height: ROW_H,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  tabBtn: {
    height: ROW_H,
    borderRadius: ROW_H / 2,
    justifyContent: 'center',
  },
  inactiveBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    borderRadius: ROW_H / 2,
  },
  activeBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: T.primaryLight,
    borderWidth: 1, borderColor: T.primaryMuted + '55',
    borderRadius: ROW_H / 2,
    ...Platform.select({
      ios: { shadowColor: T.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  contentWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ROW_H / 2,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBox: {
    width: ICON_SZ,
    height: ICON_SZ,
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelBox: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  label: {
    fontSize: 14.5,
    fontWeight: '800',
    color: T.primary,
    letterSpacing: 0.2,
  },
  moreDot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF453A',
  },
});

const ds = StyleSheet.create({
  hdr: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 6,
  },
  hdrAccent: { width: 4, height: 14, borderRadius: 2, backgroundColor: T.primary, opacity: 0.8 },
  hdrTxt:  { fontSize: 11, fontWeight: '800', color: T.textSecondary, letterSpacing: 1.6 },
  grid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cell: {
    height: 90,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center', justifyContent: 'center',
    gap: 7,
    overflow: 'hidden',
    ...Platform.select({
      ios: { shadowColor: '#64748B', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 18 },
      android: { elevation: 0 },
    }),
  },
  cellSel: {
    backgroundColor: T.primary + '10',
    borderColor: T.primaryMuted + '7A',
    ...Platform.select({
      ios: { shadowColor: T.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.16, shadowRadius: 20 },
      android: { elevation: 2 },
    }),
  },
  iconShell: {
    width: 46,
    height: 46,
    borderRadius: 16,
    padding: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.30)',
    ...Platform.select({
      ios: { shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 12 },
      android: { elevation: 0 },
    }),
  },
  iconShellSel: {
    borderColor: 'rgba(255,255,255,0.72)',
    ...Platform.select({
      ios: { shadowColor: T.primary, shadowOffset: { width: 0, height: 7 }, shadowOpacity: 0.22, shadowRadius: 16 },
      android: { elevation: 2 },
    }),
  },
  iconGradient: {
    flex: 1,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  iconAura: {
    position: 'absolute',
    right: -9,
    top: -10,
    width: 28,
    height: 28,
    borderRadius: 14,
    opacity: 0.78,
  },
  cellLbl: {
    fontSize: 11.5,
    fontWeight: '800',
    color: T.textPrimary,
    letterSpacing: 0,
  },
});

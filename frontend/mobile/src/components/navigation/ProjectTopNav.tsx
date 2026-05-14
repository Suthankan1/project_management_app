import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Platform, Animated, Dimensions, Modal, TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polygon } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { T } from '../../constants/tokens';

const { width: SW } = Dimensions.get('window');

const INACTIVE_W = 42;
const ACTIVE_W = 112;
const ROW_H = 44;
const TAB_GAP = 6;
const ICON_SZ = 20;

export type ProjectTab = 'summary' | 'backlog' | 'board' | 'chat' | 'more' | string;
export type MoreTab =
  | 'timeline' | 'calendar' | 'burndown' | 'milestone'
  | 'members' | 'pages' | 'docs' | 'list' | 'report';

const TABS: { key: ProjectTab; label: string }[] = [
  { key: 'summary', label: 'Summary' },
  { key: 'backlog', label: 'Backlog' },
  { key: 'board', label: 'Board' },
  { key: 'chat', label: 'Chat' },
  { key: 'more', label: 'More' },
];

const MORE_ITEMS: { key: MoreTab; label: string; emoji: string }[] = [
  { key: 'timeline', label: 'Timeline', emoji: '📅' },
  { key: 'calendar', label: 'Calendar', emoji: '🗓️' },
  { key: 'burndown', label: 'Burndown', emoji: '📉' },
  { key: 'milestone', label: 'Milestone', emoji: '🚩' },
  { key: 'members', label: 'Members', emoji: '👥' },
  { key: 'pages', label: 'Pages', emoji: '📄' },
  { key: 'docs', label: 'Docs', emoji: '📝' },
  { key: 'list', label: 'List', emoji: '📋' },
  { key: 'report', label: 'Report', emoji: '📊' },
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

  if (name === 'report') return (
    <Svg {...p}>
      <Rect x={3} y={10} width={4} height={10} rx={1} fill={fa} />
      <Rect x={10} y={4} width={4} height={16} rx={1} fill={fa} />
      <Rect x={17} y={14} width={4} height={6} rx={1} />
    </Svg>
  );
  if (name === 'timeline' || name === 'calendar') return (
    <Svg {...p}>
      <Rect x={3} y={4} width={18} height={18} rx={2} />
      <Line x1={3} y1={10} x2={21} y2={10} />
      <Line x1={8} y1={2} x2={8} y2={6} />
      <Line x1={16} y1={2} x2={16} y2={6} />
      <Rect x={7} y={14} width={4} height={4} rx={1} fill={fa} />
    </Svg>
  );
  if (name === 'milestone' || name === 'burndown') return (
    <Svg {...p}>
      <Path d="M4 22L4 2" />
      <Path d="M4 4L18 8L4 12" fill={fa} />
    </Svg>
  );
  if (name === 'members') return (
    <Svg {...p}>
      <Circle cx={12} cy={7} r={4} fill={fa} />
      <Path d="M4 21v-2a4 4 0 014-4h8a4 4 0 014 4v2" />
    </Svg>
  );
  if (name === 'pages' || name === 'docs') return (
    <Svg {...p}>
      <Path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <Path d="M14 2v6h6" fill={fa} />
      <Line x1={8} y1={13} x2={16} y2={13} />
      <Line x1={8} y1={17} x2={16} y2={17} />
    </Svg>
  );
  if (name === 'list') return (
    <Svg {...p}>
      <Line x1={8} y1={6} x2={21} y2={6} />
      <Line x1={8} y1={12} x2={21} y2={12} />
      <Line x1={8} y1={18} x2={21} y2={18} />
      <Line x1={3} y1={6} x2={3.01} y2={6} />
      <Line x1={3} y1={12} x2={3.01} y2={12} />
      <Line x1={3} y1={18} x2={3.01} y2={18} />
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
  tab, widthAnim, marginAnim, opacityAnim, active, onPress, hasMoreDot,
}: {
  tab: { key: string; label: string };
  widthAnim: Animated.Value;
  marginAnim?: Animated.Value;
  opacityAnim?: Animated.Value;
  active: boolean;
  onPress: () => void;
  hasMoreDot?: boolean;
}) {
  const press = useRef(new Animated.Value(1)).current;

  // Fade background early so it feels like a solid pill
  const activeBgOp = widthAnim.interpolate({
    inputRange: [INACTIVE_W, INACTIVE_W + 24, ACTIVE_W],
    outputRange: [0, 1, 1],
    extrapolate: 'clamp',
  });

  // Fade text/icon smoothly over the entire expansion
  const activeOp = widthAnim.interpolate({
    inputRange: [INACTIVE_W, ACTIVE_W],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  // Animate the label container width so content stays perfectly centered
  const labelWidth = widthAnim.interpolate({
    inputRange: [INACTIVE_W, ACTIVE_W],
    outputRange: [0, 66],
    extrapolate: 'clamp',
  });

  // Animate the gap so when inactive, the icon is perfectly alone in the center
  const labelMargin = widthAnim.interpolate({
    inputRange: [INACTIVE_W, ACTIVE_W],
    outputRange: [0, 8],
    extrapolate: 'clamp',
  });

  // Slide text leftwards when shrinking so it tucks behind the icon and escapes the collapsing right edge
  const textX = widthAnim.interpolate({
    inputRange: [INACTIVE_W, ACTIVE_W],
    outputRange: [-20, 0],
    extrapolate: 'clamp',
  });

  const pressIn = useCallback(() =>
    Animated.spring(press, { toValue: 0.9, tension: 700, friction: 14, useNativeDriver: false }).start(), []);
  const pressOut = useCallback(() =>
    Animated.spring(press, { toValue: 1, tension: 300, friction: 18, useNativeDriver: false }).start(), []);

  return (
    <Animated.View style={[
      ns.tabBtn,
      { width: widthAnim, transform: [{ scale: press }] },
      marginAnim ? { marginRight: marginAnim } : {},
      opacityAnim ? { opacity: opacityAnim } : {}
    ]}>
      {/* Liquid glass background for inactive tabs */}
      <View style={ns.inactiveGlassClip}>
        <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
        <View style={ns.inactiveGlassColor} />
      </View>

      {/* Liquid glass background for active tab */}
      <Animated.View style={[ns.activeGlassShadow, { opacity: activeBgOp }]}>
        <View style={ns.activeGlassClip}>
          <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
          <View style={ns.activeGlassColor} />
        </View>
      </Animated.View>

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
          <View style={ns.tabContentGroup}>
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

            <Animated.View style={[ns.labelBox, { opacity: activeOp, maxWidth: labelWidth, marginLeft: labelMargin }]}>
              <Animated.Text numberOfLines={1} style={ns.label}>
                {tab.label}
              </Animated.Text>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// Removed MorePopup completely. Dropping down from TopNav inline.

// ─── Main ─────────────────────────────────────────────────────────────────────
export interface ProjectTopNavProps {
  projectName?: string;
  activeTab: ProjectTab | MoreTab;
  activeMoreTab?: MoreTab;
  onTabChange: (tab: ProjectTab | MoreTab) => void;
  onMoreTabChange?: (tab: MoreTab) => void;
}

export default function ProjectTopNav({
  projectName,
  activeTab, activeMoreTab, onTabChange, onMoreTabChange,
}: ProjectTopNavProps) {
  const insets = useSafeAreaInsets();
  const [moreOpen, setMoreOpen] = useState(false);
  const [dynamicTabKey, setDynamicTabKey] = useState<MoreTab | null>(activeMoreTab || null);

  useEffect(() => {
    if (activeMoreTab) setDynamicTabKey(activeMoreTab);
  }, [activeMoreTab]);

  // 6 slots: summary, backlog, board, chat, dynamic, more
  const widths = useRef(Array.from({ length: 6 }).map((_, i) => new Animated.Value(i === 0 ? ACTIVE_W : INACTIVE_W))).current;
  const margins = useRef(Array.from({ length: 6 }).map((_, i) => new Animated.Value(i === 5 ? 0 : TAB_GAP))).current;
  const opacities = useRef(Array.from({ length: 6 }).map(() => new Animated.Value(1))).current;

  // Immediately hide slot 4 on mount if no activeMoreTab
  useEffect(() => {
    if (!activeMoreTab) {
      widths[4].setValue(0);
      margins[4].setValue(0);
      opacities[4].setValue(0);
    }
  }, []);

  useEffect(() => {
    const isDynamicActive = !!activeMoreTab;
    const cfg = { tension: 340, friction: 28, useNativeDriver: false };

    const targets = {
      0: { w: activeTab === 'summary' ? ACTIVE_W : INACTIVE_W, m: TAB_GAP, o: 1 },
      1: { w: activeTab === 'backlog' ? ACTIVE_W : INACTIVE_W, m: TAB_GAP, o: 1 },
      2: { w: activeTab === 'board' ? ACTIVE_W : INACTIVE_W, m: TAB_GAP, o: 1 },
      3: { w: activeTab === 'chat' ? ACTIVE_W : INACTIVE_W, m: TAB_GAP, o: 1 },
      4: {
        w: isDynamicActive ? (activeTab === activeMoreTab ? ACTIVE_W : INACTIVE_W) : 0,
        m: isDynamicActive ? TAB_GAP : 0,
        o: isDynamicActive ? 1 : 0
      },
      5: { w: activeTab === 'more' ? ACTIVE_W : INACTIVE_W, m: 0, o: 1 }
    };

    const anims = [];
    for (let i = 0; i < 6; i++) {
      anims.push(Animated.spring(widths[i], { toValue: targets[i as keyof typeof targets].w, ...cfg }));
      anims.push(Animated.spring(margins[i], { toValue: targets[i as keyof typeof targets].m, ...cfg }));
      anims.push(Animated.timing(opacities[i], { toValue: targets[i as keyof typeof targets].o, duration: 200, useNativeDriver: false }));
    }

    Animated.parallel(anims).start();
  }, [activeTab, activeMoreTab]);

  const entryY = useRef(new Animated.Value(-80)).current;
  const entryOp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.spring(entryY, { toValue: 0, tension: 200, friction: 24, useNativeDriver: true }),
      Animated.timing(entryOp, { toValue: 1, duration: 260, useNativeDriver: true }),
    ]).start();
  }, []);

  const navBarH = insets.top + 8 + ROW_H + 12;

  const dropdownHeightAnim = useRef(new Animated.Value(0)).current;
  const dropdownOp = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (moreOpen) {
      Animated.parallel([
        Animated.spring(dropdownHeightAnim, { toValue: 342, tension: 300, friction: 26, useNativeDriver: false }),
        Animated.timing(dropdownOp, { toValue: 1, duration: 200, useNativeDriver: true, delay: 50 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(dropdownHeightAnim, { toValue: 0, tension: 300, friction: 26, useNativeDriver: false }),
        Animated.timing(dropdownOp, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [moreOpen]);

  const handlePress = useCallback((tab: string) => {
    if (tab === 'more') {
      const opening = !moreOpen;
      setMoreOpen(opening);
      onTabChange('more');
    } else {
      setMoreOpen(false);
      onTabChange(tab as any);
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
          <View style={ns.breadcrumbRow}>
            <Text style={ns.breadcrumbText}>PROJECT</Text>
            <Text style={ns.breadcrumbSlash}>/</Text>
          </View>
          <Text style={ns.titleText} numberOfLines={1}>{projectName || 'Workspace'}</Text>
        </View>

        <View style={ns.row}>
          <TabBtn tab={TABS[0]} widthAnim={widths[0]} marginAnim={margins[0]} opacityAnim={opacities[0]} active={activeTab === 'summary'} onPress={() => handlePress('summary')} />
          <TabBtn tab={TABS[1]} widthAnim={widths[1]} marginAnim={margins[1]} opacityAnim={opacities[1]} active={activeTab === 'backlog'} onPress={() => handlePress('backlog')} />
          <TabBtn tab={TABS[2]} widthAnim={widths[2]} marginAnim={margins[2]} opacityAnim={opacities[2]} active={activeTab === 'board'} onPress={() => handlePress('board')} />
          <TabBtn tab={TABS[3]} widthAnim={widths[3]} marginAnim={margins[3]} opacityAnim={opacities[3]} active={activeTab === 'chat'} onPress={() => handlePress('chat')} />

          <TabBtn
            tab={{ key: dynamicTabKey || 'report', label: MORE_ITEMS.find(m => m.key === dynamicTabKey)?.label || 'Report' }}
            widthAnim={widths[4]}
            marginAnim={margins[4]}
            opacityAnim={opacities[4]}
            active={activeTab === dynamicTabKey}
            onPress={() => { if (dynamicTabKey) handlePress(dynamicTabKey); }}
          />

          <TabBtn tab={TABS[4]} widthAnim={widths[5]} marginAnim={margins[5]} opacityAnim={opacities[5]} active={activeTab === 'more'} onPress={() => handlePress('more')} />
        </View>

        {/* The Inline Full-Width Dropdown Area */}
        <Animated.View style={{ height: dropdownHeightAnim, overflow: 'hidden' }}>
          <Animated.View style={{ opacity: dropdownOp, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32 }}>
            <View style={ds.hdr}>
              <View style={ds.hdrAccent} />
              <Text style={ds.hdrTxt}>MORE VIEWS</Text>
            </View>

            <View style={ds.grid}>
              {MORE_ITEMS.map(item => {
                const isSel = activeMoreTab === item.key;
                return (
                  <TouchableOpacity
                    key={item.key}
                    onPress={() => { onMoreTabChange?.(item.key); setMoreOpen(false); }}
                    activeOpacity={0.7}
                    style={[ds.cellWrap, isSel && ds.cellSelWrap]}
                  >
                    <View style={ds.cellClip}>
                      <BlurView intensity={isSel ? 60 : 25} tint="light" style={StyleSheet.absoluteFill} />
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: isSel ? T.primaryLight + 'CC' : 'rgba(255,255,255,0.15)' }]} />
                    </View>
                    <View style={ds.cellContent}>
                      {isSel && <View style={ds.selDot} />}
                      <Text style={ds.emoji}>{item.emoji}</Text>
                      <Text style={ds.cellLbl}>{item.label}</Text>
                    </View>
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
    height: 56, // Increased height to fit the breadcrumb
    justifyContent: 'flex-end',
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
    justifyContent: 'center',
    height: ROW_H,
    alignItems: 'center',
    paddingHorizontal: 11,
  },
  tabBtn: {
    height: ROW_H,
    borderRadius: ROW_H / 2,
    justifyContent: 'center',
  },
  inactiveGlassClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ROW_H / 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  inactiveGlassColor: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  activeGlassShadow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ROW_H / 2,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 3 },
    }),
  },
  activeGlassClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ROW_H / 2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
  },
  activeGlassColor: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: T.primaryLight + 'A0', // Subtle brand-tinted glass
  },
  contentWrapper: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: ROW_H / 2,
    overflow: 'hidden',
  },
  touchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContentGroup: {
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
  hdrTxt: { fontSize: 11, fontWeight: '800', color: T.textSecondary, letterSpacing: 1.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  cellWrap: {
    width: (SW - 32 - 24) / 3,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  cellSelWrap: {
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 8 },
      android: { elevation: 2 },
    }),
  },
  cellClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  cellContent: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', 
    justifyContent: 'center',
    gap: 8,
  },
  emoji: { fontSize: 26 },
  cellLbl: { fontSize: 11.5, fontWeight: '800', color: T.primary, letterSpacing: 0.2 },
  selDot: {
    position: 'absolute', top: 10, right: 10,
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: T.primary,
  },
});


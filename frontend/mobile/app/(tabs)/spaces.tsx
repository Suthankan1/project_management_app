import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Pressable, Platform, Animated, Modal,
  KeyboardAvoidingView, ActivityIndicator, Dimensions, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import { T, getStripeColor } from '@/src/constants/tokens';
import api from '@/src/api/axios';
import { usePortfolios } from '@/src/hooks/usePortfolios';
import PortfolioCard from '@/src/components/portfolio/PortfolioCard';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpaceProject {
  id: number;
  name: string;
  projectKey?: string;
  isFavorite?: boolean;
  favoriteMarkedAt?: string;
  type?: 'AGILE' | 'KANBAN' | string;
  updatedAt?: string;
  lastAccessedAt?: string;
  memberCount?: number;
}

type TabKey     = 'projects' | 'portfolios';
type SortKey    = 'recent' | 'alphabetical';
type FilterKey  = 'all' | 'starred';
type ViewMode   = 'grid' | 'list';
type PFilterKey = 'all' | 'healthy' | 'at-risk';
type PSortKey   = 'recent' | 'alphabetical' | 'projects';

// ─── Portfolio creation constants ─────────────────────────────────────────────

const ACCENT_COLORS = ['#155DFC', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];
const EMOJIS = ['📁', '🚀', '💼', '⚡', '🎯', '💡', '🌟', '🔥', '🏆', '📊'];

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────

function SkeletonCard() {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={[sk.card, { opacity: anim }]}>
      <View style={sk.stripe} />
      <View style={sk.body}>
        <View style={sk.line1} /><View style={sk.line2} />
        <View style={sk.footer}><View style={sk.pill} /><View style={sk.pill} /></View>
      </View>
    </Animated.View>
  );
}

function SkeletonRow() {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={[sk.row, { opacity: anim }]}>
      <View style={sk.rowStripe} /><View style={sk.rowBody}><View style={sk.rowLine1} /><View style={sk.rowLine2} /></View>
      <View style={sk.rowPill} />
    </Animated.View>
  );
}

function SkeletonPortfolio() {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
    ])).start();
  }, []);
  return (
    <Animated.View style={[sk.pCard, { opacity: anim }]}>
      <View style={sk.pBar} />
      <View style={sk.pBody}>
        <View style={sk.pLine1} /><View style={sk.pLine2} />
        <View style={sk.pStats}>{[0,1,2].map(i => <View key={i} style={sk.pStat} />)}</View>
        <View style={sk.pProgress} />
      </View>
    </Animated.View>
  );
}

const sk = StyleSheet.create({
  card:     { flexDirection: 'row', width: '100%', height: 148, backgroundColor: '#F3F4F6', borderRadius: 16, overflow: 'hidden', marginBottom: 12 },
  stripe:   { width: 7, backgroundColor: '#E5E7EB' },
  body:     { flex: 1, padding: 16, gap: 10, justifyContent: 'space-between' },
  line1:    { height: 10, width: '50%', backgroundColor: '#E5E7EB', borderRadius: 5 },
  line2:    { height: 18, width: '75%', backgroundColor: '#E5E7EB', borderRadius: 5 },
  footer:   { flexDirection: 'row', gap: 8 },
  pill:     { height: 22, width: 60, backgroundColor: '#E5E7EB', borderRadius: 8 },
  row:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  rowStripe:{ width: 5, height: 40, borderRadius: 3, backgroundColor: '#E5E7EB' },
  rowBody:  { flex: 1, gap: 6 },
  rowLine1: { height: 9, width: '45%', backgroundColor: '#E5E7EB', borderRadius: 4 },
  rowLine2: { height: 14, width: '70%', backgroundColor: '#E5E7EB', borderRadius: 4 },
  rowPill:  { height: 26, width: 50, backgroundColor: '#E5E7EB', borderRadius: 8 },
  pCard:    { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#E8E8ED', backgroundColor: '#FFFFFF', marginBottom: 12 },
  pBar:     { height: 3, backgroundColor: '#E5E7EB' },
  pBody:    { padding: 16, gap: 10 },
  pLine1:   { height: 10, width: '40%', backgroundColor: '#F0F0F5', borderRadius: 5 },
  pLine2:   { height: 16, width: '65%', backgroundColor: '#F0F0F5', borderRadius: 5 },
  pStats:   { flexDirection: 'row', gap: 8 },
  pStat:    { flex: 1, height: 50, backgroundColor: '#F7F8FA', borderRadius: 10 },
  pProgress:{ height: 4, backgroundColor: '#F0F0F5', borderRadius: 2 },
});

// ─── Icons ────────────────────────────────────────────────────────────────────

function SearchIcon() {
  return <Svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Circle cx={11} cy={11} r={8} /><Path d="m21 21-4.3-4.3" /></Svg>;
}
function GridIcon({ active }: { active: boolean }) {
  return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={active ? T.primary : '#6B7280'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Rect x={3} y={3} width={7} height={7} rx={1} /><Rect x={14} y={3} width={7} height={7} rx={1} /><Rect x={3} y={14} width={7} height={7} rx={1} /><Rect x={14} y={14} width={7} height={7} rx={1} /></Svg>;
}
function ListIcon({ active }: { active: boolean }) {
  return <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={active ? T.primary : '#6B7280'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></Svg>;
}
function StarIcon({ filled }: { filled: boolean }) {
  return <Svg width={16} height={16} viewBox="0 0 24 24" fill={filled ? '#F5A623' : 'none'} stroke={filled ? '#F5A623' : '#CBD5E1'} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></Svg>;
}
function PlusIcon() {
  return <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth={2.5} strokeLinecap="round"><Path d="M12 5v14M5 12h14" /></Svg>;
}

// ─── Grid Card ────────────────────────────────────────────────────────────────

function GridCard({ project, onFav }: { project: SpaceProject; onFav: (id: number) => void }) {
  const router  = useRouter();
  const stripe  = getStripeColor(project.name);
  const isAgile = project.type !== 'KANBAN';
  const key     = project.projectKey ?? project.name.substring(0, 4).toUpperCase();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/summary/[projectId]', params: { projectId: project.id, projectName: project.name } } as never)}
      style={({ pressed }) => [gCard.card, pressed && gCard.pressed]}
    >
      <View style={[gCard.stripe, { backgroundColor: stripe }]} />
      <View style={gCard.body}>
        <View style={gCard.topRow}>
          <Text style={gCard.key}>{key} · {isAgile ? 'AGILE' : 'KANBAN'}</Text>
          <TouchableOpacity onPress={() => onFav(project.id)} hitSlop={8}><StarIcon filled={!!project.isFavorite} /></TouchableOpacity>
        </View>
        <Text style={gCard.name} numberOfLines={2}>{project.name}</Text>
        <View style={gCard.footer}>
          <View style={[gCard.pill, { backgroundColor: isAgile ? '#EEF2FF' : '#ECFDF5' }]}>
            <Text style={[gCard.pillText, { color: isAgile ? '#4F46E5' : '#059669' }]}>{isAgile ? 'Sprint' : 'Kanban'}</Text>
          </View>
          {project.memberCount != null && <Text style={gCard.members}>👥 {project.memberCount}</Text>}
          <View style={gCard.openBtn}><Text style={gCard.openTxt}>OPEN</Text></View>
        </View>
      </View>
    </Pressable>
  );
}
const gCard = StyleSheet.create({
  card:     { flexDirection: 'row', width: '100%', minHeight: 148, backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 3 } }) },
  pressed:  { opacity: 0.88, transform: [{ scale: 0.98 }] },
  stripe:   { width: 7 },
  body:     { flex: 1, padding: 16, justifyContent: 'space-between' },
  topRow:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  key:      { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 },
  name:     { fontSize: 15, fontWeight: '700', color: '#0F172A', lineHeight: 22, marginVertical: 6 },
  footer:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText: { fontSize: 10, fontWeight: '700' },
  members:  { fontSize: 11, color: '#94A3B8', flex: 1 },
  openBtn:  { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  openTxt:  { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
});

// ─── List Row ─────────────────────────────────────────────────────────────────

function ListRow({ project, onFav }: { project: SpaceProject; onFav: (id: number) => void }) {
  const router  = useRouter();
  const stripe  = getStripeColor(project.name);
  const isAgile = project.type !== 'KANBAN';
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/summary/[projectId]', params: { projectId: project.id, projectName: project.name } } as never)}
      style={({ pressed }) => [lRow.row, pressed && lRow.pressed]}
    >
      <View style={[lRow.stripe, { backgroundColor: stripe }]} />
      <View style={lRow.body}>
        <Text style={lRow.name} numberOfLines={1}>{project.name}</Text>
        <View style={lRow.meta}>
          {project.projectKey && <Text style={lRow.key}>{project.projectKey}</Text>}
          {project.updatedAt && <Text style={lRow.date}>{new Date(project.updatedAt).toLocaleDateString()}</Text>}
          {project.memberCount != null && <Text style={lRow.membersTxt}>👥 {project.memberCount}</Text>}
        </View>
      </View>
      <View style={[lRow.typePill, { backgroundColor: isAgile ? '#EEF2FF' : '#ECFDF5' }]}>
        <Text style={[lRow.typeText, { color: isAgile ? '#4F46E5' : '#059669' }]}>{isAgile ? 'Agile' : 'Kanban'}</Text>
      </View>
      <TouchableOpacity onPress={() => onFav(project.id)} hitSlop={8} style={lRow.star}><StarIcon filled={!!project.isFavorite} /></TouchableOpacity>
    </Pressable>
  );
}
const lRow = StyleSheet.create({
  row:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 8, gap: 12, ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }) },
  pressed:    { opacity: 0.85, backgroundColor: '#FAFBFF' },
  stripe:     { width: 5, alignSelf: 'stretch' },
  body:       { flex: 1, paddingVertical: 14, gap: 4 },
  name:       { fontSize: 14, fontWeight: '700', color: '#101828' },
  meta:       { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  key:        { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  date:       { fontSize: 11, color: '#9CA3AF' },
  membersTxt: { fontSize: 11, color: '#9CA3AF' },
  typePill:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 4 },
  typeText:   { fontSize: 10, fontWeight: '700' },
  star:       { padding: 12 },
});

// ─── Create Portfolio Sheet ───────────────────────────────────────────────────

function CreatePortfolioSheet({ visible, onClose, onCreate }: {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, color: string, emoji: string) => Promise<void>;
}) {
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [color,       setColor]       = useState(ACCENT_COLORS[0]);
  const [emoji,       setEmoji]       = useState('');
  const [loading,     setLoading]     = useState(false);
  const translateY = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    Animated.spring(translateY, { toValue: visible ? 0 : 600, useNativeDriver: true, tension: 320, friction: 30 }).start();
    if (!visible) { setName(''); setDescription(''); setColor(ACCENT_COLORS[0]); setEmoji(''); }
  }, [visible]);

  const submit = async () => {
    if (!name.trim()) return;
    setLoading(true);
    try { await onCreate(name.trim(), description.trim(), color, emoji); }
    finally { setLoading(false); }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={csh.outer} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableOpacity style={csh.backdrop} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[csh.sheet, { transform: [{ translateY }] }]}>
          <View style={[csh.accentBar, { backgroundColor: color }]} />
          <View style={csh.handle} />
          <Text style={csh.title}>New Portfolio</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={csh.emojiScroll} contentContainerStyle={csh.emojiContent}>
            {EMOJIS.map(e => (
              <TouchableOpacity key={e} onPress={() => setEmoji(emoji === e ? '' : e)}
                style={[csh.emojiBtn, emoji === e && { borderColor: color, borderWidth: 2 }]}>
                <Text style={csh.emojiText}>{e}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TextInput value={name} onChangeText={setName} placeholder="Portfolio name *" placeholderTextColor="#9CA3AF" style={csh.input} />
          <TextInput value={description} onChangeText={setDescription} placeholder="Description (optional)" placeholderTextColor="#9CA3AF" style={[csh.input, { marginBottom: 16 }]} />
          <Text style={csh.colorLabel}>Accent color</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={csh.colorRow}>
            {ACCENT_COLORS.map(c => (
              <TouchableOpacity key={c} onPress={() => setColor(c)}
                style={[csh.colorDot, { backgroundColor: c }, color === c && csh.colorDotActive]} />
            ))}
          </ScrollView>
          <View style={csh.actions}>
            <TouchableOpacity style={csh.cancelBtn} onPress={onClose}>
              <Text style={csh.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[csh.createBtn, { backgroundColor: color }, (!name.trim() || loading) && { opacity: 0.5 }]}
              onPress={submit} disabled={loading || !name.trim()}
            >
              {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={csh.createText}>Create</Text>}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const csh = StyleSheet.create({
  outer:          { flex: 1, justifyContent: 'flex-end' },
  backdrop:       { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.35)' },
  sheet:          { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 36, borderWidth: 1, borderColor: '#E8E8ED', ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.08, shadowRadius: 16 }, android: { elevation: 12 } }) },
  accentBar:      { height: 3, borderRadius: 2, marginBottom: 10 },
  handle:         { width: 36, height: 4, borderRadius: 2, backgroundColor: '#E8E8ED', alignSelf: 'center', marginBottom: 16 },
  title:          { fontSize: 17, fontWeight: '700', color: '#1A1A2E', marginBottom: 16 },
  emojiScroll:    { marginBottom: 14 },
  emojiContent:   { gap: 8, paddingRight: 8 },
  emojiBtn:       { width: 40, height: 40, borderRadius: 10, backgroundColor: '#F7F8FA', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E8E8ED' },
  emojiText:      { fontSize: 20 },
  input:          { backgroundColor: '#F7F8FA', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: '#1A1A2E', fontSize: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E8E8ED' },
  colorLabel:     { fontSize: 11, color: '#9CA3AF', fontWeight: '600', marginBottom: 8 },
  colorRow:       { gap: 8, marginBottom: 20, paddingRight: 8 },
  colorDot:       { width: 28, height: 28, borderRadius: 14 },
  colorDotActive: { transform: [{ scale: 1.25 }], borderWidth: 2, borderColor: 'rgba(0,0,0,0.15)' },
  actions:        { flexDirection: 'row', gap: 10 },
  cancelBtn:      { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center', backgroundColor: '#F7F8FA', borderWidth: 1, borderColor: '#E8E8ED' },
  cancelText:     { color: '#6B6F7B', fontWeight: '600', fontSize: 14 },
  createBtn:      { flex: 1, paddingVertical: 13, borderRadius: 12, alignItems: 'center' },
  createText:     { color: '#FFFFFF', fontWeight: '700', fontSize: 14 },
});

// ─── Main Unified Screen ──────────────────────────────────────────────────────

export default function SpacesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();

  // ── Tab ──
  const [activeTab,   setActiveTab]   = useState<TabKey>('projects');
  const tabAnim        = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
  const [containerW,  setContainerW]  = useState(Dimensions.get('window').width - 32);
  const PILL_W = (containerW - 8) / 2;

  // ── Projects ──
  const [projects,   setProjects]   = useState<SpaceProject[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterBy,   setFilterBy]   = useState<FilterKey>(() =>
    params.filter === 'favorites' ? 'starred' : 'all'
  );
  const [sortBy,   setSortBy]   = useState<SortKey>('recent');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // ── Portfolios ──
  const { portfolios, loading: pLoading, error: pError, refresh: refreshPortfolios, create: createPortfolio } = usePortfolios();
  const [showCreatePortfolio, setShowCreatePortfolio] = useState(false);
  const [pSearch,   setPSearch]   = useState('');
  const [pFilterBy, setPFilterBy] = useState<PFilterKey>('all');
  const [pSortBy,   setPSortBy]   = useState<PSortKey>('recent');

  // ── Fetch projects ──
  const fetchProjects = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get('/api/projects');
      setProjects(res.data as SpaceProject[]);
    } catch { /* silent */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchProjects(); }, [fetchProjects]);

  // ── Toggle favourite ──
  const toggleFav = useCallback(async (id: number) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p));
    try { await api.post(`/api/projects/${id}/favorite`); }
    catch { void fetchProjects(); }
  }, [fetchProjects]);

  // ── Filter + sort ──
  const displayed = useMemo(() => {
    return [...projects]
      .filter(p => {
        const match = p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.projectKey ?? '').toLowerCase().includes(search.toLowerCase());
        return filterBy === 'starred' ? match && !!p.isFavorite : match;
      })
      .sort((a, b) => {
        if (filterBy === 'starred') {
          const at = a.favoriteMarkedAt ? new Date(a.favoriteMarkedAt).getTime() : 0;
          const bt = b.favoriteMarkedAt ? new Date(b.favoriteMarkedAt).getTime() : 0;
          return at !== bt ? bt - at : a.name.localeCompare(b.name);
        }
        if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
        const ar = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
        const br = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
        return br - ar;
      });
  }, [projects, search, filterBy, sortBy]);

  const pDisplayed = useMemo(() => {
    return [...portfolios]
      .filter(p => {
        const match = p.name.toLowerCase().includes(pSearch.toLowerCase()) ||
          (p.description ?? '').toLowerCase().includes(pSearch.toLowerCase());
        if (pFilterBy === 'healthy')  return match && (p.healthScore ?? 100) >= 75;
        if (pFilterBy === 'at-risk')  return match && (p.healthScore ?? 100) < 75;
        return match;
      })
      .sort((a, b) => {
        if (pSortBy === 'alphabetical') return a.name.localeCompare(b.name);
        if (pSortBy === 'projects')     return (b.projectCount ?? 0) - (a.projectCount ?? 0);
        const at = a.updatedAt ? new Date(a.updatedAt).getTime() : new Date(a.createdAt).getTime();
        const bt = b.updatedAt ? new Date(b.updatedAt).getTime() : new Date(b.createdAt).getTime();
        return bt - at;
      });
  }, [portfolios, pSearch, pFilterBy, pSortBy]);

  const FILTER_TABS: { key: FilterKey; label: string }[] = [
    { key: 'all',     label: 'All'     },
    { key: 'starred', label: 'Starred' },
  ];
  const SORT_TABS: { key: SortKey; label: string }[] = [
    { key: 'recent',       label: 'Recent' },
    { key: 'alphabetical', label: 'A – Z'  },
  ];
  const P_FILTER_TABS: { key: PFilterKey; label: string }[] = [
    { key: 'all',     label: 'All'     },
    { key: 'healthy', label: 'Healthy' },
    { key: 'at-risk', label: 'At Risk' },
  ];
  const P_SORT_TABS: { key: PSortKey; label: string }[] = [
    { key: 'recent',       label: 'Recent'   },
    { key: 'alphabetical', label: 'A – Z'    },
    { key: 'projects',     label: 'Projects' },
  ];

  // ── Tab switch (animated pill + content fade) ──
  const switchTab = useCallback((tab: TabKey) => {
    if (tab === activeTab) return;
    Animated.spring(tabAnim, { toValue: tab === 'portfolios' ? 1 : 0, useNativeDriver: true, tension: 320, friction: 26 }).start();
    Animated.timing(contentOpacity, { toValue: 0.25, duration: 80, useNativeDriver: true }).start(() => {
      setActiveTab(tab);
      Animated.timing(contentOpacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    });
  }, [activeTab, tabAnim, contentOpacity]);

  const pillTranslateX = tabAnim.interpolate({ inputRange: [0, 1], outputRange: [0, PILL_W] });

  // ── Handle portfolio create ──
  const handleCreatePortfolio = async (name: string, description: string, color: string, emoji: string) => {
    await createPortfolio({ name, description: description || undefined, color, emoji: emoji || undefined });
    setShowCreatePortfolio(false);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* ── Header — no + button ── */}
      <View style={s.header}>
        <Text style={s.headerTitle}>
          {activeTab === 'projects' ? 'Spaces' : 'Portfolios'}
        </Text>
        <Text style={s.breadcrumb}>
          {activeTab === 'projects'
            ? (projects.length > 0 ? `${projects.length} project${projects.length !== 1 ? 's' : ''}` : 'Create and manage your projects')
            : (portfolios.length > 0 ? `${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''}` : 'Aggregate projects and track progress')}
        </Text>
      </View>

      {/* ── Animated tab switcher ── */}
      <View style={s.tabsWrapper}>
        <View style={s.tabsContainer} onLayout={e => setContainerW(e.nativeEvent.layout.width)}>
          {/* Sliding white pill indicator */}
          <Animated.View
            pointerEvents="none"
            style={[s.tabPill, { width: PILL_W, transform: [{ translateX: pillTranslateX }] }]}
          />
          <TouchableOpacity style={s.tabBtn} onPress={() => switchTab('projects')} activeOpacity={0.8}>
            <Text style={[s.tabBtnText, activeTab === 'projects' && s.tabBtnTextActive]}>Projects</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.tabBtn} onPress={() => switchTab('portfolios')} activeOpacity={0.8}>
            <Text style={[s.tabBtnText, activeTab === 'portfolios' && s.tabBtnTextActive]}>Portfolios</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content (fades on tab switch) ── */}
      <Animated.View style={[s.contentArea, { opacity: contentOpacity }]}>
        {activeTab === 'projects' ? (
          <>
            {/* Search */}
            <View style={s.searchRow}>
              <View style={s.searchBox}>
                <SearchIcon />
                <TextInput style={s.searchInput} placeholder="Search projects" placeholderTextColor="#9CA3AF" value={search} onChangeText={setSearch} />
                {search.length > 0 && <TouchableOpacity onPress={() => setSearch('')}><Text style={s.clearX}>✕</Text></TouchableOpacity>}
              </View>
            </View>

            {/* Controls */}
            <View style={s.controlsWrapper}>
              <View style={s.controlsRow}>
                <View style={s.tabGroupText}>
                  {FILTER_TABS.map(t => (
                    <TouchableOpacity key={t.key} style={[s.tabTextWrap, filterBy === t.key && s.tabActive]} onPress={() => setFilterBy(t.key)}>
                      <Text style={[s.tabTxt, filterBy === t.key && s.tabTxtActive]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.dividerV} />
                <View style={s.tabGroupText}>
                  {SORT_TABS.map(t => (
                    <TouchableOpacity key={t.key} style={[s.tabTextWrap, sortBy === t.key && s.tabActive]} onPress={() => setSortBy(t.key)}>
                      <Text style={[s.tabTxt, sortBy === t.key && s.tabTxtActive]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.dividerV} />
                <View style={s.tabGroupIcon}>
                  <TouchableOpacity style={[s.tabIconWrap, viewMode === 'grid' && s.tabActive]} onPress={() => setViewMode('grid')}>
                    <GridIcon active={viewMode === 'grid'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.tabIconWrap, viewMode === 'list' && s.tabActive]} onPress={() => setViewMode('list')}>
                    <ListIcon active={viewMode === 'list'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {!loading && (
              <Text style={s.resultCount}>
                {displayed.length} project{displayed.length !== 1 ? 's' : ''}{search ? ` for "${search}"` : ''}
              </Text>
            )}

            <ScrollView
              style={s.scroll}
              contentContainerStyle={s.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => fetchProjects(true)} tintColor={T.primary} colors={[T.primary]} />
              }
            >
              {loading
                ? [0,1,2,3,4,5].map(i => viewMode === 'grid' ? <SkeletonCard key={i} /> : <SkeletonRow key={i} />)
                : displayed.length === 0
                  ? (
                    <View style={s.emptyWrap}>
                      <View style={s.emptyIcon}>
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5}><Rect x={3} y={3} width={18} height={18} rx={2} /><Path d="M9 9h6v6H9z" /></Svg>
                      </View>
                      <Text style={s.emptyTitle}>{search ? 'No projects found' : 'No projects yet'}</Text>
                      <Text style={s.emptySub}>{search ? 'Try a different search term' : 'Create your first project to get started.'}</Text>
                      {!search && (
                        <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/createProject' as never)}>
                          <Text style={s.emptyBtnTxt}>Create Project</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )
                  : viewMode === 'grid'
                    ? displayed.map(p => <GridCard key={p.id} project={p} onFav={toggleFav} />)
                    : displayed.map(p => <ListRow key={p.id} project={p} onFav={toggleFav} />)
              }
              <View style={{ height: 100 }} />
            </ScrollView>
          </>
        ) : (
          /* ── Portfolios tab ── */
          <>
            {/* Search */}
            <View style={s.searchRow}>
              <View style={s.searchBox}>
                <SearchIcon />
                <TextInput style={s.searchInput} placeholder="Search portfolios" placeholderTextColor="#9CA3AF" value={pSearch} onChangeText={setPSearch} />
                {pSearch.length > 0 && <TouchableOpacity onPress={() => setPSearch('')}><Text style={s.clearX}>✕</Text></TouchableOpacity>}
              </View>
            </View>

            {/* Controls */}
            <View style={s.controlsWrapper}>
              <View style={s.controlsRow}>
                <View style={s.tabGroupText}>
                  {P_FILTER_TABS.map(t => (
                    <TouchableOpacity key={t.key} style={[s.tabTextWrap, pFilterBy === t.key && s.tabActive]} onPress={() => setPFilterBy(t.key)}>
                      <Text style={[s.tabTxt, pFilterBy === t.key && s.tabTxtActive]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={s.dividerV} />
                <View style={s.tabGroupText}>
                  {P_SORT_TABS.map(t => (
                    <TouchableOpacity key={t.key} style={[s.tabTextWrap, pSortBy === t.key && s.tabActive]} onPress={() => setPSortBy(t.key)}>
                      <Text style={[s.tabTxt, pSortBy === t.key && s.tabTxtActive]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {!pLoading && (
              <Text style={s.resultCount}>
                {pDisplayed.length} portfolio{pDisplayed.length !== 1 ? 's' : ''}{pSearch ? ` for "${pSearch}"` : ''}
              </Text>
            )}

            <ScrollView
              style={s.scroll}
              contentContainerStyle={s.scrollContent}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={pLoading && portfolios.length > 0}
                  onRefresh={refreshPortfolios}
                  tintColor={T.primary}
                  colors={[T.primary]}
                />
              }
            >
              {pLoading && portfolios.length === 0
                ? [0,1,2].map(i => <SkeletonPortfolio key={i} />)
                : pError
                  ? (
                    <View style={s.centerState}>
                      <Text style={s.errorText}>{pError}</Text>
                      <TouchableOpacity onPress={refreshPortfolios} style={s.retryBtn}>
                        <Text style={s.retryTxt}>Retry</Text>
                      </TouchableOpacity>
                    </View>
                  )
                  : portfolios.length === 0
                    ? (
                      <View style={s.emptyWrap}>
                        <View style={[s.emptyIcon, { backgroundColor: '#EBF2FF' }]}>
                          <Text style={{ fontSize: 28 }}>📁</Text>
                        </View>
                        <Text style={s.emptyTitle}>No portfolios yet</Text>
                        <Text style={s.emptySub}>Group your projects to track cross-project health and progress.</Text>
                        <TouchableOpacity style={s.emptyBtn} onPress={() => setShowCreatePortfolio(true)}>
                          <Text style={s.emptyBtnTxt}>Create Portfolio</Text>
                        </TouchableOpacity>
                      </View>
                    )
                    : pDisplayed.length === 0
                      ? (
                        <View style={s.emptyWrap}>
                          <View style={s.emptyIcon}>
                            <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5}><Rect x={3} y={3} width={18} height={18} rx={2} /><Path d="M9 9h6v6H9z" /></Svg>
                          </View>
                          <Text style={s.emptyTitle}>No portfolios found</Text>
                          <Text style={s.emptySub}>Try a different search term or filter.</Text>
                        </View>
                      )
                      : pDisplayed.map(p => <PortfolioCard key={p.id} portfolio={p} />)
              }
              <View style={{ height: 100 }} />
            </ScrollView>
          </>
        )}
      </Animated.View>

      {/* ── FAB — action depends on active tab ── */}
      <TouchableOpacity
        style={s.fab}
        onPress={() => activeTab === 'projects'
          ? router.push('/createProject' as never)
          : setShowCreatePortfolio(true)
        }
        activeOpacity={0.85}
      >
        <PlusIcon />
      </TouchableOpacity>

      {/* ── Create Portfolio Sheet ── */}
      <CreatePortfolioSheet
        visible={showCreatePortfolio}
        onClose={() => setShowCreatePortfolio(false)}
        onCreate={handleCreatePortfolio}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#101828', letterSpacing: -0.5 },
  breadcrumb:  { fontSize: 11, color: '#9CA3AF', marginTop: 2 },

  tabsWrapper: {
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F5',
    borderRadius: 12,
    padding: 4,
  },
  tabPill: {
    position: 'absolute',
    top: 4, left: 4, bottom: 4,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
      android: { elevation: 2 },
    }),
  },
  tabBtn:          { flex: 1, paddingVertical: 9, alignItems: 'center', justifyContent: 'center', borderRadius: 8, zIndex: 1 },
  tabBtnText:      { fontSize: 13, fontWeight: '500', color: '#6B6F7B' },
  tabBtnTextActive:{ color: '#155DFC', fontWeight: '700' },

  contentArea: { flex: 1 },

  searchRow: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 0, backgroundColor: '#FFFFFF' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1,
    borderColor: '#D1D5DC', paddingHorizontal: 12, height: 38,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#374151', paddingVertical: 0 },
  clearX:      { fontSize: 13, color: '#9CA3AF', paddingHorizontal: 4 },

  controlsWrapper: { backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  controlsRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10,
    alignItems: 'center', gap: 6, width: '100%',
  },
  tabGroupText: { flex: 1, flexDirection: 'row', backgroundColor: '#F4F5F7', padding: 4, borderRadius: 12, gap: 2 },
  tabGroupIcon: { flexDirection: 'row', backgroundColor: '#F4F5F7', padding: 4, borderRadius: 12, gap: 2 },
  tabTextWrap:  { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  tabIconWrap:  { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  tabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 2 }, android: { elevation: 2 } }),
  },
  tabTxt:       { fontSize: 12, fontWeight: '500', color: '#4A5565' },
  tabTxtActive: { color: T.primary, fontWeight: '700' },
  dividerV:     { width: 1, height: 28, backgroundColor: '#E5E7EB' },

  resultCount: { fontSize: 12, color: '#9CA3AF', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 2, fontWeight: '500' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 8 },

  emptyWrap:  { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon:  { width: 64, height: 64, borderRadius: 32, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  emptySub:   { fontSize: 14, color: '#4A5565', textAlign: 'center' },
  emptyBtn:   { marginTop: 8, backgroundColor: T.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  emptyBtnTxt:{ color: '#FFF', fontSize: 14, fontWeight: '700' },

  centerState: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  errorText:   { color: '#FF5C5C', fontSize: 14, marginBottom: 12, textAlign: 'center' },
  retryBtn:    { backgroundColor: '#EBF2FF', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryTxt:    { color: T.primary, fontWeight: '600', fontSize: 14 },

  fab: {
    position: 'absolute', right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 90,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: T.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: T.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
});

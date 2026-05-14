import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Pressable, Platform, Animated, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Svg, { Path, Circle, Polygon, Rect } from 'react-native-svg';
import { T, getStripeColor } from '@/src/constants/tokens';
import api from '@/src/api/axios';

// ─── Types (mirrors web SpaceProject interface exactly) ───────────────────────

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

type SortKey    = 'recent' | 'alphabetical';
type FilterKey  = 'all' | 'starred';
type ViewMode   = 'grid' | 'list';

// ─── Skeleton shimmer ─────────────────────────────────────────────────────────

function SkeletonCard() {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[sk.card, { opacity: anim }]}>
      <View style={sk.stripe} />
      <View style={sk.body}>
        <View style={sk.line1} />
        <View style={sk.line2} />
        <View style={sk.footer}>
          <View style={sk.pill} />
          <View style={sk.pill} />
        </View>
      </View>
    </Animated.View>
  );
}

function SkeletonRow() {
  const anim = React.useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[sk.row, { opacity: anim }]}>
      <View style={sk.rowStripe} />
      <View style={sk.rowBody}>
        <View style={sk.rowLine1} />
        <View style={sk.rowLine2} />
      </View>
      <View style={sk.rowPill} />
    </Animated.View>
  );
}

const sk = StyleSheet.create({
  card: {
    flexDirection: 'row', width: '100%', height: 148,
    backgroundColor: '#F3F4F6', borderRadius: 16,
    overflow: 'hidden', marginBottom: 12,
  },
  stripe: { width: 7, backgroundColor: '#E5E7EB' },
  body:   { flex: 1, padding: 16, gap: 10, justifyContent: 'space-between' },
  line1:  { height: 10, width: '50%', backgroundColor: '#E5E7EB', borderRadius: 5 },
  line2:  { height: 18, width: '75%', backgroundColor: '#E5E7EB', borderRadius: 5 },
  footer: { flexDirection: 'row', gap: 8 },
  pill:   { height: 22, width: 60, backgroundColor: '#E5E7EB', borderRadius: 8 },

  row:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8, gap: 12, borderWidth: 1, borderColor: '#F1F5F9' },
  rowStripe:{ width: 5, height: 40, borderRadius: 3, backgroundColor: '#E5E7EB' },
  rowBody:  { flex: 1, gap: 6 },
  rowLine1: { height: 9, width: '45%', backgroundColor: '#E5E7EB', borderRadius: 4 },
  rowLine2: { height: 14, width: '70%', backgroundColor: '#E5E7EB', borderRadius: 4 },
  rowPill:  { height: 26, width: 50, backgroundColor: '#E5E7EB', borderRadius: 8 },
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

// ─── Grid Card (mirrors web RecentProjectCard) ────────────────────────────────

function GridCard({ project, onFav }: { project: SpaceProject; onFav: (id: number) => void }) {
  const router = useRouter();
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
          <TouchableOpacity onPress={() => onFav(project.id)} hitSlop={8}>
            <StarIcon filled={!!project.isFavorite} />
          </TouchableOpacity>
        </View>
        <Text style={gCard.name} numberOfLines={2}>{project.name}</Text>
        <View style={gCard.footer}>
          <View style={[gCard.pill, { backgroundColor: isAgile ? '#EEF2FF' : '#ECFDF5' }]}>
            <Text style={[gCard.pillText, { color: isAgile ? '#4F46E5' : '#059669' }]}>
              {isAgile ? 'Sprint' : 'Kanban'}
            </Text>
          </View>
          {project.memberCount != null && (
            <Text style={gCard.members}>👥 {project.memberCount}</Text>
          )}
          <View style={gCard.openBtn}>
            <Text style={gCard.openTxt}>OPEN</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const gCard = StyleSheet.create({
  card: {
    flexDirection: 'row', width: '100%', minHeight: 148,
    backgroundColor: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 12,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8 }, android: { elevation: 3 } }),
  },
  pressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  stripe:  { width: 7 },
  body:    { flex: 1, padding: 16, justifyContent: 'space-between' },
  topRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  key:     { fontSize: 10, fontWeight: '700', color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase', flex: 1 },
  name:    { fontSize: 15, fontWeight: '700', color: '#0F172A', lineHeight: 22, marginVertical: 6 },
  footer:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pill:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  pillText:{ fontSize: 10, fontWeight: '700' },
  members: { fontSize: 11, color: '#94A3B8', flex: 1 },
  openBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  openTxt: { fontSize: 9, fontWeight: '800', color: '#64748B', letterSpacing: 1 },
});

// ─── List Row (mirrors web list-view table row) ───────────────────────────────

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
          {project.updatedAt && (
            <Text style={lRow.date}>{new Date(project.updatedAt).toLocaleDateString()}</Text>
          )}
          {project.memberCount != null && <Text style={lRow.membersTxt}>👥 {project.memberCount}</Text>}
        </View>
      </View>
      <View style={[lRow.typePill, { backgroundColor: isAgile ? '#EEF2FF' : '#ECFDF5' }]}>
        <Text style={[lRow.typeText, { color: isAgile ? '#4F46E5' : '#059669' }]}>
          {isAgile ? 'Agile' : 'Kanban'}
        </Text>
      </View>
      <TouchableOpacity onPress={() => onFav(project.id)} hitSlop={8} style={lRow.star}>
        <StarIcon filled={!!project.isFavorite} />
      </TouchableOpacity>
    </Pressable>
  );
}

const lRow = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden',
    borderWidth: 1, borderColor: '#F1F5F9', marginBottom: 8, gap: 12,
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 }, android: { elevation: 1 } }),
  },
  pressed: { opacity: 0.85, backgroundColor: '#FAFBFF' },
  stripe:  { width: 5, alignSelf: 'stretch' },
  body:    { flex: 1, paddingVertical: 14, gap: 4 },
  name:    { fontSize: 14, fontWeight: '700', color: '#101828' },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  key:     { fontSize: 11, color: '#9CA3AF', fontWeight: '600' },
  date:    { fontSize: 11, color: '#9CA3AF' },
  membersTxt: { fontSize: 11, color: '#9CA3AF' },
  typePill:{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginRight: 4 },
  typeText:{ fontSize: 10, fontWeight: '700' },
  star:    { padding: 12 },
});

// ─── Main SpacesScreen ────────────────────────────────────────────────────────

export default function SpacesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();

  const [projects,   setProjects]   = useState<SpaceProject[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search,     setSearch]     = useState('');
  const [filterBy,   setFilterBy]   = useState<FilterKey>(() =>
    params.filter === 'favorites' ? 'starred' : 'all'
  );
  const [sortBy,     setSortBy]     = useState<SortKey>('recent');
  const [viewMode, setViewMode]     = useState<ViewMode>('grid');

  // ── Fetch all projects — exact same API as web: GET /api/projects ────────────
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

  // ── Toggle favourite — exact same as web: POST /api/projects/:id/favorite ───
  const toggleFav = useCallback(async (id: number) => {
    setProjects(prev =>
      prev.map(p => p.id === id ? { ...p, isFavorite: !p.isFavorite } : p)
    );
    try { await api.post(`/api/projects/${id}/favorite`); }
    catch { void fetchProjects(); } // rollback on error
  }, [fetchProjects]);

  // ── Filtered + sorted list (same logic as web filteredAndSortedProjects) ────
  const displayed = useMemo(() => {
    return [...projects]
      .filter(p => {
        const matchSearch =
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.projectKey ?? '').toLowerCase().includes(search.toLowerCase());
        if (filterBy === 'starred') return matchSearch && !!p.isFavorite;
        return matchSearch;
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

  const FILTER_TABS:  { key: FilterKey; label: string }[] = [
    { key: 'all',     label: 'All'     },
    { key: 'starred', label: 'Starred' },
  ];
  const SORT_TABS: { key: SortKey; label: string }[] = [
    { key: 'recent',          label: 'Recent'    },
    { key: 'alphabetical',    label: 'A – Z'     },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* ── Header ── */}
      <View style={s.header}>
        <View>
          <Text style={s.headerTitle}>All spaces</Text>
          <Text style={s.breadcrumb}>Dashboard / Spaces</Text>
        </View>
        <TouchableOpacity style={s.createBtn} onPress={() => router.push('/createProject' as never)} activeOpacity={0.85}>
          <PlusIcon />
          <Text style={s.createTxt}>New space</Text>
        </TouchableOpacity>
      </View>

      {/* ── Search ── */}
      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <SearchIcon />
          <TextInput
            style={s.searchInput}
            placeholder="Search spaces"
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={s.clearX}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Controls: filter + sort + view toggle ── */}
      <View style={s.controlsWrapper}>
        <View style={s.controlsRow}>
          {/* Filter tabs */}
        <View style={s.tabGroupText}>
          {FILTER_TABS.map(t => (
            <TouchableOpacity key={t.key} style={[s.tabTextWrap, filterBy === t.key && s.tabActive]} onPress={() => setFilterBy(t.key)}>
              <Text style={[s.tabTxt, filterBy === t.key && s.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.dividerV} />

        {/* Sort tabs */}
        <View style={s.tabGroupText}>
          {SORT_TABS.map(t => (
            <TouchableOpacity key={t.key} style={[s.tabTextWrap, sortBy === t.key && s.tabActive]} onPress={() => setSortBy(t.key)}>
              <Text style={[s.tabTxt, sortBy === t.key && s.tabTxtActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.dividerV} />

        {/* View toggle */}
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

      {/* ── Results count ── */}
      {!loading && (
        <Text style={s.resultCount}>
          {displayed.length} space{displayed.length !== 1 ? 's' : ''}
          {search ? ` for "${search}"` : ''}
        </Text>
      )}

      {/* ── Content ── */}
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        onRefresh={() => fetchProjects(true)}
        refreshing={refreshing}
      >
        {loading ? (
          // Skeleton
          <>
            {[0,1,2,3,4,5].map(i => (
              viewMode === 'grid' ? <SkeletonCard key={i} /> : <SkeletonRow key={i} />
            ))}
          </>
        ) : displayed.length === 0 ? (
          // Empty state (mirrors web)
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth={1.5}><Rect x={3} y={3} width={18} height={18} rx={2} /><Path d="M9 9h6v6H9z" /></Svg>
            </View>
            <Text style={s.emptyTitle}>{search ? 'No spaces found' : 'No spaces yet'}</Text>
            <Text style={s.emptySub}>
              {search ? 'Try a different search term' : 'Create your first project to get started.'}
            </Text>
            {!search && (
              <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/createProject' as never)}>
                <Text style={s.emptyBtnTxt}>Create Project</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : viewMode === 'grid' ? (
          displayed.map(p => <GridCard key={p.id} project={p} onFav={toggleFav} />)
        ) : (
          displayed.map(p => <ListRow key={p.id} project={p} onFav={toggleFav} />)
        )}

        {/* FAB clearance */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB — mirrors web fab md:hidden */}
      <TouchableOpacity style={s.fab} onPress={() => router.push('/createProject' as never)} activeOpacity={0.85}>
        <PlusIcon />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F7F8FA' },

  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#101828', letterSpacing: -0.5 },
  breadcrumb:  { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  createBtn: {
    marginTop: 10,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: T.primary, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12,
    ...Platform.select({ ios: { shadowColor: T.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } }),
  },
  createTxt: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  searchRow: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 0, backgroundColor: '#FFFFFF' },
  searchBox: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1,
    borderColor: '#D1D5DC', paddingHorizontal: 12, height: 38,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#374151', paddingVertical: 0 },
  clearX: { fontSize: 13, color: '#9CA3AF', paddingHorizontal: 4 },

  controlsWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  controlsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 10,
    alignItems: 'center', gap: 6,
    width: '100%',
  },
  tabGroupText: {
    flex: 1,
    flexDirection: 'row', backgroundColor: '#F4F5F7',
    padding: 4, borderRadius: 12, gap: 2,
  },
  tabGroupIcon: {
    flexDirection: 'row', backgroundColor: '#F4F5F7',
    padding: 4, borderRadius: 12, gap: 2,
  },
  tabTextWrap: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  tabIconWrap: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  tabActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 2 }, android: { elevation: 2 } }),
  },
  tabTxt:       { fontSize: 12, fontWeight: '500', color: '#4A5565' },
  tabTxtActive: { color: T.primary, fontWeight: '700' },
  dividerV: { width: 1, height: 28, backgroundColor: '#E5E7EB' },

  resultCount: { fontSize: 12, color: '#9CA3AF', paddingHorizontal: 16, paddingTop: 6, paddingBottom: 2, fontWeight: '500' },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingTop: 4 },

  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#101828' },
  emptySub:   { fontSize: 14, color: '#4A5565', textAlign: 'center' },
  emptyBtn: {
    marginTop: 8, backgroundColor: T.primary,
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12,
  },
  emptyBtnTxt: { color: '#FFF', fontSize: 14, fontWeight: '700' },

  fab: {
    position: 'absolute', right: 20,
    bottom: Platform.OS === 'ios' ? 100 : 90,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: T.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({ ios: { shadowColor: T.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 12 }, android: { elevation: 8 } }),
  },
});

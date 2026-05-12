import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, FlatList, Animated,
  StyleSheet, Pressable, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Svg, { Path, Circle } from 'react-native-svg';
import { T } from '@/src/constants/tokens';
import api from '@/src/api/axios';

// ─── Type (mirrors web Notification interface exactly) ────────────────────────

interface Notification {
  id: number;
  message: string;
  type?: string;
  link?: string;
  read: boolean;
  createdAt: string;
  [key: string]: unknown;
}

type NotificationFilter = 'all' | 'unread' | 'read';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function SkeletonItem() {
  const anim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[sk.wrap, { opacity: anim }]}>
      <View style={sk.dot} />
      <View style={sk.body}>
        <View style={sk.line1} />
        <View style={sk.line2} />
        <View style={sk.line3} />
      </View>
    </Animated.View>
  );
}

const sk = StyleSheet.create({
  wrap:  { flexDirection: 'row', padding: 16, gap: 14, alignItems: 'flex-start' },
  dot:   { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E5E7EB', marginTop: 2 },
  body:  { flex: 1, gap: 7 },
  line1: { height: 10, width: '40%', backgroundColor: '#E5E7EB', borderRadius: 5 },
  line2: { height: 14, width: '90%', backgroundColor: '#E5E7EB', borderRadius: 5 },
  line3: { height: 10, width: '30%', backgroundColor: '#E5E7EB', borderRadius: 5 },
});

// ─── Type icon + colors (mirrors web NotificationsList tone logic) ────────────

const TYPE_TONE: Record<string, { icon: string; bg: string; color: string }> = {
  COMMENT:       { icon: '💬', bg: '#EFF6FF', color: '#2563EB' },
  MENTION:       { icon: '@',  bg: '#F5F3FF', color: '#7C3AED' },
  TASK_ASSIGNED: { icon: '✓',  bg: '#ECFDF5', color: '#059669' },
  TASK_UPDATED:  { icon: '✎',  bg: '#FFF7ED', color: '#EA580C' },
  PROJECT:       { icon: '📁', bg: '#FAFAFA', color: '#374151' },
};

function NotifIcon({ type }: { type?: string }) {
  const tone = TYPE_TONE[type ?? ''] ?? { icon: '🔔', bg: '#FFFBEB', color: '#D97706' };
  return (
    <View style={[nIcon.wrap, { backgroundColor: tone.bg }]}>
      <Text style={[nIcon.emoji, { color: tone.color }]}>{tone.icon}</Text>
    </View>
  );
}
const nIcon = StyleSheet.create({
  wrap:  { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 18 },
});

// ─── Relative time (mirrors web utils.ts formatRelativeTime) ─────────────────

function timeAgo(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)    return 'Just now';
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800)return `${Math.floor(diff / 86400)}d ago`;
  return new Date(iso).toLocaleDateString();
}

// ─── Notification row ────────────────────────────────────────────────────────

function NotifRow({
  item, onRead, onDelete,
}: {
  item: Notification;
  onRead: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <Pressable
      onPress={() => !item.read && onRead(item.id)}
      style={({ pressed }) => [nRow.row, !item.read && nRow.unread, pressed && nRow.pressed]}
    >
      {/* Unread blue dot */}
      {!item.read && <View style={nRow.blueDot} />}

      {/* Icon */}
      <NotifIcon type={item.type} />

      {/* Content */}
      <View style={nRow.body}>
        <Text style={[nRow.msg, item.read && nRow.msgRead]} numberOfLines={3}>
          {item.message}
        </Text>
        <Text style={nRow.time}>{timeAgo(item.createdAt)}</Text>
      </View>

      {/* Delete button */}
      <TouchableOpacity
        style={nRow.delBtn}
        onPress={() => onDelete(item.id)}
        hitSlop={8}
      >
        <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#D1D5DB" strokeWidth={2} strokeLinecap="round">
          <Path d="M18 6L6 18M6 6l12 12" />
        </Svg>
      </TouchableOpacity>
    </Pressable>
  );
}

const nRow = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 14,
    backgroundColor: '#FFFFFF', gap: 12,
    position: 'relative',
  },
  unread:  { backgroundColor: '#FAFBFF' },
  pressed: { backgroundColor: '#F8FAFC' },
  blueDot: {
    position: 'absolute', left: 5, top: '50%',
    width: 6, height: 6, borderRadius: 3, backgroundColor: T.primary,
  },
  body:    { flex: 1, gap: 4 },
  msg:     { fontSize: 13.5, fontWeight: '500', color: '#1E293B', lineHeight: 19 },
  msgRead: { color: '#6B7280', fontWeight: '400' },
  time:    { fontSize: 11, color: '#9CA3AF' },
  delBtn:  { padding: 6, borderRadius: 8, marginTop: 2 },
});

// ─── Stats row (mirrors web NotificationStats component) ─────────────────────

function StatsRow({ total, unread }: { total: number; unread: number }) {
  const read = total - unread;
  const stats = [
    { label: 'Total', value: total, bg: '#F8FAFC', textColor: '#374151' },
    { label: 'Unread', value: unread, bg: T.primaryLight, textColor: T.primary },
    { label: 'Read', value: read, bg: '#F0FDF4', textColor: '#15803D' },
  ];
  return (
    <View style={statsRow.wrap}>
      {stats.map(s => (
        <View key={s.label} style={[statsRow.card, { backgroundColor: s.bg }]}>
          <Text style={[statsRow.val, { color: s.textColor }]}>{s.value}</Text>
          <Text style={statsRow.label}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
const statsRow = StyleSheet.create({
  wrap:  { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  card:  { flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 12, gap: 2 },
  val:   { fontSize: 22, fontWeight: '800' },
  label: { fontSize: 11, fontWeight: '600', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.6 },
});

// ─── Main InboxScreen ────────────────────────────────────────────────────────

export default function InboxScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [refreshing,    setRefreshing]    = useState(false);
  const [filter,        setFilter]        = useState<NotificationFilter>('all');
  const [deletingAll,   setDeletingAll]   = useState(false);

  // ── Fetch — mirrors web: GET /api/notifications ───────────────────────────
  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.get<Notification[]>('/api/notifications');
      const sorted = [...res.data].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setNotifications(sorted);
    } catch { setNotifications([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void fetchAll(); }, [fetchAll]);

  // ── Mark single read — mirrors: PATCH /api/notifications/:id/read ─────────
  const markRead = useCallback(async (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    try { await api.patch(`/api/notifications/${id}/read`); }
    catch { void fetchAll(); }
  }, [fetchAll]);

  // ── Mark all read — mirrors: PATCH /api/notifications/read-all ───────────
  const markAllRead = useCallback(async () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    try { await api.patch('/api/notifications/read-all'); }
    catch { void fetchAll(); }
  }, [fetchAll]);

  // ── Delete single — mirrors: DELETE /api/notifications/:id ───────────────
  const deleteSingle = useCallback(async (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    try { await api.delete(`/api/notifications/${id}`); }
    catch { void fetchAll(); }
  }, [fetchAll]);

  // ── Delete all — mirrors: Promise.allSettled of deleteNotification(id)s ───
  const deleteAll = useCallback(async () => {
    if (notifications.length === 0 || deletingAll) return;
    Alert.alert('Clear all', 'Delete all notifications?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: async () => {
        setDeletingAll(true);
        const ids = notifications.map(n => n.id);
        await Promise.allSettled(ids.map(id => api.delete(`/api/notifications/${id}`)));
        setNotifications([]);
        setDeletingAll(false);
      }},
    ]);
  }, [notifications, deletingAll]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const visible = useMemo(() => {
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'read')   return notifications.filter(n => n.read);
    return notifications;
  }, [notifications, filter]);

  const FILTERS: { key: NotificationFilter; label: string }[] = [
    { key: 'all',    label: 'All'    },
    { key: 'unread', label: 'Unread' },
    { key: 'read',   label: 'Read'   },
  ];

  return (
    <SafeAreaView style={s.safe} edges={['top', 'left', 'right']}>
      <StatusBar style="dark" />

      {/* ── Header (mirrors web NotificationHeader) ── */}
      <View style={s.header}>
        <View>
          <Text style={s.title}>Inbox</Text>
          {unreadCount > 0 && (
            <Text style={s.sub}>{unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</Text>
          )}
        </View>
        <View style={s.headerActions}>
          {unreadCount > 0 && (
            <TouchableOpacity style={s.markAllBtn} onPress={markAllRead}>
              <Text style={s.markAllTxt}>Mark all read</Text>
            </TouchableOpacity>
          )}
          {notifications.length > 0 && (
            <TouchableOpacity style={s.deleteAllBtn} onPress={deleteAll} disabled={deletingAll}>
              <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth={2} strokeLinecap="round">
                <Path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />
              </Svg>
              <Text style={s.deleteAllTxt}>{deletingAll ? 'Clearing…' : 'Clear all'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Stats ── */}
      {!loading && <StatsRow total={notifications.length} unread={unreadCount} />}

      {/* ── Filter tabs (mirrors web NotificationFilters) ── */}
      <View style={s.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[s.filterTab, filter === f.key && s.filterTabActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[s.filterTxt, filter === f.key && s.filterTxtActive]}>
              {f.label}
              {f.key === 'unread' && unreadCount > 0 ? ` (${unreadCount})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── List (mirrors web NotificationsList) ── */}
      {loading ? (
        <View>
          {[0,1,2,3,4,5].map(i => (
            <View key={i}>
              <SkeletonItem />
              {i < 5 && <View style={s.divider} />}
            </View>
          ))}
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={n => String(n.id)}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={() => fetchAll(true)}
          contentContainerStyle={s.list}
          ItemSeparatorComponent={() => <View style={s.divider} />}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyEmoji}>
                {filter === 'unread' ? '✅' : '📭'}
              </Text>
              <Text style={s.emptyTitle}>
                {filter === 'unread' ? 'All caught up!' : 'No notifications'}
              </Text>
              <Text style={s.emptySub}>
                {filter === 'unread' ? 'No unread notifications.' : 'Your inbox is clear.'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <NotifRow item={item} onRead={markRead} onDelete={deleteSingle} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },

  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#101828', letterSpacing: -0.5 },
  sub:   { fontSize: 12, color: T.primary, fontWeight: '600', marginTop: 2 },

  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  markAllBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10,
    backgroundColor: T.primaryLight,
  },
  markAllTxt:    { fontSize: 11, fontWeight: '700', color: T.primary },
  deleteAllBtn:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#FFF5F5' },
  deleteAllTxt:  { fontSize: 11, fontWeight: '700', color: '#DC2626' },

  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    backgroundColor: '#FAFAFA', borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
  },
  filterTab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: 'transparent',
  },
  filterTabActive: { backgroundColor: T.primaryLight, borderColor: '#C7D7FD' },
  filterTxt:       { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  filterTxtActive: { color: T.primary, fontWeight: '700' },

  list:    { paddingBottom: 110 },
  divider: { height: 1, backgroundColor: '#F8FAFC', marginLeft: 70 },

  emptyWrap:  { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyEmoji: { fontSize: 52 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: '#374151' },
  emptySub:   { fontSize: 13, color: '#9CA3AF' },
});

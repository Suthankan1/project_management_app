import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  StyleSheet, Platform, Alert, Pressable,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { DrawerContentScrollView, DrawerContentComponentProps } from '@react-navigation/drawer';
import Svg, { Path, Circle, Line, Polygon, Rect, Polyline } from 'react-native-svg';
import { getValidToken, clearTokens } from '../../auth/storage';
import { T } from '../../constants/tokens';
import api from '../../api/axios';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Project { id: number; name: string; projectKey?: string; isFavorite?: boolean; }

// ─── Icons (mirrors web SidebarIcons.tsx) ─────────────────────────────────────

function HomeIcon({ color = '#6B6F7B' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <Polyline points="9 22 9 12 15 12 15 22" />
    </Svg>
  );
}

function StarIcon({ color = '#FBBF24' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={color} stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </Svg>
  );
}

function ClockIcon({ color = '#6B6F7B' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={10} />
      <Path d="M12 6v6l4 2" />
    </Svg>
  );
}

function InboxIcon({ color = '#6B6F7B' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M22 12h-6l-2 3h-4l-2-3H2" />
      <Path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </Svg>
  );
}

function BellIcon({ color = '#6B6F7B' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

function ProfileIcon({ color = '#6B6F7B' }: { color?: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <Circle cx={12} cy={7} r={4} />
    </Svg>
  );
}

function LogoutIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#FF5C5C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <Polyline points="16 17 21 12 16 7" />
      <Line x1={21} y1={12} x2={9} y2={12} />
    </Svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <Svg width={13} height={13} viewBox="0 0 13 13" fill="none" stroke="#9CA3AF" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}
    >
      <Path d="M4.5 3L8 6.5L4.5 10" />
    </Svg>
  );
}

// ─── NavRow (mirrors web NavRow: active indicator + icon + label + badge) ──────

interface NavRowProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  badge?: number;
  onPress: () => void;
}

function NavRow({ icon, label, active, badge, onPress }: NavRowProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        navStyles.row,
        active && navStyles.rowActive,
        pressed && navStyles.rowPressed,
      ]}
    >
      {/* Active left indicator — matches web: absolute left-0 top-1.5 bottom-1.5 w-1 bg-cu-primary rounded-r-full */}
      {active && <View style={navStyles.activeBar} />}

      {/* Icon — flex-shrink-0 w-[18px] */}
      <View style={navStyles.iconWrap}>{icon}</View>

      {/* Label — text-[13.5px] font-medium */}
      <Text style={[navStyles.label, active && navStyles.labelActive]}>{label}</Text>

      {/* Badge — bg-cu-primary/10 text-cu-primary text-[10px] */}
      {badge !== undefined && badge > 0 && (
        <View style={navStyles.badge}>
          <Text style={navStyles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const navStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 8,
    position: 'relative',
    minHeight: 38,
  },
  rowActive: {
    // bg-cu-primary/8 = ~5% opacity blue
    backgroundColor: 'rgba(21,93,252,0.08)',
  },
  rowPressed: {
    backgroundColor: 'rgba(243,244,246,0.8)',
  },
  activeBar: {
    position: 'absolute',
    left: 0,
    top: 6,
    bottom: 6,
    width: 4,
    borderRadius: 2,
    backgroundColor: T.primary,
  },
  iconWrap: {
    width: 18,
    alignItems: 'center',
  },
  label: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '500',
    color: '#6B6F7B',  // cu-text-secondary
  },
  labelActive: {
    color: T.primary,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: 'rgba(21,93,252,0.1)',
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: T.primary,
  },
});

// ─── Section header (mirrors web SectionHeader component) ─────────────────────

function SectionHeader({ label, expanded, onToggle }: { label: string; expanded: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity style={shStyles.row} onPress={onToggle}>
      <ChevronIcon open={expanded} />
      {/* text-[10.5px] font-bold text-cu-text-muted uppercase tracking-widest */}
      <Text style={shStyles.label}>{label}</Text>
    </TouchableOpacity>
  );
}

const shStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 10, paddingVertical: 6, marginHorizontal: 8,
  },
  label: {
    fontSize: 10.5, fontWeight: '700', color: '#9CA3AF',
    textTransform: 'uppercase', letterSpacing: 1.2,
  },
});

// ─── Sidebar Logo Header (mirrors web SidebarHeader) ─────────────────────────
// h-[60px] flex items-center border-b border-cu-border/50

function SidebarLogo() {
  return (
    <View style={logoStyles.container}>
      {/* w-8 h-8 rounded-[10px] bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 */}
      <View style={logoStyles.iconBox}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
          <Path d="M12 2L20 7V17L12 22L4 17V7L12 2Z" fill="white" fillOpacity={0.95} />
          <Path d="M12 6L16 8.5V13.5L12 16L8 13.5V8.5L12 6Z" fill="white" fillOpacity={0.4} />
        </Svg>
      </View>
      {/* font-bold text-[18px] tracking-tight text-slate-800 */}
      <Text style={logoStyles.wordmark}>Planora</Text>
    </View>
  );
}

const logoStyles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232,232,237,0.5)',
  },
  iconBox: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: '#2563EB',  // from-blue-600
    alignItems: 'center', justifyContent: 'center',
  },
  wordmark: {
    fontSize: 18, fontWeight: '700', color: '#1E293B', letterSpacing: -0.3,
  },
});

// ─── Sidebar Footer (mirrors web SidebarFooter) ───────────────────────────────

function SidebarFooter({ username, initials, onLogout }: {
  username: string; initials: string; onLogout: () => void;
}) {
  const router = useRouter();
  return (
    <View style={footerStyles.container}>
      <View style={footerStyles.divider} />
      <View style={footerStyles.row}>
        {/* Link to profile — flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-cu-hover */}
        <TouchableOpacity
          style={footerStyles.profileBtn}
          onPress={() => router.push('/profile' as never)}
        >
          {/* w-8 h-8 rounded-full bg-cu-bg-tertiary border overflow-hidden */}
          <View style={footerStyles.avatar}>
            <Text style={footerStyles.avatarText}>{initials}</Text>
          </View>
          <View style={footerStyles.userInfo}>
            <Text style={footerStyles.userName} numberOfLines={1}>{username}</Text>
          </View>
        </TouchableOpacity>

        {/* Logout button */}
        <TouchableOpacity style={footerStyles.logoutBtn} onPress={onLogout}>
          <LogoutIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const footerStyles = StyleSheet.create({
  container: {
    backgroundColor: '#F9FAFB',
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
  },
  divider: { height: 1, backgroundColor: '#F0F0F5' },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6,
  },
  profileBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 8, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8,
  },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F0F1F3',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: '#E8E8ED',
  },
  avatarText: { fontSize: 13, fontWeight: '600', color: '#6B6F7B' },
  userInfo: { flex: 1 },
  userName: { fontSize: 13, fontWeight: '500', color: '#1A1A2E' },
  logoutBtn: {
    padding: 8, borderRadius: 6,
  },
});

// ─── Main DrawerContent ───────────────────────────────────────────────────────

export default function DrawerContent(props: DrawerContentComponentProps) {
  const router   = useRouter();
  const pathname = usePathname();

  const [username, setUsername] = useState('');
  const [initials, setInitials] = useState('U');
  const [favProjects,    setFavProjects]    = useState<Project[]>([]);
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [favOpen,    setFavOpen]    = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [loading, setLoading]       = useState(false);

  // ── Load user info ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      const token = await getValidToken();
      if (!token) return;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const name = payload.sub || payload.username || 'User';
        setUsername(name);
        setInitials(name.charAt(0).toUpperCase());
      } catch { /* silent */ }
    })();
  }, []);

  // ── Load projects ────────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const [favRes, recentRes] = await Promise.all([
        api.get('/api/projects/favorites'),
        api.get('/api/projects/recent'),
      ]);
      setFavProjects((favRes.data   as Project[]).slice(0, 8));
      setRecentProjects((recentRes.data as Project[]).slice(0, 8));
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => { void loadProjects(); }, []);

  // ── Logout ───────────────────────────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: async () => {
        await clearTokens();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const navigate = (href: string) => {
    props.navigation.closeDrawer();
    setTimeout(() => router.push(href as never), 60);
  };

  // Active detection
  const isActive = (segment: string) => {
    if (segment === '/dashboard') return pathname === '/' || pathname === '/(tabs)' || pathname.startsWith('/(tabs)/index');
    return pathname.startsWith(segment);
  };

  return (
    <View style={styles.wrapper}>

      {/* ── Logo Header ─────────────────────────────────────────────────────── */}
      <SidebarLogo />

      {/* ── Scrollable nav ──────────────────────────────────────────────────── */}
      <DrawerContentScrollView
        {...props}
        scrollEnabled
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          {/* For You → /dashboard */}
          <NavRow
            icon={<HomeIcon color={isActive('/dashboard') ? T.primary : '#6B6F7B'} />}
            label="For You"
            active={isActive('/dashboard')}
            onPress={() => navigate('/(tabs)')}
          />

          {/* Favourites (with chevron + expandable list) */}
          <View>
            <Pressable
              style={({ pressed }) => [navStyles.row, favOpen && navStyles.rowActive, pressed && navStyles.rowPressed]}
              onPress={() => setFavOpen(v => !v)}
            >
              {favOpen && <View style={navStyles.activeBar} />}
              <View style={navStyles.iconWrap}><StarIcon color="#FBBF24" /></View>
              <Text style={[navStyles.label, favOpen && navStyles.labelActive]}>Favourites</Text>
              <ChevronIcon open={favOpen} />
            </Pressable>

            {favOpen && (
              <View style={styles.subList}>
                {loading
                  ? <Text style={styles.subListLoading}>Loading projects...</Text>
                  : favProjects.length === 0
                    ? <Text style={styles.subListLoading}>No favourites yet</Text>
                    : favProjects.map(p => (
                        <TouchableOpacity key={p.id} style={styles.subListRow} onPress={() => navigate(`/summary/${p.id}`)}>
                          <View style={styles.subListDot} />
                          <Text style={styles.subListName} numberOfLines={1}>{p.name}</Text>
                          {p.projectKey && <Text style={styles.subListKey}>{p.projectKey}</Text>}
                        </TouchableOpacity>
                      ))
                }
                <TouchableOpacity onPress={() => navigate('/spaces?filter=favorites')}>
                  <Text style={styles.subListViewAll}>View all favourites →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Recent Spaces (with chevron + expandable list) */}
          <View>
            <Pressable
              style={({ pressed }) => [navStyles.row, recentOpen && navStyles.rowActive, pressed && navStyles.rowPressed]}
              onPress={() => setRecentOpen(v => !v)}
            >
              {recentOpen && <View style={navStyles.activeBar} />}
              <View style={navStyles.iconWrap}><ClockIcon color={recentOpen ? T.primary : '#6B6F7B'} /></View>
              <Text style={[navStyles.label, recentOpen && navStyles.labelActive]}>Recent Spaces</Text>
              <ChevronIcon open={recentOpen} />
            </Pressable>

            {recentOpen && (
              <View style={styles.subList}>
                {loading
                  ? <Text style={styles.subListLoading}>Loading projects...</Text>
                  : recentProjects.length === 0
                    ? <Text style={styles.subListLoading}>No recent spaces</Text>
                    : recentProjects.map(p => (
                        <TouchableOpacity key={p.id} style={styles.subListRow} onPress={() => navigate(`/summary/${p.id}`)}>
                          <View style={styles.subListDot} />
                          <Text style={styles.subListName} numberOfLines={1}>{p.name}</Text>
                          {p.projectKey && <Text style={styles.subListKey}>{p.projectKey}</Text>}
                        </TouchableOpacity>
                      ))
                }
                <TouchableOpacity onPress={() => navigate('/spaces?filter=recent')}>
                  <Text style={styles.subListViewAll}>View all recent spaces →</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Inbox — on mobile taps navigate to /inbox page */}
          <NavRow
            icon={<InboxIcon color={isActive('/inbox') ? T.primary : '#6B6F7B'} />}
            label="Inbox"
            active={isActive('/inbox')}
            onPress={() => navigate('/inbox')}
          />

          {/* Notifications */}
          <NavRow
            icon={<BellIcon color={isActive('/dashboard/notifications') ? T.primary : '#6B6F7B'} />}
            label="Notifications"
            active={isActive('/dashboard/notifications')}
            onPress={() => navigate('/dashboard/notifications')}
          />

          {/* Profile */}
          <NavRow
            icon={<ProfileIcon color={isActive('/profile') ? T.primary : '#6B6F7B'} />}
            label="Profile"
            active={isActive('/profile')}
            onPress={() => navigate('/profile')}
          />
        </View>
      </DrawerContentScrollView>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <SidebarFooter
        username={username || 'User'}
        initials={initials}
        onLogout={handleLogout}
      />
    </View>
  );
}

// ─── Outer styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#F9FAFB',  // same as web --cu-bg-secondary
  },
  scrollContent: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  section: {
    gap: 2,
  },
  subList: {
    marginLeft: 38,
    marginRight: 8,
    paddingVertical: 4,
    gap: 2,
  },
  subListRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 7, paddingHorizontal: 8, gap: 8,
  },
  subListDot: {
    width: 5, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1',
  },
  subListName: {
    flex: 1, fontSize: 13, fontWeight: '500', color: '#374151',
  },
  subListKey: {
    fontSize: 10, fontWeight: '700', color: '#9CA3AF', letterSpacing: 0.5,
  },
  subListLoading: {
    fontSize: 11, color: '#9CA3AF', paddingVertical: 8, paddingHorizontal: 8,
  },
  subListViewAll: {
    fontSize: 12, fontWeight: '700', color: T.primary,
    paddingVertical: 8, paddingHorizontal: 8,
  },
});

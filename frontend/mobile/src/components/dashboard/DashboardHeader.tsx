import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { T } from '../../constants/tokens';
import api from '../../api/axios';

// ─── Bell icon ────────────────────────────────────────────────────────────────

function BellIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <Path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </Svg>
  );
}

// ─── DashboardHeader ──────────────────────────────────────────────────────────

interface DashboardHeaderProps {
  username?: string;
  profileInitial?: string;
}

export default function DashboardHeader({ username = 'User', profileInitial }: DashboardHeaderProps) {
  const router = useRouter();
  const initial = profileInitial ?? username.charAt(0).toUpperCase();
  const [unreadCount, setUnreadCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      api.get<{ count: number }>('/api/notifications/unread-count')
        .then(({ data }) => {
          if (active) {
            setUnreadCount(Number(data.count) || 0);
          }
        })
        .catch(() => {
          if (active) {
            setUnreadCount(0);
          }
        });

      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Left: PLANORA logo */}
      <View style={styles.logoRow}>
        <View style={styles.logoPill} />
        <Text style={styles.logoText}>PLANORA</Text>
      </View>

      {/* Right: notification bell + avatar */}
      <View style={styles.rightRow}>
        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => router.push('/dashboard/notifications' as never)}
          activeOpacity={0.7}
          accessibilityLabel="Notifications"
        >
          <BellIcon />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push('/(tabs)/profile' as never)}
          activeOpacity={0.8}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    zIndex: 30,
    ...Platform.select({
      ios:     { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 6 },
      android: { elevation: 2 },
    }),
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoPill: {
    width: 5,
    height: 22,
    borderRadius: 3,
    backgroundColor: T.primary,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#101828',
    letterSpacing: 2,
  },

  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    lineHeight: 11,
    fontWeight: '900',
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: T.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#EBF2FF',
    ...Platform.select({
      ios:     { shadowColor: T.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4 },
      android: { elevation: 3 },
    }),
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});

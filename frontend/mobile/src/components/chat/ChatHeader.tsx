import React, { useEffect, useMemo } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Colors } from '@/src/constants/colors';
import { avatarColor } from '@/src/hooks/chat/chatUtils';

interface ChatHeaderProps {
  selectedRoom: { name?: string|null; topic?: string|null } | null;
  selectedUser: string | null;
  userProfilePics: Record<string, string>;
  onlineUsers: string[];
  isConnected: boolean;
  phaseDEnabled: boolean;
  showSearch: boolean;
  onToggleSearch: () => void;
  onShowSidebar: () => void;
}

const HEADER_HEIGHT = Platform.select({ ios: 60, android: 58 });
const HIT_SLOP = { top: 10, bottom: 10, left: 10, right: 10 };

export function ChatHeader({
  selectedRoom,
  selectedUser,
  userProfilePics,
  onlineUsers,
  isConnected,
  phaseDEnabled,
  onToggleSearch,
  onShowSidebar,
}: ChatHeaderProps) {
  const avatarScale = useSharedValue(1);
  const dotScale = useSharedValue(1);

  const selectionKey = selectedRoom?.name ?? selectedUser ?? 'team';
  const isRoom = !!selectedRoom;
  const isDm = !!selectedUser && !selectedRoom;
  const normalizedOnlineUsers = useMemo(
    () => new Set(onlineUsers.map(user => user.trim().toLowerCase())),
    [onlineUsers],
  );
  const isUserOnline = !!selectedUser && normalizedOnlineUsers.has(selectedUser.trim().toLowerCase());
  const isOnline = isDm ? isUserOnline : isConnected && onlineUsers.length > 0;

  // Avatar pop animation on room/user switch
  useEffect(() => {
    avatarScale.value = 0.88;
    avatarScale.value = withSpring(1, { damping: 12, stiffness: 200 });
  }, [avatarScale, selectionKey]);

  // Pulse animation on the status dot when online
  useEffect(() => {
    if (isOnline) {
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1.55, { duration: 700 }),
          withTiming(1, { duration: 700 }),
        ),
        -1,
        true,
      );
    } else {
      dotScale.value = withTiming(1, { duration: 200 });
    }
  }, [dotScale, isOnline]);

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
    opacity: isOnline ? 1 : 0.55,
  }));

  const title = isRoom ? `# ${selectedRoom?.name ?? 'Room'}` : selectedUser || 'Team Chat';
  const subtitle = isRoom
    ? selectedRoom?.topic || 'No topic set'
    : selectedUser
      ? isUserOnline ? 'Online' : 'Offline'
      : isConnected && onlineUsers.length > 0
        ? `${onlineUsers.length} ${onlineUsers.length === 1 ? 'member' : 'members'} online`
        : 'Team workspace';
  const subtitleStyle = selectedUser && isUserOnline
    ? styles.subtitleOnline
    : selectedUser
      ? styles.subtitleMuted
      : styles.subtitle;

  const avatarName = selectedRoom?.name ?? selectedUser ?? 'Team';
  const profilePic = selectedUser ? userProfilePics[selectedUser] : null;
  const dotColor = isDm
    ? isUserOnline ? Colors.onlineGreen : Colors.borderDefault
    : isConnected ? Colors.onlineGreen : Colors.borderDefault;

  return (
    <View style={styles.header}>
      {/* Back / sidebar button */}
      <TouchableOpacity
        onPress={onShowSidebar}
        style={styles.backButton}
        hitSlop={HIT_SLOP}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
      </TouchableOpacity>

      {/* Center: avatar + title */}
      <View style={styles.center}>
        <Animated.View style={[styles.avatarWrap, avatarAnimatedStyle]}>
          {isDm && profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.avatar} />
          ) : (
            <LinearGradient
              colors={[avatarColor(avatarName), avatarColor(`${avatarName}2`)]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>{isRoom ? '#' : avatarName.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          )}
          {/* Pulsing status dot */}
          <Animated.View style={[styles.statusDotOuter, { backgroundColor: dotColor + '40' }, dotAnimatedStyle]} />
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        </Animated.View>

        <View style={styles.textColumn}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={subtitleStyle} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>

      {/* Right actions */}
      <View style={styles.actions}>
        {phaseDEnabled && (
          <TouchableOpacity
            onPress={onToggleSearch}
            style={styles.iconButton}
            activeOpacity={0.72}
            hitSlop={HIT_SLOP}
          >
            <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.72} hitSlop={HIT_SLOP}>
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: Colors.chatHeaderBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#D1D5DB',
    // Subtle shadow under header
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.07,
        shadowRadius: 3,
      },
      android: { elevation: 2 },
    }),
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    minWidth: 0,
  },
  avatarWrap: {
    width: 40,
    height: 40,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  // Pulsing outer ring behind the dot
  statusDotOuter: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    bottom: -1,
    right: -1,
  },
  statusDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.chatHeaderBg,
    bottom: 0,
    right: 0,
  },
  textColumn: {
    flex: 1,
    marginLeft: 10,
    minWidth: 0,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  subtitleOnline: {
    fontSize: 12,
    color: Colors.onlineGreen,
    fontWeight: '600',
    marginTop: 1,
  },
  subtitleMuted: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

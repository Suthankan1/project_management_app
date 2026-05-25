import React, { useEffect, useMemo } from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
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

const HEADER_HEIGHT = Platform.select({ ios: 56, android: 52 });
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
  const selectionKey = selectedRoom?.name ?? selectedUser ?? 'team';
  const isRoom = !!selectedRoom;
  const isDm = !!selectedUser && !selectedRoom;
  const normalizedOnlineUsers = useMemo(
    () => new Set(onlineUsers.map(user => user.trim().toLowerCase())),
    [onlineUsers],
  );
  const isUserOnline = !!selectedUser && normalizedOnlineUsers.has(selectedUser.trim().toLowerCase());

  useEffect(() => {
    avatarScale.value = 0.9;
    avatarScale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, [avatarScale, selectionKey]);

  const avatarAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: avatarScale.value }],
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
      <TouchableOpacity onPress={onShowSidebar} style={styles.backButton} hitSlop={HIT_SLOP}>
        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
      </TouchableOpacity>

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
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
        </Animated.View>

        <View style={styles.textColumn}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={subtitleStyle} numberOfLines={1}>{subtitle}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        {phaseDEnabled && (
          <TouchableOpacity onPress={onToggleSearch} style={styles.iconButton} activeOpacity={0.75}>
            <Ionicons name="search-outline" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.iconButton} activeOpacity={0.75}>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.chatDivider,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
    minWidth: 0,
  },
  avatarWrap: {
    width: 38,
    height: 38,
    position: 'relative',
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
  statusDot: {
    position: 'absolute',
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.chatHeaderBg,
    bottom: -1,
    right: -1,
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
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  subtitleOnline: {
    fontSize: 12,
    color: Colors.onlineGreen,
  },
  subtitleMuted: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

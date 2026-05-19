import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { avatarColor } from '@/src/hooks/chat/chatUtils';
import { LinearGradient } from 'expo-linear-gradient';

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

export function ChatHeader({
  selectedRoom,
  selectedUser,
  userProfilePics,
  onlineUsers,
  isConnected,
  phaseDEnabled,
  showSearch,
  onToggleSearch,
  onShowSidebar,
}: ChatHeaderProps) {
  const title = selectedRoom ? `# ${selectedRoom.name}` : selectedUser || 'Team Chat';
  const subtitle = selectedRoom
    ? (selectedRoom.topic || 'No topic set')
    : selectedUser
      ? (onlineUsers.includes(selectedUser.toLowerCase()) ? 'Online' : 'Offline')
      : 'All team members';

  const avatarName = selectedRoom ? selectedRoom.name : selectedUser || 'T';
  const profilePic = selectedUser ? userProfilePics[selectedUser] : null;

  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={onShowSidebar} style={styles.backButton} hitSlop={{top:10,bottom:10,left:10,right:10}}>
        <Ionicons name="chevron-back" size={24} color={Colors.primary} />
      </TouchableOpacity>

      <View style={styles.avatarContainer}>
        {profilePic ? (
          <Image source={{ uri: profilePic }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={[avatarColor(avatarName || ''), avatarColor((avatarName || '') + '2')]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{avatarName?.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        )}
        <View style={[styles.statusDot, { backgroundColor: isConnected ? Colors.onlineGreen : '#F59E0B' }]} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>

      {phaseDEnabled && (
        <TouchableOpacity onPress={onToggleSearch} style={styles.iconButton}>
          <Ionicons name={showSearch ? "close" : "search"} size={22} color={Colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: Platform.select({ ios: 56, android: 52 }),
    backgroundColor: Colors.chatHeaderBg,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.chatDivider,
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.chatHeaderBg,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SectionList, Image, SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/src/constants/colors';
import { ChatRoom, ChatMessage } from '../../types/chat';
import { formatTime, avatarColor, getMessagePreview } from '@/src/hooks/chat/chatUtils';

interface ChatSidebarProps {
  currentUser: string;
  currentUserAliases: string[];
  users: string[];
  userProfilePics?: Record<string, string>;
  rooms: ChatRoom[];
  selectedUser: string | null;
  selectedRoomId: number | null;
  onSelectUser: (user: string | null) => void;
  onSelectRoom: (roomId: number | null) => void;
  privateUnseenCounts: Record<string, number>;
  roomUnseenCounts: Record<number, number>;
  privateLastMessages: Record<string, ChatMessage | null>;
  roomLastMessages: Record<number, ChatMessage | null>;
  teamUnseenCount: number;
  teamLastMessage: ChatMessage | null;
  teamTypingUsers: string[];
  roomTypingUsers: Record<number, string[]>;
  privateTypingUsers: string[];
  onOpenCreate: () => void;
  onEditRoom?: (room: ChatRoom) => void;
  onDeleteRoom: (roomId: number) => void;
  onUpdateRoomMeta: (roomId: number, updates: { name?: string; topic?: string; description?: string }) => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  isLoading?: boolean;
  roomMentionCounts?: Record<number, number>;
  teamMentionCount?: number;
  onlineUsers?: string[];
}

function UnreadBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View style={styles.unreadBadge}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
}

function MentionBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <View style={styles.mentionBadge}>
      <Text style={styles.badgeText}>🔔{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

export function ChatSidebar({
  currentUser, currentUserAliases = [], users, userProfilePics = {}, rooms,
  selectedUser, selectedRoomId,
  onSelectUser, onSelectRoom,
  privateUnseenCounts, roomUnseenCounts,
  privateLastMessages, roomLastMessages,
  teamUnseenCount, teamLastMessage,
  teamTypingUsers, roomTypingUsers, privateTypingUsers,
  onOpenCreate, onEditRoom, onDeleteRoom,
  searchTerm, onSearchChange,
  roomMentionCounts = {}, teamMentionCount = 0,
  onlineUsers = [],
}: ChatSidebarProps) {
  const identitySet = new Set([
    currentUser.toLowerCase(),
    ...currentUserAliases.map(a => a.toLowerCase()),
  ]);
  const dmUsers = users.reduce<string[]>((acc, user) => {
    const key = user.toLowerCase();
    if (!identitySet.has(key) && !acc.some(existing => existing.toLowerCase() === key)) {
      acc.push(user);
    }
    return acc;
  }, []);
  const isTeamSelected = !selectedUser && selectedRoomId === null;

  const sections = [
    { key: 'team', title: '', data: [{ type: 'team' as const }] },
    { key: 'channels', title: 'CHANNELS', data: rooms.map(r => ({ ...r, type: 'room' as const })) },
    { key: 'dms', title: 'DIRECT MESSAGES', data: dmUsers.map(u => ({ username: u, type: 'direct' as const })) },
  ];

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'team') {
      const isTyping = teamTypingUsers.length > 0;
      return (
        <TouchableOpacity
          style={[styles.row, isTeamSelected && styles.selectedRow]}
          onPress={() => { onSelectUser(null); onSelectRoom(null); }}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, isTeamSelected ? styles.iconBoxActive : styles.iconBoxDefault]}>
            <Ionicons name="people" size={18} color={isTeamSelected ? '#fff' : Colors.textSecondary} />
          </View>
          <View style={styles.rowContent}>
            <View style={styles.rowTop}>
              <Text style={[styles.rowTitle, isTeamSelected && styles.rowTitleActive]} numberOfLines={1}>
                Team Chat
              </Text>
              {teamLastMessage?.timestamp && (
                <Text style={styles.rowTime}>{formatTime(teamLastMessage.timestamp)}</Text>
              )}
            </View>
            <Text style={[styles.rowPreview, isTyping && styles.typingText]} numberOfLines={1}>
              {isTyping
                ? `${teamTypingUsers[0]} is typing…`
                : getMessagePreview(teamLastMessage?.content) || 'No messages yet'}
            </Text>
          </View>
          <View style={styles.badges}>
            <MentionBadge count={teamMentionCount} />
            <UnreadBadge count={teamUnseenCount} />
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === 'room') {
      const isSelected = selectedRoomId === item.id;
      const typingUsers: string[] = roomTypingUsers[item.id] || [];
      const isTyping = typingUsers.length > 0 && !isSelected;
      const lastMsg = roomLastMessages[item.id];
      return (
        <TouchableOpacity
          style={[styles.row, isSelected && styles.selectedRow]}
          onPress={() => onSelectRoom(item.id)}
          onLongPress={() => {
            Alert.alert(item.name, undefined, [
              onEditRoom ? { text: '✏️ Edit Channel', onPress: () => onEditRoom(item) } : null,
              { text: '🗑️ Delete Channel', style: 'destructive', onPress: () => onDeleteRoom(item.id) },
              { text: 'Cancel', style: 'cancel' },
            ].filter(Boolean) as any);
          }}
          activeOpacity={0.7}
        >
          <View style={[styles.iconBox, isSelected ? styles.iconBoxActive : styles.iconBoxDefault]}>
            <Text style={[styles.hashIcon, isSelected && { color: '#fff' }]}>#</Text>
          </View>
          <View style={styles.rowContent}>
            <View style={styles.rowTop}>
              <Text style={[styles.rowTitle, isSelected && styles.rowTitleActive]} numberOfLines={1}>{item.name}</Text>
              {lastMsg?.timestamp && <Text style={styles.rowTime}>{formatTime(lastMsg.timestamp)}</Text>}
            </View>
            <Text style={[styles.rowPreview, isTyping && styles.typingText]} numberOfLines={1}>
              {isTyping
                ? `${typingUsers[0]} is typing…`
                : item.topic || getMessagePreview(lastMsg?.content) || `Created by ${item.createdBy}`}
            </Text>
          </View>
          <View style={styles.badges}>
            <MentionBadge count={roomMentionCounts[item.id] || 0} />
            <UnreadBadge count={roomUnseenCounts[item.id] || 0} />
          </View>
        </TouchableOpacity>
      );
    }

    if (item.type === 'direct') {
      const u = item.username;
      const key = u.toLowerCase();
      const isSelected = selectedUser?.toLowerCase() === key;
      const isTyping = privateTypingUsers.includes(key) && !isSelected;
      const isOnline = onlineUsers.includes(key);
      const lastMsg = privateLastMessages[key];
      const pic = userProfilePics[u];
      return (
        <TouchableOpacity
          style={[styles.row, isSelected && styles.selectedRow]}
          onPress={() => onSelectUser(u)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarWrap}>
            {pic ? (
              <Image source={{ uri: pic }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[avatarColor(u), avatarColor(u + '2')]}
                style={styles.avatar}
              >
                <Text style={styles.avatarInitial}>{u.charAt(0).toUpperCase()}</Text>
              </LinearGradient>
            )}
            {isOnline && <View style={styles.onlineDot} />}
          </View>
          <View style={styles.rowContent}>
            <View style={styles.rowTop}>
              <Text style={[styles.rowTitle, isSelected && styles.rowTitleActive]} numberOfLines={1}>{u}</Text>
              {lastMsg?.timestamp && <Text style={styles.rowTime}>{formatTime(lastMsg.timestamp)}</Text>}
            </View>
            <Text style={[styles.rowPreview, isTyping && styles.typingText]} numberOfLines={1}>
              {isTyping ? 'typing…'
                : getMessagePreview(lastMsg?.content) || 'Start a conversation'}
            </Text>
          </View>
          <UnreadBadge count={privateUnseenCounts[key] || 0} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIcon}>
            <Ionicons name="chatbubbles" size={16} color="#fff" />
          </View>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={onOpenCreate} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="add" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={14} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search…"
          placeholderTextColor={Colors.textMuted}
          value={searchTerm}
          onChangeText={onSearchChange}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <SectionList
        sections={sections}
        keyExtractor={(item, i) => item.type + (item.id || item.username || i)}
        renderItem={renderItem}
        renderSectionHeader={({ section }) =>
          section.title ? <Text style={styles.sectionHeader}>{section.title}</Text> : null
        }
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.chatDivider,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerIcon: {
    width: 32, height: 32, borderRadius: 10,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  addBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.pageBg, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.borderDefault,
    marginHorizontal: 12, marginVertical: 10,
    paddingHorizontal: 12, height: 38,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  sectionHeader: {
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 6,
    fontSize: 10.5, fontWeight: '700', color: Colors.textMuted,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  listContent: { paddingBottom: 32 },
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    marginHorizontal: 4, borderRadius: 12, gap: 10,
    borderWidth: 1, borderColor: 'transparent',
  },
  selectedRow: {
    backgroundColor: '#EFF6FF', borderColor: '#BFDBFE',
  },
  iconBox: {
    width: 38, height: 38, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  iconBoxDefault: { backgroundColor: Colors.pageBg },
  iconBoxActive: { backgroundColor: Colors.primary },
  hashIcon: { fontSize: 18, fontWeight: '700', color: Colors.textSecondary },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 15 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 11, height: 11, borderRadius: 6,
    backgroundColor: Colors.onlineGreen, borderWidth: 2, borderColor: '#fff',
  },
  rowContent: { flex: 1, minWidth: 0 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  rowTitle: { fontSize: 13.5, fontWeight: '600', color: Colors.textPrimary, flexShrink: 1 },
  rowTitleActive: { color: '#1D4ED8', fontWeight: '700' },
  rowTime: { fontSize: 10, color: Colors.textMuted, flexShrink: 0, marginLeft: 4 },
  rowPreview: { fontSize: 12, color: Colors.textSecondary },
  typingText: { color: Colors.primary, fontStyle: 'italic' },
  badges: { flexDirection: 'row', gap: 4, alignItems: 'center', flexShrink: 0 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6,
    backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  mentionBadge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 6,
    backgroundColor: Colors.mentionAmber, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

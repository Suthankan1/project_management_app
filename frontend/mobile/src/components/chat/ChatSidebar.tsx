import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SectionList, Image,
  Alert, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Swipeable } from 'react-native-gesture-handler';
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
      <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
    </View>
  );
}

function TypingIndicator() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return <Animated.Text style={[styles.typingText, { opacity }]}>typing…</Animated.Text>;
}

function isFileUrl(str: string | undefined): boolean {
  if (!str) return false;
  return /^https?:\/\//.test(str);
}

function previewText(content: string | undefined, fallback: string): string {
  const p = getMessagePreview(content);
  if (!p) return fallback;
  return isFileUrl(p) ? '📎 Attachment' : p;
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

  const renderDeleteActions = (roomId: number, roomName: string) => {
    function DeleteRoomAction() {
      return (
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={() => {
            Alert.alert(
              'Delete Channel',
              `Delete "${roomName}"? This action cannot be undone.`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => onDeleteRoom(roomId) },
              ]
            );
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
        </TouchableOpacity>
      );
    }

    return DeleteRoomAction;
  };

  const renderItem = ({ item }: { item: any }) => {
    if (item.type === 'team') {
      const isTyping = teamTypingUsers.length > 0;
      return (
        <TouchableOpacity
          style={[styles.row, isTeamSelected && styles.selectedRow]}
          onPress={() => { onSelectUser(null); onSelectRoom(null); }}
          activeOpacity={0.7}
        >
          {isTeamSelected && <View style={styles.selectedAccent} />}
          <View style={styles.teamAvatar}>
            <Ionicons name="people" size={22} color="#fff" />
          </View>
          <View style={styles.rowContent}>
            <View style={styles.rowTop}>
              <Text style={styles.rowTitle} numberOfLines={1}>Team Chat</Text>
              {teamLastMessage?.timestamp && (
                <Text style={styles.rowTime}>{formatTime(teamLastMessage.timestamp)}</Text>
              )}
            </View>
            {isTyping ? <TypingIndicator /> : (
              <Text style={styles.rowPreview} numberOfLines={1}>
                {previewText(teamLastMessage?.content, 'No messages yet')}
              </Text>
            )}
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
        <Swipeable renderRightActions={renderDeleteActions(item.id, item.name)}>
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
            {isSelected && <View style={styles.selectedAccent} />}
            <LinearGradient
              colors={[avatarColor(item.name), avatarColor(item.name + '1')]}
              style={styles.avatar}
            >
              <Text style={styles.avatarSymbol}>#</Text>
            </LinearGradient>
            <View style={styles.rowContent}>
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle} numberOfLines={1}>{item.name}</Text>
                {lastMsg?.timestamp && <Text style={styles.rowTime}>{formatTime(lastMsg.timestamp)}</Text>}
              </View>
              {isTyping ? <TypingIndicator /> : (
                <Text style={styles.rowPreview} numberOfLines={1}>
                  {previewText(lastMsg?.content, item.topic || `Created by ${item.createdBy}`)}
                </Text>
              )}
            </View>
            <View style={styles.badges}>
              <MentionBadge count={roomMentionCounts[item.id] || 0} />
              <UnreadBadge count={roomUnseenCounts[item.id] || 0} />
            </View>
          </TouchableOpacity>
        </Swipeable>
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
          {isSelected && <View style={styles.selectedAccent} />}
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
              <Text style={styles.rowTitle} numberOfLines={1}>{u}</Text>
              {lastMsg?.timestamp && <Text style={styles.rowTime}>{formatTime(lastMsg.timestamp)}</Text>}
            </View>
            {isTyping ? <TypingIndicator /> : (
              <Text style={styles.rowPreview} numberOfLines={1}>
                {previewText(lastMsg?.content, 'Start a conversation')}
              </Text>
            )}
          </View>
          <UnreadBadge count={privateUnseenCounts[key] || 0} />
        </TouchableOpacity>
      );
    }
    return null;
  };

  const showEmpty = rooms.length === 0 && dmUsers.length === 0;

  return (
    <SafeAreaView style={styles.container}>
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

      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search…"
          placeholderTextColor={Colors.textMuted}
          value={searchTerm}
          onChangeText={onSearchChange}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item: any, index: number) =>
          item?.id ? item.type + item.id : item?.username ? item.type + item.username : item.type + index
        }
        renderItem={renderItem}
        renderSectionHeader={({ section }: { section: any }) => {
          if (!section.title) return null;
          return (
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderText}>{section.title}</Text>
              {section.key === 'channels' && (
                <TouchableOpacity
                  onPress={onOpenCreate}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="add-circle-outline" size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListFooterComponent={showEmpty ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color={Colors.borderDefault} />
            <Text style={styles.emptyStateText}>No conversations found</Text>
          </View>
        ) : null}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.chatSidebarBg },

  // Header
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

  // Search bar
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.chatInputBg,
    borderRadius: 24, height: 40,
    marginHorizontal: 12, marginVertical: 8,
    paddingHorizontal: 14,
  },
  searchInput: { flex: 1, fontSize: 14, color: Colors.textPrimary, padding: 0 },

  // Section header
  sectionHeaderRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4,
  },
  sectionHeaderText: {
    fontSize: 11, fontWeight: '700', letterSpacing: 1.2,
    color: Colors.textMuted, textTransform: 'uppercase',
  },

  // Conversation row
  row: {
    flexDirection: 'row', alignItems: 'center',
    height: 68, paddingHorizontal: 16,
    backgroundColor: Colors.chatSidebarBg,
    overflow: 'hidden',
  },
  selectedRow: { backgroundColor: '#EFF6FF' },
  selectedAccent: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    width: 3, backgroundColor: Colors.primary,
  },

  // Avatars
  teamAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatarInitial: { color: '#fff', fontWeight: '700', fontSize: 17 },
  avatarSymbol: { color: '#fff', fontWeight: '700', fontSize: 18 },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Colors.onlineGreen, borderWidth: 2, borderColor: '#fff',
  },

  // Row content
  rowContent: { flex: 1, marginLeft: 12, minWidth: 0 },
  rowTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 3,
  },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, flexShrink: 1 },
  rowTime: { fontSize: 11, color: Colors.textMuted, flexShrink: 0, marginLeft: 4 },
  rowPreview: { fontSize: 13, color: Colors.textSecondary },
  typingText: { fontSize: 13, color: Colors.primary, fontStyle: 'italic' },

  // Badges
  badges: { flexDirection: 'row', gap: 4, alignItems: 'center', flexShrink: 0, marginLeft: 8 },
  unreadBadge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: Colors.unreadBlue, justifyContent: 'center', alignItems: 'center',
  },
  mentionBadge: {
    minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5,
    backgroundColor: Colors.mentionAmber, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  // Swipe delete
  deleteAction: {
    width: 72, backgroundColor: '#DC2626',
    justifyContent: 'center', alignItems: 'center',
  },

  // Separator
  separator: { height: 1, backgroundColor: Colors.chatDivider, marginLeft: 72 },

  // Empty state
  emptyState: { paddingVertical: 48, alignItems: 'center', gap: 12 },
  emptyStateText: { fontSize: 14, color: Colors.textMuted },

  // List
  listContent: { paddingBottom: 32 },
});

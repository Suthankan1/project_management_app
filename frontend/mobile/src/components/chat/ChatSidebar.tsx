import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  SectionList,
  SafeAreaView,
  Alert,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { ChatRoom, ChatMessage } from '../../types/chat';
import { formatTime, avatarColor, getMessagePreview } from '@/src/hooks/chat/chatUtils';
import { LinearGradient } from 'expo-linear-gradient';

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
  onDeleteRoom: (roomId: number) => void;
  onUpdateRoomMeta: (roomId: number, updates: {name?:string;topic?:string;description?:string}) => void;
  searchTerm: string;
  onSearchChange: (v: string) => void;
  isLoading?: boolean;
  roomMentionCounts?: Record<number, number>;
  teamMentionCount?: number;
}

export function ChatSidebar(props: ChatSidebarProps) {
  const {
    currentUser,
    users,
    userProfilePics = {},
    rooms,
    selectedUser,
    selectedRoomId,
    onSelectUser,
    onSelectRoom,
    privateUnseenCounts,
    roomUnseenCounts,
    privateLastMessages,
    roomLastMessages,
    teamUnseenCount,
    teamLastMessage,
    teamTypingUsers,
    roomTypingUsers,
    privateTypingUsers,
    onOpenCreate,
    onDeleteRoom,
    searchTerm,
    onSearchChange,
    roomMentionCounts = {},
    teamMentionCount = 0,
  } = props;

  const sections = [
    { title: '', data: [{ type: 'team' }] },
    { title: 'CHANNELS', data: rooms.map(r => ({ ...r, type: 'room' })) },
    { title: 'DIRECT MESSAGES', data: users.map(u => ({ username: u, type: 'direct' })) },
  ];

  const renderBadge = (count: number, isMention: boolean) => {
    if (count <= 0) return null;
    return (
      <View style={[styles.badge, isMention ? styles.mentionBadge : styles.unreadBadge]}>
        <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
      </View>
    );
  };

  const renderItem = ({ item }: { item: any }) => {
    let title = '';
    let preview = '';
    let time = '';
    let isSelected = false;
    let onPress = () => {};
    let onLongPress = () => {};
    let icon: React.ReactNode = null;
    let badge: React.ReactNode = null;
    let isTyping = false;

    if (item.type === 'team') {
      title = 'Team Chat';
      isSelected = selectedUser === null && selectedRoomId === null;
      onPress = () => { onSelectUser(null); onSelectRoom(null); };
      preview = getMessagePreview(teamLastMessage?.content);
      time = formatTime(teamLastMessage?.timestamp);
      isTyping = teamTypingUsers.length > 0;
      icon = (
        <View style={[styles.avatarBox, { backgroundColor: Colors.primary }]}>
          <Ionicons name="people" size={20} color={Colors.white} />
        </View>
      );
      badge = (
        <View style={styles.badgeRow}>
          {renderBadge(teamMentionCount, true)}
          {renderBadge(teamUnseenCount, false)}
        </View>
      );
    } else if (item.type === 'room') {
      title = item.name;
      isSelected = selectedRoomId === item.id;
      onPress = () => onSelectRoom(item.id);
      const lastMsg = roomLastMessages[item.id];
      preview = getMessagePreview(lastMsg?.content);
      time = formatTime(lastMsg?.timestamp);
      isTyping = (roomTypingUsers[item.id] || []).length > 0;
      icon = (
        <View style={[styles.avatarBox, { backgroundColor: Colors.borderDefault }]}>
          <Text style={styles.hashIcon}>#</Text>
        </View>
      );
      badge = (
        <View style={styles.badgeRow}>
          {renderBadge(roomMentionCounts[item.id] || 0, true)}
          {renderBadge(roomUnseenCounts[item.id] || 0, false)}
        </View>
      );
      onLongPress = () => {
        Alert.alert(item.name, undefined, [
          { text: 'Edit Channel', onPress: () => {} }, // Open EditModal
          { text: 'Delete Channel', style: 'destructive', onPress: () => onDeleteRoom(item.id) },
          { text: 'Cancel', style: 'cancel' },
        ]);
      };
    } else if (item.type === 'direct') {
      title = item.username;
      isSelected = selectedUser === item.username;
      onPress = () => onSelectUser(item.username);
      const lastMsg = privateLastMessages[item.username];
      preview = getMessagePreview(lastMsg?.content);
      time = formatTime(lastMsg?.timestamp);
      isTyping = privateTypingUsers.includes(item.username.toLowerCase());
      const pic = userProfilePics[item.username];
      icon = pic ? (
        <Image source={{ uri: pic }} style={styles.avatarCircle} />
      ) : (
        <LinearGradient
          colors={[avatarColor(item.username), avatarColor(item.username + '2')]}
          style={styles.avatarCircle}
        >
          <Text style={styles.avatarText}>{item.username.charAt(0).toUpperCase()}</Text>
        </LinearGradient>
      );
      badge = renderBadge(privateUnseenCounts[item.username] || 0, false);
    }

    return (
      <TouchableOpacity
        style={[styles.row, isSelected && styles.selectedRow]}
        onPress={onPress}
        onLongPress={onLongPress}
        activeOpacity={0.7}
      >
        {icon}
        <View style={styles.rowContent}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>{title}</Text>
            <Text style={styles.rowTime}>{time}</Text>
          </View>
          <Text style={[styles.rowPreview, isTyping && styles.typingText]} numberOfLines={1}>
            {isTyping ? 'typing...' : preview}
          </Text>
        </View>
        {badge}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.msgIconBox}>
            <Ionicons name="chatbubbles" size={18} color={Colors.white} />
          </View>
          <Text style={styles.headerTitle}>Messages</Text>
        </View>
        <TouchableOpacity style={styles.addButton} hitSlop={{top:10,bottom:10,left:10,right:10}} onPress={onOpenCreate}>
          <Ionicons name="add" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search people or channels"
          value={searchTerm}
          onChangeText={onSearchChange}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => onSearchChange('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item, index) => item.type + (item.id || item.username || index)}
        renderItem={renderItem}
        renderSectionHeader={({ section: { title } }) => (
          title ? <Text style={styles.sectionHeader}>{title}</Text> : null
        )}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.chatSidebarBg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  msgIconBox: {
    width: 32,
    height: 32,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: Colors.textPrimary },
  addButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pageBg,
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textMuted,
    letterSpacing: 1,
  },
  listContent: { paddingBottom: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 64,
    gap: 12,
  },
  selectedRow: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: Colors.white, fontWeight: 'bold', fontSize: 16 },
  hashIcon: { fontSize: 20, fontWeight: 'bold', color: Colors.textSecondary },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  rowTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowTime: { fontSize: 11, color: Colors.textMuted },
  rowPreview: { fontSize: 13, color: Colors.textSecondary },
  typingText: { color: Colors.primary, fontStyle: 'italic' },
  badgeRow: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadBadge: { backgroundColor: Colors.primary },
  mentionBadge: { backgroundColor: Colors.mentionAmber },
  badgeText: { color: Colors.white, fontSize: 10, fontWeight: 'bold' },
});

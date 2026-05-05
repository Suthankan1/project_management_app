import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { ChatMessage as ChatMessageType, ChatReactionSummary } from '../../types/chat';
import { avatarColor, formatTime, QUICK_REACTIONS } from '@/src/hooks/chat/chatUtils';
import { LinearGradient } from 'expo-linear-gradient';

interface ChatMessageProps {
  message: ChatMessageType;
  isMe: boolean;
  showAvatar: boolean;
  showDateSep?: string;
  userProfilePics: Record<string, string>;
  currentUser: string;
  currentUserAliases: string[];
  reactions: ChatReactionSummary[];
  onLongPress: (message: ChatMessageType) => void;
  onToggleReaction: (messageId: number, emoji: string) => void;
  onOpenThread: (message: ChatMessageType) => void;
  isPinned?: boolean;
}

export function ChatMessage(props: ChatMessageProps) {
  const {
    message,
    isMe,
    showAvatar,
    showDateSep,
    userProfilePics,
    reactions,
    onLongPress,
    onToggleReaction,
    onOpenThread,
    isPinned,
  } = props;

  const renderDateSeparator = () => {
    if (!showDateSep) return null;
    return (
      <View style={styles.dateSeparator}>
        <View style={styles.dateLine} />
        <Text style={styles.dateText}>{showDateSep}</Text>
        <View style={styles.dateLine} />
      </View>
    );
  };

  const renderAvatar = () => {
    if (isMe || !showAvatar) return <View style={styles.avatarSpacer} />;
    const pic = userProfilePics[message.sender];
    return (
      <View style={styles.avatarContainer}>
        {pic ? (
          <Image source={{ uri: pic }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={[avatarColor(message.sender), avatarColor(message.sender + '2')]}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{message.sender.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        )}
      </View>
    );
  };

  const renderReactions = () => {
    if (reactions.length === 0) return null;
    return (
      <View style={[styles.reactionsRow, isMe ? { justifyContent: 'flex-end' } : { justifyContent: 'flex-start' }]}>
        {reactions.map((r, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.reactionPill, r.reactedByCurrentUser && styles.activeReactionPill]}
            onPress={() => message.id && onToggleReaction(message.id, r.emoji)}
          >
            <Text style={styles.reactionEmoji}>{r.emoji}</Text>
            <Text style={[styles.reactionCount, r.reactedByCurrentUser && styles.activeReactionText]}>
              {r.count}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleLongPress = () => {
    onLongPress(message);
  };

  const isDeleted = message.deleted;
  const isEdited = !!message.editedAt;

  return (
    <View style={styles.wrapper}>
      {renderDateSeparator()}
      <View style={[styles.container, isMe ? styles.myMessage : styles.otherMessage]}>
        {renderAvatar()}
        <View style={[styles.bubbleContainer, isMe ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }]}>
          {!isMe && showAvatar && <Text style={styles.senderName}>{message.sender}</Text>}

          <TouchableOpacity
            onLongPress={handleLongPress}
            activeOpacity={0.8}
            style={[
              styles.bubble,
              isMe ? styles.myBubble : styles.otherBubble,
              isPinned && styles.pinnedBubble
            ]}
          >
            <Text style={[styles.content, isMe ? styles.myContent : styles.otherContent, isDeleted && styles.deletedText]}>
              {isDeleted ? 'This message was deleted' : message.content}
            </Text>
            <View style={styles.bubbleFooter}>
              {isEdited && <Text style={[styles.time, isMe ? styles.myTime : styles.otherTime, { fontStyle: 'italic' }]}>edited </Text>}
              <Text style={[styles.time, isMe ? styles.myTime : styles.otherTime]}>
                {formatTime(message.timestamp)}
              </Text>
            </View>
          </TouchableOpacity>
          {renderReactions()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginVertical: 2 },
  dateSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    paddingHorizontal: 20,
  },
  dateLine: { flex: 1, height: 1, backgroundColor: Colors.chatDivider },
  dateText: {
    paddingHorizontal: 12,
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 2,
    gap: 8,
  },
  myMessage: { flexDirection: 'row-reverse' },
  otherMessage: { flexDirection: 'row' },
  avatarContainer: { width: 28, height: 28 },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
  avatarSpacer: { width: 28 },
  bubbleContainer: { flex: 1, maxWidth: '80%' },
  senderName: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 2,
    marginLeft: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 60,
  },
  myBubble: {
    backgroundColor: Colors.chatBubbleMe,
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: Colors.chatBubbleOther,
    borderBottomLeftRadius: 4,
  },
  pinnedBubble: {
    borderWidth: 1,
    borderColor: Colors.mentionAmber,
  },
  content: { fontSize: 15, lineHeight: 20 },
  myContent: { color: Colors.chatBubbleMeText },
  otherContent: { color: Colors.chatBubbleOtherText },
  deletedText: { fontStyle: 'italic', opacity: 0.6 },
  bubbleFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
    alignItems: 'center',
  },
  time: { fontSize: 10, opacity: 0.7 },
  myTime: { color: Colors.chatBubbleMeText },
  otherTime: { color: Colors.chatBubbleOtherText },
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
    gap: 4,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.pageBg,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.chatDivider,
  },
  activeReactionPill: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  reactionEmoji: { fontSize: 12, marginRight: 4 },
  reactionCount: { fontSize: 10, fontWeight: 'bold', color: Colors.textSecondary },
  activeReactionText: { color: Colors.primary },
});

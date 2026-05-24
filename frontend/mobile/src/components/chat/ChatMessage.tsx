import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { ChatMessage as ChatMessageType, ChatReactionSummary } from '../../types/chat';
import { avatarColor, formatTime } from '@/src/hooks/chat/chatUtils';
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

function isFileUrl(content: string): boolean {
  return (
    (content.includes('s3') && content.includes('amazonaws.com')) ||
    (content.includes('X-Amz-Signature'))
  );
}

function getFileName(url: string): string {
  try {
    const p = new URL(url).pathname;
    const parts = p.split('/');
    return decodeURIComponent(parts[parts.length - 1]) || 'Attachment';
  } catch {
    return 'Attachment';
  }
}

function renderMentions(content: string, aliasSet: Set<string>): React.ReactNode {
  const parts = content.split(/(@[a-zA-Z0-9._-]+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const handle = part.slice(1).toLowerCase();
      const isMine = aliasSet.has(handle) || Array.from(aliasSet).some(a => a.split('@')[0] === handle);
      if (isMine) {
        return (
          <Text key={i} style={styles.mentionHighlight}>{part}</Text>
        );
      }
    }
    return <Text key={i}>{part}</Text>;
  });
}

export function ChatMessage({
  message, isMe, showAvatar, showDateSep,
  userProfilePics, currentUser, currentUserAliases,
  reactions, onLongPress, onToggleReaction, onOpenThread, isPinned,
}: ChatMessageProps) {
  // Hide system messages
  if (message.type === 'JOIN' || message.type === 'LEAVE') return null;

  const isDeleted = !!message.deleted;
  const isEdited = !!message.editedAt;
  const isFile = !isDeleted && isFileUrl(message.content || '');

  const aliasSet = new Set([
    currentUser.toLowerCase(),
    ...currentUserAliases.map(a => a.toLowerCase()),
  ]);

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
            <Text style={styles.avatarInitial}>{message.sender.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
        )}
      </View>
    );
  };

  const renderContent = () => {
    if (isDeleted) {
      return <Text style={[styles.contentText, styles.deletedText]}>This message was deleted</Text>;
    }
    if (isFile) {
      const name = getFileName(message.content);
      return (
        <TouchableOpacity style={styles.fileCard} onPress={() => Linking.openURL(message.content)}>
          <View style={styles.fileIcon}>
            <Ionicons name="document-attach-outline" size={22} color={Colors.primary} />
          </View>
          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>{name}</Text>
            <Text style={styles.fileTap}>Tap to open</Text>
          </View>
          <Ionicons name="open-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      );
    }
    return (
      <Text style={[styles.contentText, isMe ? styles.myText : styles.otherText]}>
        {renderMentions(message.content, aliasSet)}
      </Text>
    );
  };

  const renderReactions = () => {
    if (reactions.length === 0) return null;
    return (
      <View style={[styles.reactionsRow, isMe ? styles.reactionsRight : styles.reactionsLeft]}>
        {reactions.map((r, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.reactionPill, r.reactedByCurrentUser && styles.activePill]}
            onPress={() => message.id && onToggleReaction(message.id, r.emoji)}
          >
            <Text style={styles.reactionEmoji}>{r.emoji}</Text>
            <Text style={[styles.reactionCount, r.reactedByCurrentUser && styles.activeCount]}>{r.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const renderThreadBadge = () => {
    if (!message.replyCount || message.replyCount <= 0) return null;
    return (
      <TouchableOpacity style={styles.threadBadge} onPress={() => onOpenThread(message)}>
        <Ionicons name="chatbubble-outline" size={12} color={Colors.primary} />
        <Text style={styles.threadBadgeText}>{message.replyCount} {message.replyCount === 1 ? 'reply' : 'replies'}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.wrapper}>
      {/* Date separator */}
      {showDateSep && (
        <View style={styles.dateSep}>
          <View style={styles.dateLine} />
          <Text style={styles.dateText}>{showDateSep}</Text>
          <View style={styles.dateLine} />
        </View>
      )}

      {/* Pinned indicator */}
      {isPinned && (
        <View style={[styles.pinnedBar, isMe && styles.pinnedBarRight]}>
          <Ionicons name="pin" size={10} color={Colors.mentionAmber} />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      <View style={[styles.row, isMe && styles.rowReverse]}>
        {renderAvatar()}
        <View style={[styles.bubbleWrap, isMe ? styles.bubbleWrapRight : styles.bubbleWrapLeft]}>
          {!isMe && showAvatar && (
            <Text style={styles.senderName}>{message.sender}</Text>
          )}
          <TouchableOpacity
            onLongPress={() => onLongPress(message)}
            activeOpacity={0.85}
            style={[
              styles.bubble,
              isMe ? styles.myBubble : styles.otherBubble,
              isPinned && styles.pinnedBubble,
              isFile && styles.fileBubble,
            ]}
          >
            {renderContent()}
            <View style={styles.footer}>
              {isEdited && <Text style={[styles.meta, isMe ? styles.myMeta : styles.otherMeta]}>edited · </Text>}
              <Text style={[styles.meta, isMe ? styles.myMeta : styles.otherMeta]}>{formatTime(message.timestamp)}</Text>
            </View>
          </TouchableOpacity>
          {renderReactions()}
          {renderThreadBadge()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 2 },
  dateSep: {
    flexDirection: 'row', alignItems: 'center',
    marginVertical: 16, paddingHorizontal: 20,
  },
  dateLine: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: Colors.chatDivider },
  dateText: {
    paddingHorizontal: 12, fontSize: 11,
    fontWeight: '600', color: Colors.textMuted,
    backgroundColor: Colors.white,
  },
  pinnedBar: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 16, paddingBottom: 2,
  },
  pinnedBarRight: { justifyContent: 'flex-end' },
  pinnedText: { fontSize: 10, color: Colors.mentionAmber, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 12, paddingVertical: 1, gap: 8 },
  rowReverse: { flexDirection: 'row-reverse' },
  avatarContainer: { width: 28, flexShrink: 0 },
  avatar: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 12, fontWeight: '700' },
  avatarSpacer: { width: 28 },
  bubbleWrap: { flex: 1, maxWidth: '80%' },
  bubbleWrapLeft: { alignItems: 'flex-start' },
  bubbleWrapRight: { alignItems: 'flex-end' },
  senderName: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9, minWidth: 60 },
  myBubble: { backgroundColor: Colors.chatBubbleMe, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: Colors.chatBubbleOther, borderBottomLeftRadius: 4 },
  pinnedBubble: { borderWidth: 1.5, borderColor: Colors.mentionAmber },
  fileBubble: { paddingHorizontal: 10, paddingVertical: 8 },
  contentText: { fontSize: 15, lineHeight: 21 },
  myText: { color: Colors.chatBubbleMeText },
  otherText: { color: Colors.chatBubbleOtherText },
  deletedText: { fontStyle: 'italic', opacity: 0.55, color: Colors.textMuted },
  mentionHighlight: {
    backgroundColor: 'rgba(245,158,11,0.15)', color: '#92400E',
    fontWeight: '700', borderRadius: 3, overflow: 'hidden',
  },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 3, alignItems: 'center' },
  meta: { fontSize: 10, opacity: 0.7 },
  myMeta: { color: Colors.chatBubbleMeText },
  otherMeta: { color: Colors.textMuted },
  // File card
  fileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 10, padding: 6,
  },
  fileIcon: {
    width: 38, height: 38, borderRadius: 8,
    backgroundColor: '#EFF6FF', justifyContent: 'center', alignItems: 'center',
  },
  fileInfo: { flex: 1 },
  fileName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  fileTap: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  // Reactions
  reactionsRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4, gap: 4 },
  reactionsLeft: { justifyContent: 'flex-start', marginLeft: 4 },
  reactionsRight: { justifyContent: 'flex-end', marginRight: 4 },
  reactionPill: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.pageBg, borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.chatDivider,
  },
  activePill: { backgroundColor: '#EFF6FF', borderColor: Colors.primary },
  reactionEmoji: { fontSize: 13, marginRight: 4 },
  reactionCount: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary },
  activeCount: { color: Colors.primary },
  // Thread badge
  threadBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    marginTop: 5, paddingHorizontal: 4,
  },
  threadBadgeText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
});

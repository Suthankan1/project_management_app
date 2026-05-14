import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, Linking,
  FlatList, Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { ChatMessage as ChatMessageType, ChatReactionSummary } from '../../types/chat';
import { avatarColor, formatTime } from '@/src/hooks/chat/chatUtils';
import { LinearGradient } from 'expo-linear-gradient';

const MAX_BUBBLE_WIDTH = Dimensions.get('window').width * 0.72;

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
  if (message.type === 'JOIN' || message.type === 'LEAVE') return null;

  const isDeleted = !!message.deleted;
  const isEdited = !!message.editedAt;
  const isFile = !isDeleted && isFileUrl(message.content || '');
  const threadCount = (message as any).threadCount ?? message.replyCount ?? 0;
  const hasRead = !!(message as any).read;

  const aliasSet = new Set([
    currentUser.toLowerCase(),
    ...currentUserAliases.map(a => a.toLowerCase()),
  ]);

  const timeColor = isMe ? 'rgba(255,255,255,0.7)' : Colors.textMuted;

  const renderAvatar = () => {
    if (!showAvatar) return <View style={styles.avatarSpacer} />;
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
      return <Text style={styles.deletedText}>This message was deleted</Text>;
    }
    if (isFile) {
      const name = getFileName(message.content);
      return (
        <View style={styles.fileCard}>
          <Ionicons
            name="document-outline"
            size={28}
            color={isMe ? Colors.chatBubbleMeText : Colors.primary}
          />
          <Text
            style={[styles.fileName, isMe ? styles.fileNameMe : styles.fileNameOther]}
            numberOfLines={2}
          >
            {name}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL(message.content)}>
            <Ionicons
              name="open-outline"
              size={20}
              color={isMe ? Colors.chatBubbleMeText : Colors.primary}
            />
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <Text style={[styles.contentText, isMe ? styles.myText : styles.otherText]}>
        {renderMentions(message.content, aliasSet)}
      </Text>
    );
  };

  const renderTimestampRow = () => (
    <View style={styles.timestampRow}>
      {isEdited && (
        <Text style={[styles.editedLabel, { color: timeColor }]}>(edited) </Text>
      )}
      <Text style={[styles.timeText, { color: timeColor }]}>{formatTime(message.timestamp)}</Text>
      {isMe && (
        <Ionicons
          name={hasRead ? 'checkmark-done-outline' : 'checkmark-outline'}
          size={12}
          color="rgba(255,255,255,0.7)"
          style={styles.tickIcon}
        />
      )}
    </View>
  );

  return (
    <View style={styles.wrapper}>
      {showDateSep && (
        <View style={styles.dateSep}>
          <View style={styles.dateLine} />
          <Text style={styles.datePill}>{showDateSep}</Text>
          <View style={styles.dateLine} />
        </View>
      )}

      {isPinned && (
        <View style={[styles.pinnedRow, isMe ? styles.pinnedRowRight : styles.pinnedRowLeft]}>
          <Ionicons name="pin" size={10} color={Colors.mentionAmber} />
          <Text style={styles.pinnedText}>Pinned</Text>
        </View>
      )}

      <View style={[styles.row, isMe ? styles.rowMe : styles.rowOther]}>
        {!isMe && renderAvatar()}

        <View style={{ maxWidth: MAX_BUBBLE_WIDTH }}>
          {!isMe && showAvatar && (
            <Text style={styles.senderName}>{message.sender}</Text>
          )}

          <TouchableOpacity onLongPress={() => onLongPress(message)} activeOpacity={0.85}>
            <View style={[
              styles.bubble,
              isMe ? styles.myBubble : styles.otherBubble,
              isPinned && styles.pinnedBubble,
            ]}>
              {renderContent()}
              {renderTimestampRow()}
              <View style={isMe ? styles.tailMe : styles.tailOther} />
            </View>
          </TouchableOpacity>

          {reactions.length > 0 && (
            <FlatList
              data={reactions}
              horizontal
              keyExtractor={(_, i) => String(i)}
              showsHorizontalScrollIndicator={false}
              style={[styles.reactionsList, isMe ? styles.reactionsRight : styles.reactionsLeft]}
              renderItem={({ item: r }) => (
                <TouchableOpacity
                  style={styles.reactionChip}
                  onPress={() => message.id && onToggleReaction(message.id, r.emoji)}
                >
                  <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                  <Text style={styles.reactionCount}>{r.count}</Text>
                </TouchableOpacity>
              )}
            />
          )}

          {threadCount > 0 && (
            <TouchableOpacity
              style={[styles.threadLink, isMe ? styles.threadLinkRight : styles.threadLinkLeft]}
              onPress={() => onOpenThread(message)}
            >
              <Text style={styles.threadLinkText}>
                {'💬 '}{threadCount}{' '}{threadCount === 1 ? 'reply' : 'replies'}
              </Text>
            </TouchableOpacity>
          )}
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
  datePill: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3,
    backgroundColor: '#F3F4F6', fontSize: 11, color: Colors.textMuted,
  },

  pinnedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingBottom: 2 },
  pinnedRowLeft: { justifyContent: 'flex-start' },
  pinnedRowRight: { justifyContent: 'flex-end' },
  pinnedText: { fontSize: 10, color: Colors.mentionAmber, fontWeight: '600' },

  row: { flexDirection: 'row', paddingHorizontal: 12, paddingVertical: 2, alignItems: 'flex-end' },
  rowMe: { justifyContent: 'flex-end' },
  rowOther: { justifyContent: 'flex-start' },

  avatarContainer: { width: 36, height: 36, marginRight: 6, flexShrink: 0 },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 13, fontWeight: '700' },
  avatarSpacer: { width: 36, marginRight: 6 },

  senderName: { fontSize: 11, fontWeight: '600', color: Colors.textMuted, marginBottom: 3, marginLeft: 4 },

  bubble: {
    borderRadius: 18,
    paddingHorizontal: 10, paddingVertical: 8,
    minWidth: 60,
    position: 'relative',
  },
  myBubble: { backgroundColor: Colors.chatBubbleMe, borderBottomRightRadius: 4 },
  otherBubble: { backgroundColor: Colors.chatBubbleOther, borderBottomLeftRadius: 4 },
  pinnedBubble: { borderWidth: 1.5, borderColor: Colors.mentionAmber },

  tailMe: {
    position: 'absolute', right: -8, bottom: 0,
    width: 0, height: 0,
    borderTopWidth: 10, borderTopColor: Colors.chatBubbleMe,
    borderLeftWidth: 8, borderLeftColor: 'transparent',
  },
  tailOther: {
    position: 'absolute', left: -8, bottom: 0,
    width: 0, height: 0,
    borderTopWidth: 10, borderTopColor: Colors.chatBubbleOther,
    borderRightWidth: 8, borderRightColor: 'transparent',
  },

  contentText: { fontSize: 15, lineHeight: 21 },
  myText: { color: Colors.chatBubbleMeText },
  otherText: { color: Colors.chatBubbleOtherText },
  deletedText: { fontStyle: 'italic', fontSize: 14, color: Colors.textMuted },
  mentionHighlight: {
    backgroundColor: '#EFF6FF', color: Colors.primary,
    borderRadius: 3, overflow: 'hidden',
    paddingHorizontal: 2, fontWeight: '600',
  },

  timestampRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 3 },
  editedLabel: { fontSize: 9, fontStyle: 'italic' },
  timeText: { fontSize: 10 },
  tickIcon: { marginLeft: 2 },

  fileCard: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fileName: { flex: 1, fontSize: 13, fontWeight: '600' },
  fileNameMe: { color: Colors.chatBubbleMeText },
  fileNameOther: { color: Colors.chatBubbleOtherText },

  reactionsList: { marginTop: 4 },
  reactionsLeft: { alignSelf: 'flex-start' },
  reactionsRight: { alignSelf: 'flex-end' },
  reactionChip: {
    flexDirection: 'row', borderRadius: 12,
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: '#F0F4FF', marginRight: 4,
    alignItems: 'center',
  },
  reactionEmoji: { fontSize: 12, marginRight: 2 },
  reactionCount: { fontSize: 12 },

  threadLink: { marginTop: 4, paddingHorizontal: 4 },
  threadLinkLeft: { alignSelf: 'flex-start' },
  threadLinkRight: { alignSelf: 'flex-end' },
  threadLinkText: { fontSize: 12, color: Colors.primary, fontWeight: '600' },
});

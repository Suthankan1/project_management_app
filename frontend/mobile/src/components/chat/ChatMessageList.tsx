import React, { useEffect, useRef } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  GestureResponderEvent,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { ChatMessage } from './ChatMessage';
import { ChatMessage as ChatMessageType, ChatReactionSummary } from '../../types/chat';
import { shouldShowDateSeparator, formatDateSeparator, isGrouped } from '@/src/hooks/chat/chatUtils';
import { Colors } from '@/src/constants/colors';

interface ChatMessageListProps {
  projectId: string;
  messages: ChatMessageType[];
  currentUser: string;
  currentUserAliases: string[];
  userProfilePics: Record<string, string>;
  isPrivateChat: boolean;
  activeRoomId?: number | null;
  pinnedMessageId?: number | null;
  reactionsByMessageId: Record<number, ChatReactionSummary[]>;
  onOpenThread: (message: ChatMessageType) => void;
  onEditMessage: (messageId: number, content: string) => void;
  onDeleteMessage: (messageId: number) => void;
  onToggleReaction: (messageId: number, emoji: string) => void;
  onPinRoomMessage?: (messageId: number | null) => void;
  typingUser?: string;
  onLongPress: (message: ChatMessageType, event: GestureResponderEvent, isMe: boolean) => void;
  isLoadingMore?: boolean;
}

export function ChatMessageList(props: ChatMessageListProps) {
  const {
    messages,
    currentUser,
    currentUserAliases,
    userProfilePics,
    reactionsByMessageId,
    pinnedMessageId,
    typingUser,
    onOpenThread,
    onToggleReaction,
    onLongPress,
    isLoadingMore,
  } = props;

  const flatListRef = useRef<FlatList>(null);
  const identitySet = new Set([
    currentUser.trim().toLowerCase(),
    ...currentUserAliases.map(alias => alias.trim().toLowerCase()),
  ]);

  // Sentinel for typing indicator - remove any existing typing sentinel
  const cleanedMessages = messages.filter((m: any) => !m.__typing);
  const displayData = typingUser
    ? [{ __typing: true, sender: typingUser }, ...cleanedMessages]
    : cleanedMessages;

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    if (item.__typing) {
      return <TypingIndicator username={item.sender} />;
    }

    const message = item as ChatMessageType;
    const isMe = identitySet.has((message.sender || '').trim().toLowerCase());

    // Inverted list: index 0 is newest (bottom)
    // prev message is index + 1
    const prevMessage = displayData[index + 1] as ChatMessageType | undefined;

    const showDateSep = shouldShowDateSeparator(message, prevMessage)
      ? formatDateSeparator(message.timestamp)
      : undefined;

    const showAvatar = !isGrouped(message, prevMessage);

    return (
      <ChatMessage
        message={message}
        isMe={isMe}
        showAvatar={showAvatar}
        showDateSep={showDateSep}
        userProfilePics={userProfilePics}
        currentUser={currentUser}
        currentUserAliases={currentUserAliases}
        reactions={message.id ? (reactionsByMessageId[message.id] || []) : []}
        onLongPress={onLongPress}
        onToggleReaction={onToggleReaction}
        onOpenThread={onOpenThread}
        isPinned={message.id === pinnedMessageId}
      />
    );
  };

  return (
    <FlatList
      ref={flatListRef}
      data={displayData}
      inverted
      keyExtractor={(item, index) => {
        if (item.__typing) return 'typing-indicator';
        if (item.localId) return item.localId;
        if (item.id) return `msg-${item.id}`;
        return `idx-${index}`;
      }}
      renderItem={renderItem}
      extraData={reactionsByMessageId}
      contentContainerStyle={styles.listContent}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} /> : null}
      initialNumToRender={20}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
}

function TypingIndicator({ username }: { username: string }) {
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const animateDot = (dot: typeof dot1, delay: number) => {
      dot.value = withDelay(
        delay,
        withRepeat(
          withSequence(
            withTiming(-6, { duration: 200 }),
            withTiming(0, { duration: 200 }),
          ),
          -1,
          false,
        ),
      );
    };

    animateDot(dot1, 0);
    animateDot(dot2, 150);
    animateDot(dot3, 300);
  }, [dot1, dot2, dot3]);

  const dot1Style = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const dot2Style = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const dot3Style = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View style={styles.typingContainer}>
      <Text style={styles.typingSender} numberOfLines={1}>{username}</Text>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.dot, dot1Style]} />
        <Animated.View style={[styles.dot, dot2Style]} />
        <Animated.View style={[styles.dot, dot3Style]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingVertical: 10 },
  typingContainer: {
    alignItems: 'flex-start',
    paddingLeft: 54,
    paddingRight: 16,
    paddingVertical: 8,
  },
  typingSender: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
    marginLeft: 4,
  },
  typingBubble: {
    flexDirection: 'row',
    width: 64,
    height: 32,
    backgroundColor: Colors.chatBubbleOther,
    borderRadius: 16,
    padding: 8,
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomLeftRadius: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.textMuted,
  },
});

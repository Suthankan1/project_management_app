import React, { useRef, useEffect } from 'react';
import {
  FlatList,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
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
  onLongPress: (message: ChatMessageType) => void;
  onLoadMore?: () => void;
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
    onLoadMore,
    isLoadingMore,
  } = props;

  const flatListRef = useRef<FlatList>(null);

  // Sentinel for typing indicator
  const displayData = typingUser
    ? [{ __typing: true, sender: typingUser }, ...messages]
    : messages;

  const renderItem = ({ item, index }: { item: any, index: number }) => {
    if (item.__typing) {
      return <TypingIndicator username={item.sender} />;
    }

    const message = item as ChatMessageType;
    const isMe = message.sender === currentUser || currentUserAliases.includes(message.sender);

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
      keyExtractor={(item, index) => item.id?.toString() || item.__typing ? 'typing' : index.toString()}
      renderItem={renderItem}
      contentContainerStyle={styles.listContent}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.2}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} /> : null}
      initialNumToRender={20}
      maxToRenderPerBatch={10}
      windowSize={10}
    />
  );
}

function TypingIndicator({ username }: { username: string }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0, duration: 400, useNativeDriver: true }),
        ])
      );
    };

    Animated.parallel([
      animate(dot1, 0),
      animate(dot2, 200),
      animate(dot3, 400),
    ]).start();
  }, []);

  const dotStyle = (val: Animated.Value) => ({
    opacity: val.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    transform: [{ scale: val.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
  });

  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <Animated.View style={[styles.dot, dotStyle(dot1)]} />
        <Animated.View style={[styles.dot, dotStyle(dot2)]} />
        <Animated.View style={[styles.dot, dotStyle(dot3)]} />
      </View>
      <Text style={styles.typingText}>{username} is typing...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingVertical: 10 },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  typingBubble: {
    flexDirection: 'row',
    backgroundColor: Colors.chatBubbleOther,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textMuted,
  },
  typingText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
});

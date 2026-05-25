import React, { useEffect, useMemo, useState } from 'react';
import {
  Dimensions,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  PanGestureHandler,
  PanGestureHandlerGestureEvent,
  PanGestureHandlerStateChangeEvent,
  State,
} from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { ChatMessage as ChatMessageType, ChatReactionSummary } from '../../types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.8;
const SWIPE_DISMISS_THRESHOLD = 80;
const SPRING_CONFIG = { damping: 18, stiffness: 220 };

interface ThreadBottomSheetProps {
  visible: boolean;
  rootMessage: ChatMessageType | null;
  threadMessages: ChatMessageType[];
  userProfilePics: Record<string, string>;
  reactionsByMessageId: Record<number, ChatReactionSummary[]>;
  currentUser: string;
  currentUserAliases?: string[];
  onClose: () => void;
  onSendReply: (content: string) => void;
  onToggleReaction: (messageId: number, emoji: string) => void;
  projectId: string;
}

export function ThreadBottomSheet(props: ThreadBottomSheetProps) {
  const {
    visible,
    rootMessage,
    threadMessages,
    userProfilePics,
    reactionsByMessageId,
    currentUser,
    currentUserAliases = [],
    onClose,
    onSendReply,
    onToggleReaction,
    projectId,
  } = props;

  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const replies = useMemo(() => {
    if (!rootMessage?.id) return threadMessages;
    return threadMessages.filter(message => message.id !== rootMessage.id);
  }, [rootMessage?.id, threadMessages]);

  const identitySet = useMemo(
    () => new Set([
      currentUser.trim().toLowerCase(),
      ...currentUserAliases.map(alias => alias.trim().toLowerCase()),
    ]),
    [currentUser, currentUserAliases],
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      translateY.value = SCREEN_HEIGHT;
      translateY.value = withSpring(0, SPRING_CONFIG);
    } else if (mounted) {
      translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG, finished => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
  }, [mounted, translateY, visible]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const closeWithAnimation = () => {
    translateY.value = withSpring(SCREEN_HEIGHT, SPRING_CONFIG, finished => {
      if (finished) runOnJS(onClose)();
    });
  };

  const handleGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    translateY.value = Math.max(event.nativeEvent.translationY, 0);
  };

  const handleGestureStateChange = (event: PanGestureHandlerStateChangeEvent) => {
    const { state, translationY } = event.nativeEvent;
    if (state !== State.END && state !== State.CANCELLED && state !== State.FAILED) return;

    if (translationY > SWIPE_DISMISS_THRESHOLD) {
      closeWithAnimation();
      return;
    }

    translateY.value = withSpring(0, SPRING_CONFIG);
  };

  if (!mounted || !rootMessage) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={closeWithAnimation}>
      <Pressable style={styles.overlay} onPress={closeWithAnimation} />

      <PanGestureHandler
        activeOffsetY={10}
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleGestureStateChange}
      >
        <Animated.View style={[styles.sheet, sheetStyle]}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>Thread</Text>
            <TouchableOpacity onPress={closeWithAnimation} style={styles.closeBtn} activeOpacity={0.75}>
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <QuotedRootMessage message={rootMessage} />

          <Text style={styles.replyCount}>
            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
          </Text>

          <FlatList
            data={replies}
            inverted={false}
            keyExtractor={(item, index) => {
              if (item.localId) return `thread-reply-${item.localId}-${index}`;
              if (item.id) return `thread-reply-${item.id}-${index}`;
              return `thread-reply-${index}`;
            }}
            renderItem={({ item, index }) => (
              <ChatMessage
                message={item}
                isMe={identitySet.has((item.sender || '').trim().toLowerCase())}
                showAvatar={index === 0 || item.sender !== replies[index - 1]?.sender}
                userProfilePics={userProfilePics}
                currentUser={currentUser}
                currentUserAliases={currentUserAliases}
                reactions={item.id ? (reactionsByMessageId[item.id] || []) : []}
                onLongPress={() => {}}
                onToggleReaction={onToggleReaction}
                onOpenThread={() => {}}
              />
            )}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
          >
            <View style={[styles.inputWrap, { paddingBottom: Math.max(insets.bottom, 8) }]}>
              <ChatInput
                onSendMessage={onSendReply}
                onTypingChange={() => {}}
                placeholder="Reply in thread…"
                projectId={projectId}
                enableMentions={false}
                mentionCandidates={[]}
              />
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </PanGestureHandler>
    </Modal>
  );
}

function QuotedRootMessage({ message }: { message: ChatMessageType }) {
  const preview = message.deleted ? 'This message was deleted' : message.content;

  return (
    <View style={styles.rootCard}>
      <View style={styles.accentBar} />
      <View style={styles.rootContent}>
        <View style={styles.rootHeader}>
          <Text style={styles.rootSender} numberOfLines={1}>{message.sender}</Text>
          <Text style={styles.originalLabel}>Original</Text>
        </View>
        <Text style={styles.rootPreview} numberOfLines={2}>{preview}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#00000050',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderDefault,
    alignSelf: 'center',
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 10,
    paddingVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  closeBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  rootCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: Colors.chatInputBg,
    borderRadius: 12,
    padding: 12,
    margin: 12,
  },
  accentBar: {
    width: 3,
    height: '100%',
    minHeight: 42,
    borderRadius: 2,
    backgroundColor: Colors.primary,
  },
  rootContent: {
    flex: 1,
    minWidth: 0,
  },
  rootHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  rootSender: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  originalLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  rootPreview: {
    fontSize: 12,
    lineHeight: 17,
    color: Colors.textSecondary,
  },
  replyCount: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 16,
  },
  inputWrap: {
    borderTopWidth: 1,
    borderTopColor: Colors.chatDivider,
    backgroundColor: Colors.cardBg,
  },
});

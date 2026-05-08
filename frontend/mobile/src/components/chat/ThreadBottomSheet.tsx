import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import { ChatMessage as ChatMessageType, ChatReactionSummary } from '../../types/chat';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ThreadBottomSheetProps {
  visible: boolean;
  rootMessage: ChatMessageType | null;
  threadMessages: ChatMessageType[];
  userProfilePics: Record<string, string>;
  reactionsByMessageId: Record<number, ChatReactionSummary[]>;
  currentUser: string;
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
    onClose,
    onSendReply,
    onToggleReaction,
    projectId,
  } = props;

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: visible ? 0 : SCREEN_HEIGHT,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [visible]);

  if (!rootMessage && !visible) return null;

  const data = rootMessage ? [rootMessage, ...threadMessages] : [];

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }], paddingBottom: insets.bottom }]}>
        <View style={styles.handle} />

        <View style={styles.header}>
          <Text style={styles.title}>Thread</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <FlatList
          data={data}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={({ item, index }) => (
            <ChatMessage
              message={item}
              isMe={item.sender === currentUser}
              showAvatar={index === 0 || item.sender !== data[index-1]?.sender}
              userProfilePics={userProfilePics}
              currentUser={currentUser}
              currentUserAliases={[]}
              reactions={item.id ? (reactionsByMessageId[item.id] || []) : []}
              onLongPress={() => {}} // Usually limited actions in threads
              onToggleReaction={onToggleReaction}
              onOpenThread={() => {}}
            />
          )}
          contentContainerStyle={styles.listContent}
        />

        <View style={styles.divider} />

        <ChatInput
          onSendMessage={onSendReply}
          placeholder="Reply in thread..."
          projectId={projectId}
        />
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: '85%',
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 20 }
    }),
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.chatDivider,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  divider: { height: 1, backgroundColor: Colors.chatDivider },
  listContent: { paddingBottom: 20 },
});

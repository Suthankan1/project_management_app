import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Text,
  ScrollView,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from '@/src/constants/colors';
import * as DocumentPicker from 'expo-document-picker';
import { uploadChatDocument } from '../../services/chatService';

interface ChatInputProps {
  onSendMessage: (msg: string) => void;
  onTypingChange?: (isTyping: boolean) => void;
  disabled?: boolean;
  placeholder?: string;
  enableMentions?: boolean;
  mentionCandidates?: string[];
  projectId: string;
}

const COMMON_EMOJIS = [
  '👍', '❤️', '🔥', '✅', '😂', '🎉', '😊', '🙌',
  '🚀', '✨', '👀', '💯', '🤔', '👋', '😢', '😮',
  '👏', '💪', '🙏', '🤝', '🎈', '🎁', '📅', '📌',
  '💬', '🔔', '📢', '📁', '📄', '📎', '🔗', '🛠',
  '💻', '📱', '⌚', '📷', '🎨', '🎬', '🎧', '🎮',
  '🌟', '🌙', '☀️', '🌈', '🔥', '🌊', '🍀', '🍎',
];

const AVATAR_COLORS = ['#155DFC', '#9810FA', '#16A34A', '#F59E0B', '#EF4444'];

function getAvatarColor(name: string): string {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export function ChatInput(props: ChatInputProps) {
  const insets = useSafeAreaInsets();
  const {
    onSendMessage,
    onTypingChange,
    disabled,
    placeholder,
    enableMentions,
    mentionCandidates = [],
    projectId,
  } = props;

  const [input, setInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [containerHeight, setContainerHeight] = useState(0);

  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sendScale = useSharedValue(1);
  const emojiTranslateY = useSharedValue(260);

  useEffect(() => {
    emojiTranslateY.value = withSpring(showEmojiPicker ? 0 : 260, {
      damping: 20,
      stiffness: 200,
    });
  }, [showEmojiPicker, emojiTranslateY]);

  const animatedSendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendScale.value }],
  }));

  const animatedEmojiStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: emojiTranslateY.value }],
  }));

  const handleTextChange = (text: string) => {
    setInput(text);

    if (text.trim()) {
      sendScale.value = withSequence(
        withSpring(1.1, { damping: 10, stiffness: 300 }),
        withSpring(1, { damping: 15 }),
      );
    }

    if (enableMentions) {
      const match = text.match(/(^|\s)@([a-zA-Z0-9._-]*)$/);
      setMentionQuery(match ? match[2].toLowerCase() : null);
    }

    if (onTypingChange) {
      onTypingChange(true);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => onTypingChange(false), 2000);
    }
  };

  const handleSend = () => {
    if (input.trim() && !disabled) {
      onSendMessage(input.trim());
      setInput('');
      setMentionQuery(null);
      if (onTypingChange) onTypingChange(false);
    }
  };

  const handleAttach = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        setUploading(true);
        try {
          const url = await uploadChatDocument(projectId, asset);
          onSendMessage(url);
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      console.error('File picker error:', err);
      setUploading(false);
    }
  };

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const insertMention = (user: string) => {
    const lastAt = input.lastIndexOf('@');
    setInput(input.slice(0, lastAt) + '@' + user + ' ');
    setMentionQuery(null);
  };

  const filteredMentions = mentionCandidates.filter(u =>
    u.toLowerCase().includes(mentionQuery ?? '')
  );

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerHeight(e.nativeEvent.layout.height);
  };

  return (
    <View>
      {/*
       * Emoji sheet renders first (lowest z-order) so the input bar
       * renders on top of it. translateY:260 parks it behind the input bar;
       * translateY:0 reveals it above.
       */}
      <Animated.View
        style={[styles.emojiSheet, animatedEmojiStyle, { bottom: containerHeight }]}
        pointerEvents={showEmojiPicker ? 'auto' : 'none'}
      >
        <View style={styles.emojiHandle} />
        <ScrollView
          contentContainerStyle={styles.emojiGrid}
          keyboardShouldPersistTaps="always"
          showsVerticalScrollIndicator={false}
        >
          {COMMON_EMOJIS.map((emoji, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.emojiBtn}
              onPress={() => insertEmoji(emoji)}
            >
              <Text style={styles.emojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </Animated.View>

      {/* Input bar — renders after emoji sheet so it sits on top */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View
          style={[styles.container, { paddingBottom: Math.max(insets.bottom, 8) }]}
          onLayout={onContainerLayout}
        >
          {uploading && (
            <View style={styles.uploadBanner}>
              <Ionicons name="cloud-upload-outline" size={16} color={Colors.bannerAmberText} />
              <Text style={styles.uploadText}>Uploading…</Text>
              <ActivityIndicator size="small" color={Colors.bannerAmberText} />
              <TouchableOpacity style={styles.uploadDismiss} onPress={() => setUploading(false)}>
                <Ionicons name="close" size={16} color={Colors.bannerAmberText} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setShowEmojiPicker(v => !v)}
            >
              <Ionicons name="happy-outline" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>

            <TextInput
              style={styles.textInput}
              placeholder={placeholder ?? 'Type a message...'}
              placeholderTextColor={Colors.textMuted}
              value={input}
              onChangeText={handleTextChange}
              onFocus={() => setShowEmojiPicker(false)}
              multiline
              editable={!disabled}
            />

            <View style={styles.rightIcons}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleAttach}>
                <Ionicons name="attach-outline" size={24} color={Colors.textSecondary} />
              </TouchableOpacity>

              <Animated.View style={animatedSendStyle}>
                <TouchableOpacity
                  style={[
                    styles.sendBtn,
                    { backgroundColor: input.trim() ? Colors.primary : Colors.borderDefault },
                  ]}
                  onPress={handleSend}
                  disabled={!input.trim() || !!disabled}
                >
                  <Ionicons name="send" size={18} color={Colors.white} />
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/*
       * Mention dropdown renders last so it sits above the input bar.
       * bottom: containerHeight keeps it anchored just above the input area.
       */}
      {mentionQuery !== null && filteredMentions.length > 0 && (
        <View style={[styles.mentionDropdown, { bottom: containerHeight }]}>
          <ScrollView
            keyboardShouldPersistTaps="always"
            style={{ maxHeight: 168 }}
            showsVerticalScrollIndicator={false}
          >
            {filteredMentions.map(user => (
              <TouchableOpacity
                key={user}
                style={styles.mentionRow}
                onPress={() => insertMention(user)}
              >
                <View style={[styles.mentionAvatar, { backgroundColor: getAvatarColor(user) }]}>
                  <Text style={styles.mentionAvatarText}>{user.charAt(0).toUpperCase()}</Text>
                </View>
                <View style={styles.mentionTextCol}>
                  <Text style={styles.mentionName}>@{user}</Text>
                  <Text style={styles.mentionSub}>Tap to mention</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.chatHeaderBg,
    borderTopWidth: 1,
    borderTopColor: Colors.chatDivider,
    paddingHorizontal: 8,
    paddingTop: 8,
  },

  // ── Input row ────────────────────────────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingBottom: 4,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    maxHeight: 120,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    backgroundColor: Colors.chatInputBg,
    borderRadius: 24,
  },
  rightIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Upload banner ─────────────────────────────────────────────────────────────
  uploadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bannerAmberBg,
    padding: 8,
    borderRadius: 8,
    marginBottom: 8,
    gap: 6,
  },
  uploadText: {
    flex: 1,
    fontSize: 13,
    color: Colors.bannerAmberText,
  },
  uploadDismiss: {
    padding: 2,
  },

  // ── Emoji bottom sheet ────────────────────────────────────────────────────────
  emojiSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 260,
    backgroundColor: Colors.cardBg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  emojiHandle: {
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.borderDefault,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 4,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
    paddingBottom: 8,
  },
  emojiBtn: {
    width: '12.5%',
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 24,
  },

  // ── Mention dropdown ──────────────────────────────────────────────────────────
  mentionDropdown: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.12,
        shadowRadius: 6,
      },
      android: { elevation: 8 },
    }),
  },
  mentionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderDefault,
  },
  mentionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  mentionAvatarText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: 'bold',
  },
  mentionTextCol: {
    flex: 1,
  },
  mentionName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  mentionSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
});

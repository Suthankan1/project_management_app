import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Text,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  '🌟', '🌙', '☀️', '🌈', '🔥', '🌊', '🍀', '🍎'
];

export function ChatInput(props: ChatInputProps) {
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
  const [isFocused, setIsFocused] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [inputHeight, setInputHeight] = useState(44);

  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTextChange = (text: string) => {
    setInput(text);

    // Mention detection
    if (enableMentions) {
      const match = text.match(/(^|\s)@([a-zA-Z0-9._-]*)$/);
      if (match) {
        setMentionQuery(match[2].toLowerCase());
      } else {
        setMentionQuery(null);
      }
    }

    // Typing notification
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
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        const asset = result.assets[0];
        const url = await uploadChatDocument(projectId, asset.uri, asset.name);
        onSendMessage(url);
      }
    } catch (err) {
      console.error('File picker error:', err);
    }
  };

  const insertEmoji = (emoji: string) => {
    setInput(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const insertMention = (user: string) => {
    const lastAt = input.lastIndexOf('@');
    const newVal = input.slice(0, lastAt) + '@' + user + ' ';
    setInput(newVal);
    setMentionQuery(null);
  };

  const filteredMentions = mentionCandidates.filter(u =>
    u.toLowerCase().includes(mentionQuery || '')
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <View style={styles.container}>

        {/* Mention Suggestions */}
        {mentionQuery !== null && filteredMentions.length > 0 && (
          <View style={styles.mentionList}>
            <FlatList
              data={filteredMentions}
              keyExtractor={item => item}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.mentionItem} onPress={() => insertMention(item)}>
                  <View style={styles.mentionAvatar}>
                    <Text style={styles.mentionAvatarText}>{item.charAt(0).toUpperCase()}</Text>
                  </View>
                  <Text style={styles.mentionName}>@{item}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 200 }}
              keyboardShouldPersistTaps="always"
            />
          </View>
        )}

        <View style={[styles.inputBar, isFocused && styles.focusedBar]}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowEmojiPicker(true)}>
            <Ionicons name="happy-outline" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={handleAttach}>
            <Ionicons name="attach" size={24} color={Colors.textSecondary} />
          </TouchableOpacity>

          <TextInput
            style={[styles.input, { height: Math.min(inputHeight, 120) }]}
            placeholder={placeholder || "Type a message..."}
            value={input}
            onChangeText={handleTextChange}
            multiline
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onContentSizeChange={(e) => setInputHeight(e.nativeEvent.contentSize.height)}
            editable={!disabled}
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || disabled) && styles.disabledSendBtn]}
            onPress={handleSend}
            disabled={!input.trim() || disabled}
          >
            <Ionicons name="send" size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Emoji Picker Modal */}
      <Modal visible={showEmojiPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalCloseArea} onPress={() => setShowEmojiPicker(false)} />
          <View style={styles.emojiSheet}>
            <View style={styles.emojiHeader}>
              <Text style={styles.emojiTitle}>Emojis</Text>
              <TouchableOpacity onPress={() => setShowEmojiPicker(false)}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.emojiGrid}>
              {COMMON_EMOJIS.map((emoji, idx) => (
                <TouchableOpacity key={idx} style={styles.emojiBtn} onPress={() => insertEmoji(emoji)}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.chatDivider,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.chatInputBg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  focusedBar: { borderColor: Colors.primary },
  iconBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingHorizontal: 8,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    marginRight: 4,
  },
  disabledSendBtn: { backgroundColor: Colors.textMuted },
  mentionList: {
    position: 'absolute',
    bottom: '100%',
    left: 12,
    right: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.chatDivider,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.1, shadowRadius: 4 },
      android: { elevation: 4 }
    }),
  },
  mentionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.chatDivider,
  },
  mentionAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  mentionAvatarText: { color: Colors.white, fontSize: 12, fontWeight: 'bold' },
  mentionName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCloseArea: { flex: 1 },
  emojiSheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '40%',
    padding: 16,
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emojiTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  emojiGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  emojiBtn: {
    width: '12%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  emojiText: { fontSize: 24 },
});

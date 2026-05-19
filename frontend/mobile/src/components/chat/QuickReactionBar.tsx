import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Pressable } from 'react-native';
import { Colors } from '@/src/constants/colors';
import { QUICK_REACTIONS } from '@/src/hooks/chat/chatUtils';

interface QuickReactionBarProps {
  visible: boolean;
  onClose: () => void;
  onReact: (emoji: string) => void;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function QuickReactionBar({ visible, onClose, onReact, onReply, onEdit, onDelete }: QuickReactionBarProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.container}>
          {/* Quick emoji row */}
          <View style={styles.emojiRow}>
            {QUICK_REACTIONS.map(emoji => (
              <TouchableOpacity key={emoji} style={styles.emojiBtn} onPress={() => { onReact(emoji); onClose(); }}>
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => { onReply(); onClose(); }}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionLabel}>Reply</Text>
            </TouchableOpacity>
            {onEdit && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => { onEdit(); onClose(); }}>
                <Text style={styles.actionIcon}>✏️</Text>
                <Text style={styles.actionLabel}>Edit</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity style={styles.actionBtn} onPress={() => { onDelete(); onClose(); }}>
                <Text style={styles.actionIcon}>🗑</Text>
                <Text style={[styles.actionLabel, { color: Colors.errorRed }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  container: { backgroundColor: Colors.white, borderRadius: 20, padding: 16, width: '85%', gap: 12 },
  emojiRow: { flexDirection: 'row', justifyContent: 'space-around' },
  emojiBtn: { padding: 8, borderRadius: 12, backgroundColor: Colors.pageBg },
  emoji: { fontSize: 26 },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: Colors.chatDivider, paddingTop: 12, gap: 8, justifyContent: 'space-around' },
  actionBtn: { alignItems: 'center', gap: 4, flex: 1 },
  actionIcon: { fontSize: 20 },
  actionLabel: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },
});

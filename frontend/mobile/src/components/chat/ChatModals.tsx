import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Pressable,
  Platform,
} from 'react-native';
import { Colors } from '@/src/constants/colors';
import { Ionicons } from '@expo/vector-icons';

// Simple reusable Sheet wrapper
const Sheet = ({ visible, onClose, title, children }: any) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <Pressable style={styles.overlay} onPress={onClose} />
    <View style={styles.sheetContainer}>
      <View style={styles.sheet}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>
        <View style={styles.sheetContent}>
          {children}
        </View>
      </View>
    </View>
  </Modal>
);

export function CreateChannelModal({ isOpen, onClose, users, onCreate }: any) {
  const [name, setName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const toggleMember = (user: string) => {
    setSelectedMembers(prev =>
      prev.includes(user) ? prev.filter(u => u !== user) : [...prev, user]
    );
  };

  const handleCreate = () => {
    if (name.trim()) {
      onCreate(name.trim(), selectedMembers);
      setName('');
      setSelectedMembers([]);
      onClose();
    }
  };

  return (
    <Sheet visible={isOpen} onClose={onClose} title="Create Channel">
      <TextInput
        style={styles.input}
        placeholder="Channel name (e.g. general)"
        value={name}
        onChangeText={setName}
        autoFocus
      />
      <Text style={styles.label}>Members</Text>
      <FlatList
        data={users}
        keyExtractor={item => item}
        style={{ maxHeight: 300 }}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.memberRow} onPress={() => toggleMember(item)}>
            <Text style={styles.memberName}>{item}</Text>
            <Ionicons
              name={selectedMembers.includes(item) ? "checkbox" : "square-outline"}
              size={24}
              color={selectedMembers.includes(item) ? Colors.primary : Colors.textMuted}
            />
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity
        style={[styles.primaryBtn, !name.trim() && styles.disabledBtn]}
        onPress={handleCreate}
        disabled={!name.trim()}
      >
        <Text style={styles.primaryBtnText}>Create Channel</Text>
      </TouchableOpacity>
    </Sheet>
  );
}

export function EditMessageModal({ isOpen, onClose, initialContent, onSave }: any) {
  const [content, setContent] = useState(initialContent || '');

  const handleSave = () => {
    if (content.trim()) {
      onSave(content.trim());
      onClose();
    }
  };

  return (
    <Sheet visible={isOpen} onClose={onClose} title="Edit Message">
      <TextInput
        style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
        value={content}
        onChangeText={setContent}
        multiline
        autoFocus
      />
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
          <Text style={styles.secondaryBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={handleSave}>
          <Text style={styles.primaryBtnText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}

export function EditChannelModal({ isOpen, onClose, initialName, initialTopic, initialDescription, onSave }: {
  isOpen: boolean;
  onClose: () => void;
  initialName: string;
  initialTopic: string;
  initialDescription: string;
  onSave: (updates: { name?: string; topic?: string; description?: string }) => void;
}) {
  const [name, setName] = useState(initialName);
  const [topic, setTopic] = useState(initialTopic);
  const [description, setDescription] = useState(initialDescription);

  return (
    <Sheet visible={isOpen} onClose={onClose} title="Edit Channel">
      <Text style={styles.label}>Channel Name</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Channel name" />
      <Text style={styles.label}>Topic</Text>
      <TextInput style={styles.input} value={topic} onChangeText={setTopic} placeholder="Short topic (optional)" />
      <Text style={styles.label}>Description</Text>
      <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} multiline placeholder="Description (optional)" />
      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={onClose}>
          <Text style={styles.secondaryBtnText}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, !name.trim() && styles.disabledBtn]}
          disabled={!name.trim()}
          onPress={() => { onSave({ name: name.trim(), topic: topic.trim(), description: description.trim() }); onClose(); }}
        >
          <Text style={styles.primaryBtnText}>Save</Text>
        </TouchableOpacity>
      </View>
    </Sheet>
  );
}

export function ConfirmDeleteModal({ isOpen, onClose, title, message, onConfirm }: any) {
  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.alert}>
          <Text style={styles.alertTitle}>{title || 'Delete?'}</Text>
          <Text style={styles.alertMsg}>{message}</Text>
          <View style={styles.alertFooter}>
            <TouchableOpacity style={styles.alertBtn} onPress={onClose}>
              <Text style={styles.alertBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.alertBtn} onPress={() => { onConfirm(); onClose(); }}>
              <Text style={[styles.alertBtnText, { color: Colors.errorRed }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  sheetContainer: { flex: 1, justifyContent: 'flex-end', width: '100%' },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    width: '100%',
    maxHeight: '90%',
  },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary },
  closeBtn: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  sheetContent: { gap: 16 },
  input: {
    backgroundColor: Colors.chatInputBg,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.borderDefault,
  },
  label: { fontSize: 14, fontWeight: 'bold', color: Colors.textSecondary, marginTop: 8 },
  memberRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.chatDivider },
  memberName: { fontSize: 16, color: Colors.textPrimary },
  primaryBtn: { backgroundColor: Colors.primary, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  primaryBtnText: { color: Colors.white, fontSize: 16, fontWeight: 'bold' },
  disabledBtn: { backgroundColor: Colors.textMuted },
  secondaryBtn: { paddingVertical: 14, paddingHorizontal: 20 },
  secondaryBtnText: { color: Colors.textSecondary, fontSize: 16 },
  footerRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  alert: { backgroundColor: Colors.white, borderRadius: 16, padding: 20, width: '80%' },
  alertTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  alertMsg: { fontSize: 16, color: Colors.textSecondary, marginBottom: 24 },
  alertFooter: { flexDirection: 'row', justifyContent: 'flex-end', gap: 20 },
  alertBtn: { padding: 8 },
  alertBtnText: { fontSize: 16, fontWeight: '600', color: Colors.primary },
});

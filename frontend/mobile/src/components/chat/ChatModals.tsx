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

const webBlurStyle = Platform.select({
  web: {
    backdropFilter: 'blur(8px) saturate(130%)',
    WebkitBackdropFilter: 'blur(8px) saturate(130%)',
  } as any,
  default: {},
});

const webGlassShadow = Platform.select({
  web: {
    boxShadow: '0 24px 70px rgba(15, 23, 42, 0.28)',
  } as any,
  default: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.22,
    shadowRadius: 34,
  },
});

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

  const closeModal = () => {
    onClose();
  };

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
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={closeModal}>
      <View style={styles.glassRoot}>
        <Pressable style={[styles.glassBackdrop, webBlurStyle]} onPress={closeModal} />
        <View style={[styles.glassPanel, webGlassShadow]}>
          <View style={styles.glassHeader}>
            <View style={styles.glassIconWrap}>
              <Ionicons name="people" size={20} color={Colors.white} />
            </View>
            <View style={styles.glassTitleBlock}>
              <Text style={styles.glassTitle}>Create channel or group</Text>
              <Text style={styles.glassSubtitle}>Start a shared space for focused project work.</Text>
            </View>
            <TouchableOpacity onPress={closeModal} style={styles.glassCloseBtn}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <View style={styles.glassFieldGroup}>
            <Text style={styles.glassLabel}>Name</Text>
            <View style={styles.glassInputWrap}>
              <Text style={styles.inputPrefix}>#</Text>
              <TextInput
                style={styles.glassInput}
                placeholder="design-review"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
          </View>

          <View style={styles.memberHeaderRow}>
            <Text style={styles.glassLabel}>Members</Text>
            <Text style={styles.memberCount}>{selectedMembers.length} selected</Text>
          </View>

          <FlatList
            data={users}
            keyExtractor={item => item}
            style={styles.glassMemberList}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const isSelected = selectedMembers.includes(item);
              return (
                <TouchableOpacity
                  style={[styles.glassMemberRow, isSelected && styles.glassMemberRowSelected]}
                  onPress={() => toggleMember(item)}
                  activeOpacity={0.75}
                >
                  <View style={[styles.memberAvatar, isSelected && styles.memberAvatarSelected]}>
                    <Text style={[styles.memberInitial, isSelected && styles.memberInitialSelected]}>
                      {item.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.glassMemberName} numberOfLines={1}>{item}</Text>
                  <View style={[styles.memberCheck, isSelected && styles.memberCheckSelected]}>
                    {isSelected && <Ionicons name="checkmark" size={14} color={Colors.white} />}
                  </View>
                </TouchableOpacity>
              );
            }}
          />

          <View style={styles.glassFooter}>
            <TouchableOpacity style={styles.glassSecondaryBtn} onPress={closeModal}>
              <Text style={styles.glassSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.glassPrimaryBtn, !name.trim() && styles.glassPrimaryDisabled]}
              onPress={handleCreate}
              disabled={!name.trim()}
            >
              <Text style={styles.glassPrimaryText}>Create</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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
  glassRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  glassBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
  },
  glassPanel: {
    width: '100%',
    maxWidth: 460,
    maxHeight: '86%',
    borderRadius: 28,
    overflow: 'hidden',
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
    elevation: 18,
  },
  glassHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  glassIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
  },
  glassTitleBlock: {
    flex: 1,
    minWidth: 0,
  },
  glassTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
  glassSubtitle: {
    color: Colors.textSecondary,
    fontSize: 12.5,
    lineHeight: 18,
    marginTop: 2,
  },
  glassCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.58)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.62)',
  },
  glassFieldGroup: {
    gap: 8,
    marginBottom: 16,
  },
  glassLabel: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  glassInputWrap: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.86)',
  },
  inputPrefix: {
    color: Colors.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  glassInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    paddingVertical: 0,
  },
  memberHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  memberCount: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  glassMemberList: {
    maxHeight: 250,
    marginBottom: 18,
  },
  glassMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.46)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.58)',
  },
  glassMemberRowSelected: {
    backgroundColor: 'rgba(21, 93, 252, 0.12)',
    borderColor: 'rgba(21, 93, 252, 0.32)',
  },
  memberAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.86)',
  },
  memberAvatarSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  memberInitial: {
    color: Colors.textSecondary,
    fontSize: 13,
    fontWeight: '800',
  },
  memberInitialSelected: {
    color: Colors.white,
  },
  glassMemberName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  memberCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 114, 128, 0.28)',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  memberCheckSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  glassFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  glassSecondaryBtn: {
    height: 46,
    paddingHorizontal: 18,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.54)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.72)',
  },
  glassSecondaryText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  glassPrimaryBtn: {
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
  },
  glassPrimaryDisabled: {
    backgroundColor: 'rgba(107, 114, 128, 0.36)',
  },
  glassPrimaryText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '800',
  },
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

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { T } from '../../constants/tokens';
import {
  CustomFieldDto,
  CustomFieldType,
  projectService,
} from '../../services/project-service';

const FIELD_TYPES: CustomFieldType[] = ['TEXT', 'NUMBER', 'DATE', 'SELECT'];

export default function CustomFieldsManager({ projectId }: { projectId: number }) {
  const [fields, setFields] = useState<CustomFieldDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>('TEXT');
  const [options, setOptions] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await projectService.getCustomFields(projectId);
      setFields(res.map((field, index) => ({ ...field, position: field.position ?? index })));
    } catch {
      Alert.alert('Error', 'Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setShowForm(false);
    setName('');
    setType('TEXT');
    setOptions('');
  };

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const parsedOptions = type === 'SELECT'
        ? options.split(',').map((o) => o.trim()).filter(Boolean)
        : [];
      const created = await projectService.createCustomField(projectId, {
        name: name.trim(),
        fieldType: type,
        options: parsedOptions,
        position: fields.length,
      });
      setFields((prev) => [...prev, created]);
      resetForm();
    } catch {
      Alert.alert('Error', 'Failed to create field');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (field: CustomFieldDto) => {
    Alert.alert(
      'Delete custom field',
      `Delete "${field.name}"? All stored values will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await projectService.deleteCustomField(projectId, field.id);
              setFields((prev) => prev.filter((f) => f.id !== field.id));
            } catch {
              Alert.alert('Error', 'Failed to delete field');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingRow}>
        <ActivityIndicator color={T.primary} size="small" />
        <Text style={styles.loadingText}>Loading fields…</Text>
      </View>
    );
  }

  return (
    <View>
      {!showForm && (
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(true)} activeOpacity={0.8}>
          <MaterialCommunityIcons name="plus" size={16} color="#fff" />
          <Text style={styles.addBtnText}>Add field</Text>
        </TouchableOpacity>
      )}

      {showForm && (
        <View style={styles.form}>
          <Text style={styles.label}>FIELD NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Customer, Budget…"
            placeholderTextColor={T.textMuted}
            autoFocus
          />

          <Text style={[styles.label, { marginTop: 14 }]}>TYPE</Text>
          <View style={styles.typeRow}>
            {FIELD_TYPES.map((ft) => {
              const active = type === ft;
              return (
                <TouchableOpacity
                  key={ft}
                  style={[styles.typeChip, active && styles.typeChipActive]}
                  onPress={() => setType(ft)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.typeChipText, active && styles.typeChipTextActive]}>{ft}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {type === 'SELECT' && (
            <>
              <Text style={[styles.label, { marginTop: 14 }]}>OPTIONS (COMMA-SEPARATED)</Text>
              <TextInput
                style={styles.input}
                value={options}
                onChangeText={setOptions}
                placeholder="Option A, Option B, Option C"
                placeholderTextColor={T.textMuted}
              />
            </>
          )}

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={resetForm} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.createBtn, (!name.trim() || saving) && styles.btnDisabled]}
              onPress={handleCreate}
              disabled={!name.trim() || saving}
              activeOpacity={0.8}
            >
              {saving ? <ActivityIndicator color="#fff" size="small" /> : null}
              <Text style={styles.createBtnText}>{saving ? 'Saving…' : 'Create field'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {fields.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No custom fields yet. Add one to extend every task.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {fields.map((field) => (
            <View key={field.id} style={styles.fieldRow}>
              <View style={{ flex: 1 }}>
                <View style={styles.fieldNameRow}>
                  <Text style={styles.fieldName} numberOfLines={1}>{field.name}</Text>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>{field.fieldType}</Text>
                  </View>
                </View>
                {field.options && field.options.length > 0 ? (
                  <Text style={styles.fieldOptions} numberOfLines={1}>{field.options.join(', ')}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(field)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 12 },
  loadingText: { color: T.textSecondary, fontSize: 13, fontWeight: '600' },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: T.primary, borderRadius: 12, paddingVertical: 11,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },

  form: {
    backgroundColor: T.bgSecondary, borderRadius: 14, borderWidth: 1, borderColor: T.border,
    padding: 14, marginBottom: 14,
  },
  label: { fontSize: 11, fontWeight: '800', color: T.textMuted, letterSpacing: 0.6, marginBottom: 7 },
  input: {
    backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 11,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 14.5, color: T.textPrimary,
  },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1, borderColor: T.border, backgroundColor: T.bg,
  },
  typeChipActive: { borderColor: T.primary, backgroundColor: T.primaryLight },
  typeChipText: { fontSize: 12.5, fontWeight: '800', color: T.textSecondary, letterSpacing: 0.3 },
  typeChipTextActive: { color: T.primary },

  formActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 11,
    borderRadius: 12, borderWidth: 1, borderColor: T.border, backgroundColor: T.bg,
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: T.textSecondary },
  createBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 12, backgroundColor: T.primary,
  },
  createBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },
  btnDisabled: { opacity: 0.5 },

  empty: {
    borderWidth: 1, borderColor: T.border, borderStyle: 'dashed', borderRadius: 12,
    paddingVertical: 22, paddingHorizontal: 16, alignItems: 'center', backgroundColor: T.bgSecondary,
  },
  emptyText: { fontSize: 13, color: T.textMuted, textAlign: 'center' },

  list: { borderWidth: 1, borderColor: T.border, borderRadius: 12, overflow: 'hidden' },
  fieldRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: T.borderLight,
  },
  fieldNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldName: { fontSize: 14, fontWeight: '700', color: T.textPrimary, flexShrink: 1 },
  typeBadge: { backgroundColor: T.bgTertiary, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: '800', color: T.textSecondary, letterSpacing: 0.3 },
  fieldOptions: { fontSize: 12, color: T.textMuted, marginTop: 3 },
  deleteBtn: { padding: 6, borderRadius: 8 },
});

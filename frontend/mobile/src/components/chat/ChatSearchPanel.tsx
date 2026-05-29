import React, { useEffect, useRef } from 'react';
import { Animated, View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/src/constants/colors';
import { ChatSearchResult } from '../../types/chat';
import { formatTime } from '@/src/hooks/chat/chatUtils';

interface ChatSearchPanelProps {
  showSearch: boolean;
  phaseDEnabled: boolean;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  onExecuteSearch: () => void;
  isSearchLoading: boolean;
  searchResults: ChatSearchResult[];
  onOpenResult: (result: ChatSearchResult) => void;
}

export function ChatSearchPanel({
  showSearch,
  phaseDEnabled,
  searchQuery,
  onSearchQueryChange,
  onExecuteSearch,
  isSearchLoading,
  searchResults,
  onOpenResult,
}: ChatSearchPanelProps) {
  const panelHeight = useRef(new Animated.Value(0)).current;
  const maxHeight = Dimensions.get('window').height * 0.35;

  useEffect(() => {
    Animated.timing(panelHeight, {
      toValue: showSearch ? maxHeight : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [maxHeight, panelHeight, showSearch]);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      if (showSearch) panelHeight.setValue(window.height * 0.35);
    });
    return () => sub?.remove();
  }, [panelHeight, showSearch]);

  if (!phaseDEnabled) return null;

  return (
    <Animated.View style={[styles.panel, { height: panelHeight, overflow: 'hidden' }]}>
      <View style={styles.inputContainer}>
        <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search messages..."
          value={searchQuery}
          onChangeText={onSearchQueryChange}
          onSubmitEditing={onExecuteSearch}
          returnKeyType="search"
        />
        {isSearchLoading && <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />}
      </View>

      <FlatList
        data={searchResults}
        keyExtractor={(item) => item.messageId.toString()}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.resultRow} onPress={() => onOpenResult(item)}>
            <View style={styles.resultHeader}>
              <Text style={styles.sender}>{item.senderName}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.roomId ? 'ROOM' : 'CHAT'}</Text>
              </View>
              <Text style={styles.time}>{formatTime(item.timestamp)}</Text>
            </View>
            <Text style={styles.content} numberOfLines={2}>{item.highlightedContent}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          searchQuery.length > 0 && !isSearchLoading ? (
            <Text style={styles.emptyText}>No results found</Text>
          ) : null
        }
        contentContainerStyle={styles.listContent}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.chatDivider,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.chatInputBg,
    margin: 12,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: { marginRight: 8 },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
  },
  loader: { marginLeft: 8 },
  listContent: { paddingBottom: 12 },
  resultRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.chatDivider,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sender: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginRight: 8,
  },
  badge: {
    backgroundColor: Colors.chatDivider,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  time: {
    fontSize: 11,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  content: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: Colors.textMuted,
    fontSize: 14,
  },
});

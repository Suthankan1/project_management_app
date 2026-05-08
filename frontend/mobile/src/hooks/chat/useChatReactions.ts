import { useState, useCallback } from 'react';
import { ChatReactionSummary } from '../../types/chat';
import * as chatService from '../../services/chatService';

export function useChatReactions(projectId: string) {
  const [messageReactions, setMessageReactions] = useState<Record<number, ChatReactionSummary[]>>({});

  const loadReactions = useCallback(async (messageIds: number[]) => {
    if (messageIds.length === 0) return;
    try {
      const data = await chatService.fetchReactions(messageIds);
      setMessageReactions(prev => ({ ...prev, ...data }));
    } catch (err) {
      console.error('Failed to load reactions:', err);
    }
  }, [projectId]);

  const toggleReaction = useCallback(async (messageId: number, emoji: string) => {
    try {
      await chatService.toggleReaction(messageId, emoji, projectId);

      // Optimistic update or fetch fresh
      setMessageReactions(prev => {
        const current = prev[messageId] || [];
        const existing = current.find(r => r.emoji === emoji);

        let next: ChatReactionSummary[];
        if (existing) {
          if (existing.reactedByCurrentUser) {
            // Remove or decrement
            if (existing.count <= 1) {
              next = current.filter(r => r.emoji !== emoji);
            } else {
              next = current.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, reactedByCurrentUser: false } : r);
            }
          } else {
            // Increment
            next = current.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, reactedByCurrentUser: true } : r);
          }
        } else {
          // Add new
          next = [...current, { emoji, count: 1, reactedByCurrentUser: true }];
        }

        return { ...prev, [messageId]: next };
      });
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  }, [projectId]);

  const setReactionsForMessage = useCallback((messageId: number, reactions: ChatReactionSummary[]) => {
    setMessageReactions(prev => ({ ...prev, [messageId]: reactions }));
  }, []);

  return {
    messageReactions,
    setMessageReactions,
    loadReactions,
    toggleReaction,
    setReactionsForMessage,
  };
}

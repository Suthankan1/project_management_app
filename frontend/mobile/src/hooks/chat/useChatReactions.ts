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

  const applyOptimisticReaction = useCallback((messageId: number, emoji: string) => {
    setMessageReactions(prev => {
      const current = prev[messageId] || [];
      const existing = current.find(r => r.emoji === emoji);

      let next: ChatReactionSummary[];
      if (existing) {
        if (existing.reactedByCurrentUser) {
          if (existing.count <= 1) {
            next = current.filter(r => r.emoji !== emoji);
          } else {
            next = current.map(r => r.emoji === emoji ? { ...r, count: r.count - 1, reactedByCurrentUser: false } : r);
          }
        } else {
          next = current.map(r => r.emoji === emoji ? { ...r, count: r.count + 1, reactedByCurrentUser: true } : r);
        }
      } else {
        next = [...current, { emoji, count: 1, reactedByCurrentUser: true }];
      }

      return { ...prev, [messageId]: next };
    });
  }, []);

  const toggleReaction = useCallback(async (
    messageId: number,
    emoji: string,
    stompSend?: (dest: string, body: string) => void,
  ) => {
    const trimmed = emoji.trim();
    if (!trimmed) return;

    if (stompSend) {
      applyOptimisticReaction(messageId, trimmed);
      stompSend(
        `/app/project/${projectId}/messages/${messageId}/reaction.toggle`,
        JSON.stringify({ emoji: trimmed }),
      );
      return;
    }

    try {
      const reactions = await chatService.toggleReaction(messageId, trimmed, projectId);
      setMessageReactions(prev => ({ ...prev, [messageId]: reactions }));
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
    }
  }, [applyOptimisticReaction, projectId]);

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

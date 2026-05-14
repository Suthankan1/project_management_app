import { useState, useCallback } from 'react';
import { ChatMessage } from '../../types/chat';
import * as chatService from '../../services/chatService';

function sortMessages(messages: ChatMessage[]): ChatMessage[] {
  return [...messages].sort((a, b) => {
    const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return bTime - aTime;
  });
}

// Deduplicate helper: replaces a message with the same localId or id, or prepends.
// Lists are kept newest-first because ChatMessageList renders an inverted FlatList.
function mergeIncoming(prev: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (incoming.localId) {
    const idx = prev.findIndex(m => m.localId === incoming.localId);
    if (idx !== -1) {
      const next = [...prev];
      next[idx] = { ...prev[idx], ...incoming };
      return sortMessages(next);
    }
  }
  if (incoming.id) {
    if (prev.some(m => m.id === incoming.id)) return prev;
  }
  return sortMessages([incoming, ...prev]);
}

function mergeHistory(prev: ChatMessage[], history: ChatMessage[]): ChatMessage[] {
  return sortMessages(
    history.reduce((acc, message) => mergeIncoming(acc, message), prev),
  );
}

function dmKey(username: string): string {
  return username.trim().toLowerCase();
}

export function useChatMessages(projectId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [roomMessages, setRoomMessages] = useState<Record<number, ChatMessage[]>>({});
  const [privateMessages, setPrivateMessages] = useState<Record<string, ChatMessage[]>>({});

  const loadTeamHistory = useCallback(async () => {
    try {
      const data = await chatService.fetchTeamMessages(projectId);
      setMessages(prev => mergeHistory(prev, data));
    } catch (err) {
      console.error('loadTeamHistory failed:', err);
    }
  }, [projectId]);

  const loadRoomHistory = useCallback(async (roomId: number) => {
    try {
      const data = await chatService.fetchRoomHistory(projectId, roomId);
      setRoomMessages(prev => ({
        ...prev,
        [roomId]: mergeHistory(prev[roomId] || [], data),
      }));
    } catch (err) {
      console.error('loadRoomHistory failed:', err);
    }
  }, [projectId]);

  const loadPrivateHistory = useCallback(async (partner: string) => {
    try {
      const data = await chatService.fetchPrivateHistory(projectId, partner);
      const key = dmKey(partner);
      setPrivateMessages(prev => ({
        ...prev,
        [key]: mergeHistory(prev[key] || [], data),
      }));
    } catch (err) {
      console.error('loadPrivateHistory failed:', err);
    }
  }, [projectId]);

  // Called by useChat when a team message arrives over WS
  const addTeamMessage = useCallback((msg: ChatMessage) => {
    setMessages(prev => mergeIncoming(prev, msg));
  }, []);

  // Called by useChat when a room message arrives over WS
  const addRoomMessage = useCallback((roomId: number, msg: ChatMessage) => {
    setRoomMessages(prev => ({
      ...prev,
      [roomId]: mergeIncoming(prev[roomId] || [], msg),
    }));
  }, []);

  // Called by useChat when a DM arrives over WS
  const addPrivateMessage = useCallback((partner: string, msg: ChatMessage) => {
    setPrivateMessages(prev => ({
      ...prev,
      [dmKey(partner)]: mergeIncoming(prev[dmKey(partner)] || [], msg),
    }));
  }, []);

  const editMessage = useCallback(async (messageId: number, content: string) => {
    try {
      const updated = await chatService.editMessageRest(projectId, messageId, content);
      const updater = (m: ChatMessage) => m.id === messageId ? { ...m, ...updated } : m;
      setMessages(prev => prev.map(updater));
      setRoomMessages(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { next[+k] = next[+k].map(updater); });
        return next;
      });
      setPrivateMessages(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { next[k] = next[k].map(updater); });
        return next;
      });
    } catch (err) {
      console.error('editMessage failed:', err);
    }
  }, [projectId]);

  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      await chatService.deleteMessageRest(projectId, messageId);
      const deleter = (m: ChatMessage) =>
        m.id === messageId ? { ...m, deleted: true, content: 'This message was deleted' } : m;
      setMessages(prev => prev.map(deleter));
      setRoomMessages(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { next[+k] = next[+k].map(deleter); });
        return next;
      });
      setPrivateMessages(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => { next[k] = next[k].map(deleter); });
        return next;
      });
    } catch (err) {
      console.error('deleteMessage failed:', err);
    }
  }, [projectId]);

  return {
    messages, roomMessages, privateMessages,
    setMessages, setRoomMessages, setPrivateMessages,
    loadTeamHistory, loadRoomHistory, loadPrivateHistory,
    addTeamMessage, addRoomMessage, addPrivateMessage,
    editMessage, deleteMessage,
  };
}

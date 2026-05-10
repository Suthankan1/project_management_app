import { useState, useCallback } from 'react';
import { ChatMessage } from '../../types/chat';
import * as chatService from '../../services/chatService';

export function useChatMessages(projectId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]); // Team messages
  const [roomMessages, setRoomMessages] = useState<Record<number, ChatMessage[]>>({});
  const [privateMessages, setPrivateMessages] = useState<Record<string, ChatMessage[]>>({});

  const loadTeamHistory = useCallback(async () => {
    try {
      const data = await chatService.fetchTeamMessages(projectId);
      setMessages([...data].reverse());
    } catch (err) {
      console.error('Failed to load team messages:', err);
    }
  }, [projectId]);

  const loadRoomHistory = useCallback(async (roomId: number) => {
    try {
      const data = await chatService.fetchRoomHistory(projectId, roomId);
      setRoomMessages(prev => ({ ...prev, [roomId]: [...data].reverse() }));
    } catch (err) {
      console.error('Failed to load room messages:', err);
    }
  }, [projectId]);

  const loadPrivateHistory = useCallback(async (partner: string) => {
    try {
      const data = await chatService.fetchPrivateHistory(projectId, partner);
      setPrivateMessages(prev => ({ ...prev, [partner]: [...data].reverse() }));
    } catch (err) {
      console.error('Failed to load private messages:', err);
    }
  }, [projectId]);

  const addMessage = useCallback((msg: ChatMessage) => {
    if (msg.roomId) {
      setRoomMessages(prev => ({
        ...prev,
        [msg.roomId!]: [msg, ...(prev[msg.roomId!] || [])]
      }));
    } else if (msg.recipient) {
      // Private message - add to both sender and recipient conversation
      setPrivateMessages(prev => ({
        ...prev,
        [msg.recipient!]: [msg, ...(prev[msg.recipient!] || [])]
      }));
    } else {
      setMessages(prev => [msg, ...prev]);
    }
  }, []);

  const editMessage = useCallback(async (messageId: number, content: string) => {
    try {
      const updated = await chatService.editMessageRest(projectId, messageId, content);
      // Update in all local stores
      setMessages(prev => prev.map(m => m.id === messageId ? updated : m));
      setRoomMessages(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(roomId => {
          next[Number(roomId)] = next[Number(roomId)].map(m => m.id === messageId ? updated : m);
        });
        return next;
      });
      setPrivateMessages(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(partner => {
          next[partner] = next[partner].map(m => m.id === messageId ? updated : m);
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to edit message:', err);
    }
  }, [projectId]);

  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      await chatService.deleteMessageRest(projectId, messageId);
      const deleter = (m: ChatMessage) => m.id === messageId ? { ...m, deleted: true, content: 'This message was deleted' } : m;

      setMessages(prev => prev.map(deleter));
      setRoomMessages(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(roomId => {
          next[Number(roomId)] = next[Number(roomId)].map(deleter);
        });
        return next;
      });
      setPrivateMessages(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(partner => {
          next[partner] = next[partner].map(deleter);
        });
        return next;
      });
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  }, [projectId]);

  return {
    messages,
    roomMessages,
    privateMessages,
    setMessages,
    setRoomMessages,
    setPrivateMessages,
    loadTeamHistory,
    loadRoomHistory,
    loadPrivateHistory,
    addMessage,
    editMessage,
    deleteMessage,
  };
}

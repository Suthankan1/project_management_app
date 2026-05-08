import { useState, useCallback } from 'react';
import * as chatService from '../../services/chatService';

export function useChatPresence(projectId: string) {
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [teamTypingUsers, setTeamTypingUsers] = useState<string[]>([]);
  const [roomTypingUsers, setRoomTypingUsers] = useState<Record<number, string[]>>({});
  const [privateTypingUsers, setPrivateTypingUsers] = useState<string[]>([]);

  const loadPresence = useCallback(async () => {
    try {
      const data = await chatService.fetchPresence(projectId);
      setOnlineUsers(data.onlineUsers);
    } catch (err) {
      console.error('Failed to load presence:', err);
    }
  }, [projectId]);

  const handleTypingEvent = useCallback((event: { username: string; roomId?: number; isTyping: boolean; isPrivate?: boolean }) => {
    const { username, roomId, isTyping, isPrivate } = event;

    if (roomId) {
      setRoomTypingUsers(prev => {
        const users = prev[roomId] || [];
        const nextUsers = isTyping
          ? [...new Set([...users, username])]
          : users.filter(u => u !== username);
        return { ...prev, [roomId]: nextUsers };
      });
    } else if (isPrivate) {
      setPrivateTypingUsers(prev => {
        return isTyping
          ? [...new Set([...prev, username])]
          : prev.filter(u => u !== username);
      });
    } else {
      setTeamTypingUsers(prev => {
        return isTyping
          ? [...new Set([...prev, username])]
          : prev.filter(u => u !== username);
      });
    }
  }, []);

  const handlePresenceEvent = useCallback((event: { onlineUsers?: string[] }) => {
    if (event.onlineUsers) setOnlineUsers(event.onlineUsers);
  }, []);

  return {
    onlineUsers,
    teamTypingUsers,
    roomTypingUsers,
    privateTypingUsers,
    loadPresence,
    handleTypingEvent,
    handlePresenceEvent,
  };
}

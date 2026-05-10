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

  const handleTypingEvent = useCallback((event: { sender: string; scope: string; roomId?: number; recipient?: string; typing: boolean }) => {
    const { sender, scope, roomId, recipient, typing: isTyping } = event;

    if (scope === 'ROOM' && roomId) {
      setRoomTypingUsers(prev => {
        const users = prev[roomId] || [];
        const nextUsers = isTyping
          ? [...new Set([...users, sender])]
          : users.filter(u => u !== sender);
        return { ...prev, [roomId]: nextUsers };
      });
    } else if (scope === 'PRIVATE') {
      setPrivateTypingUsers(prev => {
        return isTyping
          ? [...new Set([...prev, sender])]
          : prev.filter(u => u !== sender);
      });
    } else if (scope === 'TEAM') {
      setTeamTypingUsers(prev => {
        return isTyping
          ? [...new Set([...prev, sender])]
          : prev.filter(u => u !== sender);
      });
    }
  }, []);

  const handlePresenceEvent = useCallback((event: { type: string; user: string; onlineUsers: string[] }) => {
    const { onlineUsers: users } = event;
    if (Array.isArray(users)) {
      setOnlineUsers(users);
    }
  }, []);

  return {
    onlineUsers,
    setOnlineUsers,
    teamTypingUsers,
    roomTypingUsers,
    privateTypingUsers,
    loadPresence,
    handleTypingEvent,
    handlePresenceEvent,
  };
}

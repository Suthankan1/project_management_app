import { useState, useCallback } from 'react';
import { ChatMessage } from '../../types/chat';
import * as chatService from '../../services/chatService';

function dmKey(username: string): string {
  return username.trim().toLowerCase();
}

export function useChatUnread(projectId: string) {
  const [privateUnseenCounts, setPrivateUnseenCounts] = useState<Record<string, number>>({});
  const [roomUnseenCounts, setRoomUnseenCounts] = useState<Record<number, number>>({});
  const [teamUnseenCount, setTeamUnseenCount] = useState(0);

  const [privateLastMessages, setPrivateLastMessages] = useState<Record<string, ChatMessage | null>>({});
  const [roomLastMessages, setRoomLastMessages] = useState<Record<number, ChatMessage | null>>({});
  const [teamLastMessage, setTeamLastMessage] = useState<ChatMessage | null>(null);

  const [roomMentionCounts, setRoomMentionCounts] = useState<Record<number, number>>({});
  const [teamMentionCount, setTeamMentionCount] = useState(0);

  const loadSummaries = useCallback(async () => {
    try {
      const { directSummaries, roomSummaries, teamSummary } = await chatService.fetchChatSummaries(projectId);

      const pUnseen: Record<string, number> = {};
      const pLast: Record<string, ChatMessage | null> = {};
      directSummaries.forEach(s => {
        const key = dmKey(s.username);
        pUnseen[key] = s.unseenCount;
        pLast[key] = s.lastMessage ? { content: s.lastMessage, sender: s.lastMessageSender || '', timestamp: s.lastMessageTimestamp || undefined } as ChatMessage : null;
      });
      setPrivateUnseenCounts(pUnseen);
      setPrivateLastMessages(pLast);

      const rUnseen: Record<number, number> = {};
      const rLast: Record<number, ChatMessage | null> = {};
      roomSummaries.forEach(s => {
        rUnseen[s.roomId] = s.unseenCount;
        rLast[s.roomId] = s.lastMessage ? { content: s.lastMessage, sender: s.lastMessageSender || '', timestamp: s.lastMessageTimestamp || undefined } as ChatMessage : null;
      });
      setRoomUnseenCounts(rUnseen);
      setRoomLastMessages(rLast);

      if (teamSummary) {
        setTeamUnseenCount(teamSummary.unseenCount);
        setTeamLastMessage(teamSummary.lastMessage ? { content: teamSummary.lastMessage, sender: teamSummary.lastMessageSender || '', timestamp: teamSummary.lastMessageTimestamp || undefined } as ChatMessage : null);
      }
    } catch (err) {
      console.error('Failed to load chat summaries:', err);
    }
  }, [projectId]);

  return {
    privateUnseenCounts,
    setPrivateUnseenCounts,
    roomUnseenCounts,
    setRoomUnseenCounts,
    teamUnseenCount,
    setTeamUnseenCount,
    privateLastMessages,
    setPrivateLastMessages,
    roomLastMessages,
    setRoomLastMessages,
    teamLastMessage,
    setTeamLastMessage,
    roomMentionCounts,
    setRoomMentionCounts,
    teamMentionCount,
    setTeamMentionCount,
    loadSummaries,
  };
}

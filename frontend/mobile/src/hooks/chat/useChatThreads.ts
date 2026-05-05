import { useState, useCallback } from 'react';
import { ChatMessage } from '../../types/chat';
import * as chatService from '../../services/chatService';

export function useChatThreads(projectId: string) {
  const [activeThreadRoot, setActiveThreadRoot] = useState<ChatMessage | null>(null);
  const [threadMessages, setThreadMessages] = useState<ChatMessage[]>([]);

  const openThread = useCallback(async (message: ChatMessage) => {
    setActiveThreadRoot(message);
    if (message.id) {
      try {
        const data = await chatService.fetchThreadMessages(message.id, projectId);
        setThreadMessages(data);
      } catch (err) {
        console.error('Failed to load thread messages:', err);
      }
    }
  }, [projectId]);

  const closeThread = useCallback(() => {
    setActiveThreadRoot(null);
    setThreadMessages([]);
  }, []);

  const sendThreadReply = useCallback(async (content: string) => {
    if (!activeThreadRoot?.id) return;

    try {
      const reply = await chatService.postThreadReply(projectId, activeThreadRoot.id, content);
      setThreadMessages(prev => [...prev, reply]);
      return reply;
    } catch (err) {
      console.error('Failed to send thread reply:', err);
      return null;
    }
  }, [projectId, activeThreadRoot]);

  return {
    activeThreadRoot,
    threadMessages,
    openThread,
    closeThread,
    sendThreadReply,
    setThreadMessages,
  };
}

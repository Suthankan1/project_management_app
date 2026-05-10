import { useState, useEffect, useRef, useCallback } from 'react';
import * as chatService from '../../services/chatService';
import { API_BASE_URL } from '../../api/axios';
import { ChatMessage, ChatRoom, ChatFeatureFlags } from '../../types/chat';
import { useChatRooms } from './useChatRooms';
import { useChatMessages } from './useChatMessages';
import { useChatPresence } from './useChatPresence';
import { useChatReactions } from './useChatReactions';
import { useChatSearch } from './useChatSearch';
import { useChatThreads } from './useChatThreads';
import { useChatUnread } from './useChatUnread';
import { getToken } from '@/src/auth/storage';

// Minimal STOMP frame builder/parser — inline, no library
function buildStompConnect(token: string) {
  return `CONNECT\naccept-version:1.2\nheart-beat:0,0\nAuthorization:Bearer ${token}\n\n\0`;
}
function buildStompSubscribe(id: string, dest: string) {
  return `SUBSCRIBE\nid:${id}\ndestination:${dest}\n\n\0`;
}
function buildStompSend(dest: string, body: string) {
  return `SEND\ndestination:${dest}\ncontent-type:application/json\n\n${body}\0`;
}
function parseStompFrame(raw: string): { command: string; headers: Record<string, string>; body: string } {
  // Normalize line endings and handle heartbeats
  const normalized = raw.replace(/\r\n/g, '\n');
  if (normalized === '\n' || !normalized.trim()) {
    return { command: 'HEARTBEAT', headers: {}, body: '' };
  }

  const dividerIndex = normalized.indexOf('\n\n');
  if (dividerIndex === -1) {
    // Possibly just a command with no headers/body
    return { command: normalized.trim(), headers: {}, body: '' };
  }

  const header = normalized.slice(0, dividerIndex);
  const body = normalized.slice(dividerIndex + 2).replace(/\0$/, '');

  const lines = header.split('\n');
  const command = lines[0].trim();
  const headers: Record<string, string> = {};
  lines.slice(1).forEach(l => {
    const idx = l.indexOf(':');
    if (idx > 0) {
      const key = l.slice(0, idx).trim();
      const value = l.slice(idx + 1).trim();
      headers[key] = value;
    }
  });
  return { command, headers, body };
}

export function useChat(projectId: string) {
  const [currentUser, setCurrentUser] = useState<string>('');
  const [currentUserAliases, setCurrentUserAliases] = useState<string[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [userProfilePics, setUserProfilePics] = useState<Record<string, string>>({});
  const [featureFlags, setFeatureFlags] = useState<ChatFeatureFlags>({
    phaseDEnabled: false,
    phaseEEnabled: false,
    webhooksEnabled: false,
    telemetryEnabled: false,
  });
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [error, setError] = useState<string>('');

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);
  const handleSocketMessageRef = useRef<((frame: any) => void) | null>(null);

  const roomsHook = useChatRooms(projectId);
  const messagesHook = useChatMessages(projectId);
  const presenceHook = useChatPresence(projectId);
  const reactionsHook = useChatReactions(projectId);
  const searchHook = useChatSearch(projectId);
  const threadsHook = useChatThreads(projectId);
  const unreadHook = useChatUnread(projectId);

  const { selectedRoomId, selectRoom, rooms } = roomsHook;

  const connectWebSocket = useCallback(async () => {
    if (socketRef.current) return;

    try {
      const token = await getToken();
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const base = process.env.EXPO_PUBLIC_API_URL || API_BASE_URL || 'http://localhost:8080';
      // If base contains /api, we usually want the root for ws-native, but let's try root first if replace fails or produces something odd
      const rootBase = base.includes('/api') ? base.split('/api')[0] : base;
      const wsUrl = rootBase.replace(/^http/, 'ws') + '/ws-native';

      try {
        console.info(`[Chat] Connecting to websocket: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.info('[Chat] WebSocket opened');
          ws.send(buildStompConnect(token));
        };

        ws.onmessage = async (e) => {
          try {
            let rawData = e.data;
            if (typeof rawData !== 'string') {
              // Handle Blob or ArrayBuffer
              rawData = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsText(rawData as any);
              });
            }

            const frame = parseStompFrame(rawData);
            if (frame.command === 'CONNECTED') {
              console.info('[Chat] STOMP CONNECTED');
              setIsSocketConnected(true);
              setError('');
              // Subscribe to channels
              ws.send(buildStompSubscribe('sub-team', `/topic/project/${projectId}/public`));
              ws.send(buildStompSubscribe('sub-private', `/user/queue/project/${projectId}/messages`));
              ws.send(buildStompSubscribe('sub-typing-team', `/topic/project/${projectId}/typing/team`));
              ws.send(buildStompSubscribe('sub-presence', `/topic/project/${projectId}/presence`));
              ws.send(buildStompSubscribe('sub-typing-private', `/user/queue/project/${projectId}/typing/private`));
              ws.send(buildStompSubscribe('sub-unread', `/user/queue/project/${projectId}/unread-badge`));
            } else if (frame.command === 'MESSAGE') {
              handleSocketMessageRef.current?.(frame);
            }
          } catch (inner) {
            console.error('[Chat] Failed to parse STOMP frame', inner, e.data);
          }
        };

        ws.onclose = (ev) => {
          console.warn('[Chat] WebSocket closed', ev);
          setIsSocketConnected(false);
          socketRef.current = null;
          if (!reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              reconnectTimeoutRef.current = null;
              connectWebSocket();
            }, 5000);
          }
        };

        ws.onerror = (e) => {
          console.error('[Chat] WebSocket error', e);
          setError('Connection error. Retrying...');
        };
      } catch (err) {
        console.error('[Chat] Failed to construct WebSocket', err, 'wsUrl=', wsUrl);
        const errMsg = err instanceof Error ? err.message : String(err);
        setError(`Failed to connect to chat server (${wsUrl}): ${errMsg}`);
      }
    } catch (err) {
      setError('Failed to connect to chat server');
    }
  }, [projectId]);

  const handleSocketMessage = useCallback((frame: any) => {
    const dest = frame.headers.destination;
    try {
      const body = JSON.parse(frame.body);
      
      // Team messages
      if (dest.includes(`/topic/project/${projectId}/public`)) {
        messagesHook.addMessage(body);
        unreadHook.setTeamLastMessage(body);
        if (body.sender && body.sender.toLowerCase() !== currentUser.toLowerCase()) {
          unreadHook.setTeamUnseenCount(prev => prev + 1);
        }
      } 
      // Room messages
      else if (dest.includes(`/topic/project/${projectId}/room/`)) {
        messagesHook.addMessage(body);
        if (body.roomId) {
          unreadHook.setRoomLastMessages(prev => ({ ...prev, [body.roomId]: body }));
          if (body.sender && body.sender.toLowerCase() !== currentUser.toLowerCase() && body.roomId !== selectedRoomId) {
            unreadHook.setRoomUnseenCounts(prev => ({ ...prev, [body.roomId]: (prev[body.roomId] || 0) + 1 }));
          }
        }
      } 
      // Private messages
      else if (dest.includes(`/user/queue/project/${projectId}/messages`)) {
        messagesHook.addMessage(body);
        const partner = body.sender === currentUser ? body.recipient : body.sender;
        if (partner) {
          unreadHook.setPrivateLastMessages(prev => ({ ...prev, [partner]: body }));
          if (body.sender && body.sender.toLowerCase() !== currentUser.toLowerCase() && partner !== selectedUser) {
            unreadHook.setPrivateUnseenCounts(prev => ({ ...prev, [partner]: (prev[partner] || 0) + 1 }));
          }
        }
      } 
      // Team typing events
      else if (dest.includes(`/topic/project/${projectId}/typing/team`)) {
        presenceHook.handleTypingEvent(body);
      } 
      // Private typing events
      else if (dest.includes(`/user/queue/project/${projectId}/typing/private`)) {
        presenceHook.handleTypingEvent(body);
      }
      // Presence events
      else if (dest.includes(`/topic/project/${projectId}/presence`)) {
        presenceHook.handlePresenceEvent(body);
      }
      // Unread badge updates
      else if (dest.includes(`/user/queue/project/${projectId}/unread-badge`)) {
        unreadHook.loadSummaries();
      }
    } catch (parseErr) {
      console.error('[Chat] Failed to parse message body:', parseErr);
    }
  }, [projectId, currentUser, selectedRoomId, selectedUser, messagesHook, unreadHook, presenceHook]);

  // Update the ref whenever handleSocketMessage changes
  useEffect(() => {
    handleSocketMessageRef.current = handleSocketMessage;
  }, [handleSocketMessage]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      try {
        const [user, members, roomsData, flags] = await Promise.all([
          chatService.fetchCurrentUser(),
          chatService.fetchProjectUsers(projectId),
          chatService.fetchRooms(projectId),
          chatService.fetchFeatureFlags(projectId),
        ]);
        setCurrentUser(user.username);
        setCurrentUserAliases(user.aliases || []);
        setUsers(members);
        setFeatureFlags(flags);
        roomsHook.setRooms(roomsData);

        await Promise.all([
          messagesHook.loadTeamHistory(),
          unreadHook.loadSummaries(),
          presenceHook.loadPresence(),
        ]);
      } catch (err) {
        console.error('[Chat] Init failed', err);
        setError('Failed to initialize chat');
      } finally {
        setIsLoading(false);
      }
    };
    init();
    connectWebSocket();

    return () => {
      if (socketRef.current) socketRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    };
  }, [projectId]);

  // Actions
  const selectPrivateUser = (user: string | null) => {
    setSelectedUser(user);
    if (user) {
      selectRoom(null);
      messagesHook.loadPrivateHistory(user);
      chatService.markPrivateRead(projectId, user);
      unreadHook.setPrivateUnseenCounts(prev => ({ ...prev, [user]: 0 }));
    }
  };

  const handleSelectRoom = (id: number | null) => {
    selectRoom(id);
    if (id && socketRef.current && isSocketConnected) {
      setSelectedUser(null);
      messagesHook.loadRoomHistory(id);
      chatService.markRoomRead(projectId, id);
      unreadHook.setRoomUnseenCounts(prev => ({ ...prev, [id]: 0 }));
      // Subscribe to room topic dynamically
      socketRef.current.send(buildStompSubscribe(`sub-room-${id}`, `/topic/project/${projectId}/room/${id}`));
    } else {
      setSelectedUser(null);
      messagesHook.loadRoomHistory(id!);
      chatService.markRoomRead(projectId, id!);
      unreadHook.setRoomUnseenCounts(prev => ({ ...prev, [id!]: 0 }));
    }
  };

  const sendMessage = async (content: string, recipient?: string | null) => {
    if (!socketRef.current || !isSocketConnected) return;
    const body = JSON.stringify({ content, recipient, roomId: null });
    const destination = recipient 
      ? `/app/project/${projectId}/chat.sendPrivateMessage`
      : `/app/project/${projectId}/chat.sendMessage`;
    socketRef.current.send(buildStompSend(destination, body));
  };

  const sendRoomMessage = async (content: string, roomId: number) => {
    if (!socketRef.current || !isSocketConnected) return;
    const body = JSON.stringify({ content, roomId });
    socketRef.current.send(buildStompSend(`/app/project/${projectId}/room/${roomId}/send`, body));
  };

  const sendTyping = (isTyping: boolean) => {
    if (!socketRef.current || !isSocketConnected) return;
    const body = JSON.stringify({
      isTyping,
      roomId: selectedRoomId,
      recipient: selectedUser,
      isPrivate: !!selectedUser
    });
    socketRef.current.send(buildStompSend(`/app/project/${projectId}/typing`, body));
  };

  return {
    currentUser, currentUserAliases, users, userProfilePics,
    selectedUser, selectedRoomId,
    messages: messagesHook.messages,
    privateMessages: messagesHook.privateMessages,
    roomMessages: messagesHook.roomMessages,
    rooms,
    privateUnseenCounts: unreadHook.privateUnseenCounts,
    roomUnseenCounts: unreadHook.roomUnseenCounts,
    privateLastMessages: unreadHook.privateLastMessages,
    roomLastMessages: unreadHook.roomLastMessages,
    teamUnseenCount: unreadHook.teamUnseenCount,
    teamLastMessage: unreadHook.teamLastMessage,
    teamMentionCount: unreadHook.teamMentionCount,
    roomMentionCounts: unreadHook.roomMentionCounts,
    onlineUsers: presenceHook.onlineUsers,
    teamTypingUsers: presenceHook.teamTypingUsers,
    roomTypingUsers: presenceHook.roomTypingUsers,
    privateTypingUsers: presenceHook.privateTypingUsers,
    featureFlags,
    searchResults: searchHook.searchResults,
    isSearchLoading: searchHook.isSearchLoading,
    messageReactions: reactionsHook.messageReactions,
    activeThreadRoot: threadsHook.activeThreadRoot,
    threadMessages: threadsHook.threadMessages,
    isLoading,
    isSocketConnected,
    error,
    selectPrivateUser,
    selectRoom: handleSelectRoom,
    sendMessage,
    sendRoomMessage,
    sendThreadReply: threadsHook.sendThreadReply,
    openThread: threadsHook.openThread,
    closeThread: threadsHook.closeThread,
    editMessage: messagesHook.editMessage,
    deleteMessage: messagesHook.deleteMessage,
    toggleReaction: reactionsHook.toggleReaction,
    loadPrivateHistory: messagesHook.loadPrivateHistory,
    loadRoomHistory: messagesHook.loadRoomHistory,
    createRoom: roomsHook.createRoom,
    deleteRoom: roomsHook.deleteRoom,
    updateRoomMeta: roomsHook.updateRoomMeta,
    pinRoomMessage: roomsHook.pinRoomMessage,
    sendTyping,
    searchMessages: searchHook.searchMessages,
    trackTelemetry: chatService.postTelemetry,
    retryConnection: connectWebSocket,
  };
}

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
import { SecureStore } from '@/src/auth/storage'; // Assuming this exists as per conventions

// Minimal STOMP frame builder/parser ΓÇö inline, no library
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
  const [header, ...bodyParts] = raw.split('\n\n');
  const lines = header.split('\n');
  const command = lines[0];
  const headers: Record<string, string> = {};
  lines.slice(1).forEach(l => {
    const idx = l.indexOf(':');
    if (idx > 0) headers[l.slice(0, idx)] = l.slice(idx + 1);
  });
  return { command, headers, body: bodyParts.join('\n\n').replace(/\0$/, '') };
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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      const token = await SecureStore.getItemAsync('authToken');
      if (!token) {
        setError('Authentication token not found');
        return;
      }

      const base = API_BASE_URL;
      const wsUrl = base.replace(/^http/, 'ws') + '/ws-native';

      try {
        console.info(`[Chat] Connecting to websocket: ${wsUrl}`);
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          console.info('[Chat] WebSocket opened');
          ws.send(buildStompConnect(token));
        };

        ws.onmessage = (e) => {
          try {
            const frame = parseStompFrame(e.data);
            if (frame.command === 'CONNECTED') {
              console.info('[Chat] STOMP CONNECTED');
              setIsSocketConnected(true);
              setError('');
              // Subscribe to channels
              ws.send(buildStompSubscribe('sub-team', `/topic/project.${projectId}`));
              ws.send(buildStompSubscribe('sub-private', `/user/queue/private`));
              ws.send(buildStompSubscribe('sub-typing', `/user/queue/typing`));
              ws.send(buildStompSubscribe('sub-notifications', `/user/queue/notifications`));
            } else if (frame.command === 'MESSAGE') {
              handleSocketMessage(frame);
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
        setError(`Failed to connect to chat server (${wsUrl}): ${err?.message || err}`);
      }
    } catch (err) {
      setError('Failed to connect to chat server');
    }
  }, [projectId]);

  const handleSocketMessage = (frame: any) => {
    const dest = frame.headers.destination;
    const body = JSON.parse(frame.body);

    if (dest.includes('/topic/project.') && !dest.includes('.room.')) {
      // Team message
      messagesHook.addTeamMessage(body);
      unreadHook.setTeamLastMessage(body);
      if (body.sender !== currentUser) {
        unreadHook.setTeamUnseenCount(prev => prev + 1);
      }
    } else if (dest.includes('.room.')) {
      // Room message
      if (body.roomId) {
        messagesHook.addRoomMessage(body.roomId, body);
        unreadHook.setRoomLastMessages(prev => ({ ...prev, [body.roomId]: body }));
        if (body.sender !== currentUser && body.roomId !== selectedRoomId) {
          unreadHook.setRoomUnseenCounts(prev => ({ ...prev, [body.roomId]: (prev[body.roomId] || 0) + 1 }));
        }
      }
    } else if (dest === '/user/queue/private') {
      // Private message
      const partner = body.sender === currentUser ? body.recipient : body.sender;
      if (partner) {
        messagesHook.addPrivateMessage(partner, body);
        unreadHook.setPrivateLastMessages(prev => ({ ...prev, [partner]: body }));
        if (body.sender !== currentUser && partner !== selectedUser) {
          unreadHook.setPrivateUnseenCounts(prev => ({ ...prev, [partner]: (prev[partner] || 0) + 1 }));
        }
      }
    } else if (dest === '/user/queue/typing') {
      presenceHook.handleTypingEvent(body);
    } else if (dest === '/user/queue/notifications') {
      unreadHook.loadSummaries();
    }
  };

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

        await Promise.all([
          messagesHook.loadTeamHistory(),
          unreadHook.loadSummaries(),
          presenceHook.loadPresence(),
        ]);
      } catch (err) {
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
    if (id) {
      setSelectedUser(null);
      messagesHook.loadRoomHistory(id);
      chatService.markRoomRead(projectId, id);
      unreadHook.setRoomUnseenCounts(prev => ({ ...prev, [id]: 0 }));
    }
  };

  const sendMessage = async (content: string, recipient?: string | null) => {
    if (!socketRef.current || !isSocketConnected) return;
    const body = JSON.stringify({ content, recipient, roomId: null });
    socketRef.current.send(buildStompSend(recipient ? '/app/chat.private' : `/app/chat.project.${projectId}`, body));
  };

  const sendRoomMessage = async (content: string, roomId: number) => {
    if (!socketRef.current || !isSocketConnected) return;
    const body = JSON.stringify({ content, roomId });
    socketRef.current.send(buildStompSend(`/app/chat.project.${projectId}.room.${roomId}`, body));
  };

  const sendTyping = (isTyping: boolean) => {
    if (!socketRef.current || !isSocketConnected) return;
    const body = JSON.stringify({
      isTyping,
      roomId: selectedRoomId,
      recipient: selectedUser,
      isPrivate: !!selectedUser
    });
    socketRef.current.send(buildStompSend('/app/chat.typing', body));
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

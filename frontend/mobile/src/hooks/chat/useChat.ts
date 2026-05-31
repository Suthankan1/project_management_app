import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform } from 'react-native';
import * as chatService from '../../services/chatService';
import { API_BASE_URL } from '../../api/axios';
import { ChatMessage, ChatFeatureFlags } from '../../types/chat';
import { useChatRooms } from './useChatRooms';
import { useChatMessages } from './useChatMessages';
import { useChatPresence } from './useChatPresence';
import { useChatReactions } from './useChatReactions';
import { useChatSearch } from './useChatSearch';
import { useChatThreads } from './useChatThreads';
import { useChatUnread } from './useChatUnread';
import { ensureValidToken } from '@/src/auth/storage';

// ── Minimal inline STOMP builder/parser ──────────────────────────────────────

// Builders do NOT include the null-byte terminator — sendStompFrame appends it.
function buildConnect(token: string) {
  return `CONNECT\naccept-version:1.2\nheart-beat:0,0\nAuthorization:Bearer ${token}\n\n`;
}
function buildSubscribe(id: string, dest: string) {
  return `SUBSCRIBE\nid:${id}\ndestination:${dest}\n\n`;
}
function buildSend(dest: string, body: string) {
  return `SEND\ndestination:${dest}\ncontent-type:application/json\n\n${body}`;
}

// On React Native/Android, OkHttp's UTF-8 text-frame encoding can silently drop the
// STOMP null-byte terminator (\0).  Sending as a binary frame (Uint8Array) guarantees
// the 0x00 byte reaches the server exactly.  On web the browser handles it fine.
function sendStompFrame(ws: WebSocket, frame: string) {
  if (Platform.OS === 'web') {
    ws.send(frame + '\0');
  } else {
    const bytes = new TextEncoder().encode(frame + '\0');
    ws.send(bytes as unknown as string); // React Native WebSocket accepts ArrayBufferView
  }
}
function parseFrame(raw: string): { command: string; headers: Record<string, string>; body: string } {
  const s = raw.replace(/\r\n/g, '\n');
  if (!s.trim() || s === '\n') return { command: 'HEARTBEAT', headers: {}, body: '' };
  const div = s.indexOf('\n\n');
  if (div === -1) return { command: s.trim(), headers: {}, body: '' };
  const headerSection = s.slice(0, div);
  const body = s.slice(div + 2).replace(/\0$/, '');
  const lines = headerSection.split('\n');
  const command = lines[0].trim();
  const headers: Record<string, string> = {};
  lines.slice(1).forEach(l => {
    const idx = l.indexOf(':');
    if (idx > 0) headers[l.slice(0, idx).trim()] = l.slice(idx + 1).trim();
  });
  return { command, headers, body };
}

function dmKey(username: string): string {
  return username.trim().toLowerCase();
}

function addUniqueUserByKey(prev: string[], username: string) {
  const key = dmKey(username);
  if (!key || prev.some(u => dmKey(u) === key)) return prev;
  return [...prev, username];
}

function uniqueUsersByKey(usernames: string[]) {
  return usernames.reduce<string[]>((acc, username) => addUniqueUserByKey(acc, username), []);
}

// ─────────────────────────────────────────────────────────────────────────────

export function useChat(projectId: string) {
  const [currentUser, setCurrentUser] = useState('');
  const [currentUserAliases, setCurrentUserAliases] = useState<string[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [userProfilePics] = useState<Record<string, string>>({});
  const [featureFlags, setFeatureFlags] = useState<ChatFeatureFlags>({
    phaseDEnabled: false, phaseEEnabled: false,
    webhooksEnabled: false, telemetryEnabled: false,
  });
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [error, setError] = useState('');

  // Refs so socket handlers always read fresh values without stale closures
  const currentUserRef = useRef('');
  const selectedUserRef = useRef<string | null>(null);
  const usersRef = useRef<string[]>([]);
  const selectedRoomIdRef = useRef<number | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptRef = useRef(0);
  const isConnectingRef = useRef(false);
  // Track which rooms we've subscribed to already
  const subscribedRoomsRef = useRef<Set<number>>(new Set());

  const roomsHook     = useChatRooms(projectId);
  const messagesHook  = useChatMessages(projectId);
  const presenceHook  = useChatPresence(projectId);
  const reactionsHook = useChatReactions(projectId);
  const searchHook    = useChatSearch(projectId);
  const threadsHook   = useChatThreads(projectId);
  const unreadHook    = useChatUnread(projectId);

  const { selectedRoomId, selectRoom, rooms } = roomsHook;

  // Keep refs in sync
  useEffect(() => { selectedUserRef.current = selectedUser; }, [selectedUser]);
  useEffect(() => { usersRef.current = users; }, [users]);
  useEffect(() => { selectedRoomIdRef.current = selectedRoomId; }, [selectedRoomId]);

  // ── Subscribe to a single room's message + typing channels ──────────────────
  const subscribeRoom = useCallback((ws: WebSocket, roomId: number) => {
    if (subscribedRoomsRef.current.has(roomId)) return;
    subscribedRoomsRef.current.add(roomId);
    sendStompFrame(ws, buildSubscribe(`sub-room-${roomId}`, `/topic/project/${projectId}/room/${roomId}`));
    sendStompFrame(ws, buildSubscribe(`sub-room-typing-${roomId}`, `/topic/project/${projectId}/typing/room/${roomId}`));
  }, [projectId]);

  // ── Handle incoming STOMP MESSAGE frames ─────────────────────────────────────
  const handleMessage = useCallback((frame: ReturnType<typeof parseFrame>) => {
    if (!frame.body) return;
    let body: any;
    try { body = JSON.parse(frame.body); } catch { return; }
    const dest = frame.headers.destination || '';
    const me = currentUserRef.current.toLowerCase();

    // ── Team / public channel ─────────────────────────────────────────────────
    if (dest === `/topic/project/${projectId}/public`) {
      if (body.type === 'JOIN') {
        if (body.sender !== me) {
          setUsers(prev => addUniqueUserByKey(prev, body.sender));
        }
        return;
      }
      if (!body.roomId && !body.recipient && !body.parentMessageId) {
        messagesHook.addTeamMessage(body);
        unreadHook.setTeamLastMessage(body);
        if (body.sender?.toLowerCase() !== me && (selectedRoomIdRef.current !== null || selectedUserRef.current !== null)) {
          unreadHook.setTeamUnseenCount(prev => prev + 1);
        }
      }
      return;
    }

    // ── Private / DM channel ─────────────────────────────────────────────────
    if (dest === `/user/queue/project/${projectId}/messages`) {
      const sender = (body.sender || '').toLowerCase();
      const recipient = (body.recipient || '').toLowerCase();
      const isFromMe = sender === me;
      const partner = isFromMe ? recipient : sender;
      const partnerDisplay = isFromMe ? body.recipient : body.sender;
      if (!partner || body.parentMessageId) return;
      messagesHook.addPrivateMessage(partner, body);
      unreadHook.setPrivateLastMessages(prev => ({ ...prev, [partner]: body }));
      if (!isFromMe && selectedUserRef.current?.toLowerCase() !== partner) {
        unreadHook.setPrivateUnseenCounts(prev => ({ ...prev, [partner]: (prev[partner] || 0) + 1 }));
      }
      setUsers(prev => addUniqueUserByKey(prev, partnerDisplay || partner));
      return;
    }

    // ── Room message ──────────────────────────────────────────────────────────
    const roomMsgMatch = dest.match(new RegExp(`/topic/project/${projectId}/room/(\\d+)$`));
    if (roomMsgMatch) {
      const roomId = Number(roomMsgMatch[1]);
      if (!body.parentMessageId) {
        messagesHook.addRoomMessage(roomId, body);
        unreadHook.setRoomLastMessages(prev => ({ ...prev, [roomId]: body }));
        if (body.sender?.toLowerCase() !== me && selectedRoomIdRef.current !== roomId) {
          unreadHook.setRoomUnseenCounts(prev => ({ ...prev, [roomId]: (prev[roomId] || 0) + 1 }));
        }
      }
      return;
    }

    // ── Team typing ───────────────────────────────────────────────────────────
    if (dest === `/topic/project/${projectId}/typing/team`) {
      presenceHook.handleTypingEvent({ username: body.sender, isTyping: body.isTyping ?? body.typing });
      return;
    }

    // ── Private typing ────────────────────────────────────────────────────────
    if (dest === `/user/queue/project/${projectId}/typing/private`) {
      presenceHook.handleTypingEvent({ username: body.sender, isTyping: body.isTyping ?? body.typing, isPrivate: true });
      return;
    }

    // ── Room typing ───────────────────────────────────────────────────────────
    const roomTypingMatch = dest.match(new RegExp(`/topic/project/${projectId}/typing/room/(\\d+)$`));
    if (roomTypingMatch) {
      const roomId = Number(roomTypingMatch[1]);
      presenceHook.handleTypingEvent({ username: body.sender, roomId, isTyping: body.isTyping ?? body.typing });
      return;
    }

    // ── Unread badge update ───────────────────────────────────────────────────
    if (dest === `/user/queue/project/${projectId}/unread-badge`) {
      unreadHook.loadSummaries();
      return;
    }

    // ── Thread reply ──────────────────────────────────────────────────────────
    const threadMatch = dest.match(new RegExp(`/topic/project/${projectId}/thread/(\\d+)$`));
    if (threadMatch) {
      threadsHook.setThreadMessages(prev => [...prev, body]);
      return;
    }

    // ── Reaction update ───────────────────────────────────────────────────────
    const reactionMatch = dest.match(new RegExp(`/topic/project/${projectId}/messages/(\\d+)/reactions$`));
    if (reactionMatch) {
      const msgId = Number(reactionMatch[1]);
      reactionsHook.setMessageReactions(prev => ({ ...prev, [msgId]: body }));
      return;
    }

    // ── Presence ──────────────────────────────────────────────────────────────
    if (dest === `/topic/project/${projectId}/presence`) {
      presenceHook.handlePresenceEvent(body);
      return;
    }
  }, [projectId, messagesHook, presenceHook, reactionsHook, threadsHook, unreadHook]);

  // ── Connect WebSocket ─────────────────────────────────────────────────────
  const connectWebSocket = useCallback(async () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    if (isConnectingRef.current) return;
    isConnectingRef.current = true;

    const scheduleReconnect = (delayOverride?: number) => {
      if (reconnectRef.current) return;
      const delay = delayOverride ?? Math.min(30000, Math.pow(2, reconnectAttemptRef.current) * 1000);
      reconnectAttemptRef.current += 1;
      reconnectRef.current = setTimeout(() => {
        reconnectRef.current = null;
        connectWebSocket();
      }, delay);
    };

    try {
      const token = await ensureValidToken();
      if (!token) {
        setError('Not authenticated');
        isConnectingRef.current = false;
        scheduleReconnect();
        return;
      }

      const base = API_BASE_URL.replace(/\/api$/, '');
      const wsUrl = base.replace(/^https?/, 'ws') + '/ws-native';

      console.info('[Chat] Connecting:', wsUrl);
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        if (socketRef.current !== ws) { ws.close(); return; }
        isConnectingRef.current = false;
        console.info('[Chat] WS open — sending STOMP CONNECT');
        sendStompFrame(ws, buildConnect(token));
      };

      ws.onmessage = async (e) => {
        if (socketRef.current !== ws) return;
        try {
          let raw = e.data;
          if (typeof raw !== 'string') {
            raw = await new Promise<string>(res => {
              const fr = new FileReader();
              fr.onload = () => res(fr.result as string);
              fr.readAsText(raw);
            });
          }
          const frame = parseFrame(raw);
          if (frame.command === 'CONNECTED') {
            console.info('[Chat] STOMP CONNECTED');
            reconnectAttemptRef.current = 0;
            setIsSocketConnected(true);
            setError('');
            subscribedRoomsRef.current.clear();

            // Core subscriptions
            sendStompFrame(ws, buildSubscribe('sub-public', `/topic/project/${projectId}/public`));
            sendStompFrame(ws, buildSubscribe('sub-private', `/user/queue/project/${projectId}/messages`));
            sendStompFrame(ws, buildSubscribe('sub-typing-team', `/topic/project/${projectId}/typing/team`));
            sendStompFrame(ws, buildSubscribe('sub-typing-private', `/user/queue/project/${projectId}/typing/private`));
            sendStompFrame(ws, buildSubscribe('sub-unread', `/user/queue/project/${projectId}/unread-badge`));
            sendStompFrame(ws, buildSubscribe('sub-presence', `/topic/project/${projectId}/presence`));
            sendStompFrame(ws, buildSubscribe('sub-rooms-events', `/topic/project/${projectId}/rooms`));
            sendStompFrame(ws, buildSubscribe('sub-message-reactions', `/topic/project/${projectId}/messages/*/reactions`));

            // Subscribe to all already-loaded rooms
            roomsHook.rooms.forEach(r => subscribeRoom(ws, r.id));

            // Send presence ping
            sendStompFrame(ws, buildSend(`/app/project/${projectId}/presence.ping`, '{}'));
          } else if (frame.command === 'MESSAGE') {
            handleMessage(frame);
          } else if (frame.command === 'ERROR') {
            console.error('[Chat] STOMP ERROR', frame.body);
            const normalizedBody = (frame.body || '').toLowerCase();
            const isAuthError = normalizedBody.includes('jwt')
              || normalizedBody.includes('auth')
              || normalizedBody.includes('token')
              || normalizedBody.includes('expired')
              || normalizedBody.includes('invalid');

            if (isAuthError) {
              const refreshedToken = await ensureValidToken();
              if (!refreshedToken) {
                setError('Your session expired. Please sign in again.');
              }
              try {
                ws.close(4001, 'jwt-expired');
              } catch {
                setIsSocketConnected(false);
                socketRef.current = null;
                isConnectingRef.current = false;
                scheduleReconnect(500);
              }
              return;
            }

            setError('Chat server error. Please reconnect.');
          }
        } catch (err) {
          console.error('[Chat] frame parse error', err);
        }
      };

      ws.onclose = (event) => {
        if (socketRef.current !== ws) return;
        console.warn(`[Chat] WS closed — code: ${event.code}, reason: "${event.reason || '(none)'}"`);
        setIsSocketConnected(false);
        socketRef.current = null;
        isConnectingRef.current = false;

        const closeReason = `${event.reason || ''}`.toLowerCase();
        const isAuthClose = closeReason.includes('jwt')
          || closeReason.includes('auth')
          || closeReason.includes('token')
          || closeReason.includes('expired')
          || closeReason.includes('invalid');

        if (!reconnectRef.current) {
          const delay = isAuthClose ? 500 : undefined;
          scheduleReconnect(delay);
        }
      };

      ws.onerror = () => {
        if (socketRef.current !== ws) return;
        if (__DEV__) {
          console.info('[Chat] WS connection error; reconnect will be attempted');
        }
        setError('Connection error. Retrying...');
        isConnectingRef.current = false;
        try {
          ws.close();
        } catch {
          socketRef.current = null;
        }
      };
    } catch (err) {
      console.error('[Chat] connect failed', err);
      setError('Failed to connect to chat server');
      isConnectingRef.current = false;
      scheduleReconnect();
    }
  }, [projectId, handleMessage, subscribeRoom, roomsHook.rooms]);

  // ── Subscribe to new rooms when they are loaded/created ───────────────────
  useEffect(() => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    rooms.forEach(r => subscribeRoom(ws, r.id));
  }, [rooms, subscribeRoom]);

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      setIsLoading(true);
      try {
        const [user, members, roomsData, flags] = await Promise.all([
          chatService.fetchCurrentUser(),
          chatService.fetchProjectUsers(projectId),
          chatService.fetchRooms(projectId),
          chatService.fetchFeatureFlags(projectId),
        ]);
        if (cancelled) return;

        currentUserRef.current = user.username.toLowerCase();
        setCurrentUser(user.username);
        setCurrentUserAliases(user.aliases || []);
        setUsers(uniqueUsersByKey(members));
        setFeatureFlags(flags);
        roomsHook.setRooms(roomsData);

        await Promise.all([
          messagesHook.loadTeamHistory(),
          unreadHook.loadSummaries(),
          presenceHook.loadPresence(),
        ]);
      } catch (err) {
        console.error('[Chat] init failed', err);
        if (!cancelled) setError('Failed to initialize chat');
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          // Connect after HTTP init so any token refresh has already completed.
          connectWebSocket();
        }
      }
    };

    init();

    return () => {
      cancelled = true;
      isConnectingRef.current = false;
      reconnectAttemptRef.current = 0;
      const dying = socketRef.current;
      socketRef.current = null;
      dying?.close();
      if (reconnectRef.current) { clearTimeout(reconnectRef.current); reconnectRef.current = null; }
    };
  // The initialization lifecycle is intentionally keyed to project changes only.
  // The hook modules expose stable operational callbacks for this flow.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  // ── Send helpers ──────────────────────────────────────────────────────────
  const stompSend = useCallback((dest: string, body: string) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      setError('Not connected. Please wait…');
      return;
    }
    sendStompFrame(ws, buildSend(dest, body));
  }, []);

  const sendMessage = useCallback((content: string, recipient?: string | null) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const localId = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    if (recipient) {
      const msg: ChatMessage = {
        localId, sender: currentUserRef.current, content: trimmed,
        recipient, type: 'CHAT', formatType: 'PLAIN',
        timestamp: new Date().toISOString(),
      };
      stompSend(`/app/project/${projectId}/chat.sendPrivateMessage`, JSON.stringify(msg));
      // Optimistic update
      messagesHook.addPrivateMessage(recipient, msg);
      unreadHook.setPrivateLastMessages(prev => ({ ...prev, [dmKey(recipient)]: msg }));
    } else {
      const msg: ChatMessage = {
        localId, sender: currentUserRef.current, content: trimmed,
        type: 'CHAT', formatType: 'PLAIN',
        timestamp: new Date().toISOString(),
      };
      stompSend(`/app/project/${projectId}/chat.sendMessage`, JSON.stringify(msg));
      messagesHook.addTeamMessage(msg);
    }
  }, [projectId, stompSend, messagesHook, unreadHook]);

  const sendRoomMessage = useCallback((content: string, roomId: number) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const localId = `loc-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const msg: ChatMessage = {
      localId, sender: currentUserRef.current, content: trimmed,
      roomId, type: 'CHAT', formatType: 'PLAIN',
      timestamp: new Date().toISOString(),
    };
    stompSend(`/app/project/${projectId}/room/${roomId}/send`, JSON.stringify(msg));
    messagesHook.addRoomMessage(roomId, msg);
  }, [projectId, stompSend, messagesHook]);

  const sendTyping = useCallback((isTyping: boolean) => {
    const body = JSON.stringify({
      isTyping,
      scope: selectedRoomIdRef.current !== null ? 'ROOM' : selectedUserRef.current ? 'PRIVATE' : 'TEAM',
      roomId: selectedRoomIdRef.current ?? undefined,
      recipient: selectedUserRef.current ?? undefined,
    });
    stompSend(`/app/project/${projectId}/typing`, body);
  }, [projectId, stompSend]);

  const toggleReaction = useCallback((messageId: number, emoji: string) => {
    const ws = socketRef.current;
    const canUseStomp = isSocketConnected && ws?.readyState === WebSocket.OPEN;
    return reactionsHook.toggleReaction(messageId, emoji, canUseStomp ? stompSend : undefined);
  }, [isSocketConnected, reactionsHook, stompSend]);

  // ── Selection actions ─────────────────────────────────────────────────────
  const selectPrivateUser = useCallback((user: string | null) => {
    const displayUser = user ? usersRef.current.find(u => dmKey(u) === dmKey(user)) || user : null;
    setSelectedUser(displayUser);
    if (displayUser) {
      selectRoom(null);
      messagesHook.loadPrivateHistory(displayUser);
      chatService.markPrivateRead(projectId, displayUser).catch(() => {});
      unreadHook.setPrivateUnseenCounts(prev => ({ ...prev, [dmKey(displayUser)]: 0 }));
    }
  }, [projectId, selectRoom, messagesHook, unreadHook]);

  const handleSelectRoom = useCallback((id: number | null) => {
    selectRoom(id);
    if (id !== null) {
      setSelectedUser(null);
      messagesHook.loadRoomHistory(id);
      chatService.markRoomRead(projectId, id).catch(() => {});
      unreadHook.setRoomUnseenCounts(prev => ({ ...prev, [id]: 0 }));
      // Subscribe if we have an open socket
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        subscribeRoom(socketRef.current, id);
      }
    }
  }, [projectId, selectRoom, messagesHook, unreadHook, subscribeRoom]);

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
    isLoading, isSocketConnected, error,
    selectPrivateUser,
    selectRoom: handleSelectRoom,
    sendMessage, sendRoomMessage,
    sendThreadReply: threadsHook.sendThreadReply,
    openThread: threadsHook.openThread,
    closeThread: threadsHook.closeThread,
    editMessage: messagesHook.editMessage,
    deleteMessage: messagesHook.deleteMessage,
    toggleReaction,
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

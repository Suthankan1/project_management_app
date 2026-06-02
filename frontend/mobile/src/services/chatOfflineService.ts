import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChatFeatureFlags, ChatMessage, ChatRoom } from '../types/chat';
import { sendRestMessage, sendRoomRestMessage } from './chatService';

type ChatScope =
  | { type: 'TEAM' }
  | { type: 'PRIVATE'; recipient: string }
  | { type: 'ROOM'; roomId: number };

export interface CachedChatSnapshot {
  projectId: string;
  cachedAt: number;
  currentUser?: string;
  currentUserAliases?: string[];
  users?: string[];
  rooms?: ChatRoom[];
  featureFlags?: ChatFeatureFlags;
  teamMessages: ChatMessage[];
  roomMessages: Record<number, ChatMessage[]>;
  privateMessages: Record<string, ChatMessage[]>;
}

export interface QueuedChatMessage {
  id: string;
  projectId: string;
  localId: string;
  scope: ChatScope;
  content: string;
  sender: string;
  createdAt: string;
  baseLastMessageId?: number | null;
  status: 'pending' | 'syncing' | 'failed';
  error?: string;
  serverChangedWhileOffline?: boolean;
}

export type ChatOfflineEvent =
  | { type: 'QUEUE_CHANGED'; projectId: string; queue: QueuedChatMessage[] }
  | { type: 'MESSAGE_SYNCED'; projectId: string; localId: string; message: ChatMessage; serverChangedWhileOffline: boolean; queueItem: QueuedChatMessage; latestMessages: ChatMessage[] }
  | { type: 'MESSAGE_FAILED'; projectId: string; localId: string; error: string; queueItem: QueuedChatMessage }
  | { type: 'SYNC_COMPLETED'; projectId: string };

type Listener = (event: ChatOfflineEvent) => void;
type LatestMessageLoader = (item: QueuedChatMessage) => Promise<ChatMessage[]>;

const CACHE_PREFIX = 'chat_cache_v1:';
const QUEUE_KEY = 'chat_outbox_queue_v1';
const MAX_CACHED_MESSAGES_PER_CONVERSATION = 80;

let queue: QueuedChatMessage[] = [];
let loaded = false;
let isSyncing = false;
const listeners: Set<Listener> = new Set();

function dmKey(username: string): string {
  return username.trim().toLowerCase();
}

function cacheKey(projectId: string) {
  return `${CACHE_PREFIX}${projectId}`;
}

function sortRecent(messages: ChatMessage[]): ChatMessage[] {
  return [...messages]
    .sort((a, b) => {
      const aTime = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const bTime = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, MAX_CACHED_MESSAGES_PER_CONVERSATION);
}

function emit(event: ChatOfflineEvent) {
  listeners.forEach((listener) => {
    try {
      listener(event);
    } catch (err) {
      console.error('Error in chatOfflineService listener callback', err);
    }
  });
}

async function ensureLoaded() {
  if (loaded) return;
  try {
    const data = await AsyncStorage.getItem(QUEUE_KEY);
    queue = data ? JSON.parse(data) : [];
  } catch (err) {
    console.error('Failed to load chat outbox queue', err);
    queue = [];
  } finally {
    loaded = true;
  }
}

async function saveQueue(projectId?: string) {
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  const projectIds = projectId ? [projectId] : Array.from(new Set(queue.map(item => item.projectId)));
  projectIds.forEach((id) => {
    emit({ type: 'QUEUE_CHANGED', projectId: id, queue: getProjectQueueSync(id) });
  });
}

function getProjectQueueSync(projectId: string) {
  return queue.filter(item => item.projectId === projectId);
}

function mergeMessage(messages: ChatMessage[], incoming: ChatMessage): ChatMessage[] {
  if (incoming.localId) {
    const index = messages.findIndex(message => message.localId === incoming.localId);
    if (index !== -1) {
      const next = [...messages];
      next[index] = { ...next[index], ...incoming };
      return sortRecent(next);
    }
  }
  if (incoming.id && messages.some(message => message.id === incoming.id)) {
    return sortRecent(messages);
  }
  return sortRecent([incoming, ...messages]);
}

async function updateCachedMessage(projectId: string, localId: string, patch: Partial<ChatMessage>) {
  const snapshot = await loadCachedChat(projectId);
  if (!snapshot) return;

  const patcher = (message: ChatMessage) => (
    message.localId === localId ? { ...message, ...patch } : message
  );

  await cacheChatSnapshot({
    ...snapshot,
    teamMessages: snapshot.teamMessages.map(patcher),
    roomMessages: Object.fromEntries(
      Object.entries(snapshot.roomMessages).map(([roomId, messages]) => [roomId, messages.map(patcher)]),
    ),
    privateMessages: Object.fromEntries(
      Object.entries(snapshot.privateMessages).map(([partner, messages]) => [partner, messages.map(patcher)]),
    ),
  });
}

async function addCachedMessage(projectId: string, scope: ChatScope, message: ChatMessage) {
  const existing = await loadCachedChat(projectId);
  const snapshot: CachedChatSnapshot = existing || {
    projectId,
    cachedAt: Date.now(),
    teamMessages: [],
    roomMessages: {},
    privateMessages: {},
  };

  if (scope.type === 'ROOM') {
    snapshot.roomMessages[scope.roomId] = mergeMessage(snapshot.roomMessages[scope.roomId] || [], message);
  } else if (scope.type === 'PRIVATE') {
    const key = dmKey(scope.recipient);
    snapshot.privateMessages[key] = mergeMessage(snapshot.privateMessages[key] || [], message);
  } else {
    snapshot.teamMessages = mergeMessage(snapshot.teamMessages, message);
  }

  await cacheChatSnapshot(snapshot);
}

export async function loadCachedChat(projectId: string): Promise<CachedChatSnapshot | null> {
  try {
    const data = await AsyncStorage.getItem(cacheKey(projectId));
    return data ? JSON.parse(data) : null;
  } catch (err) {
    console.error('Failed to load cached chat messages', err);
    return null;
  }
}

export async function cacheChatSnapshot(snapshot: CachedChatSnapshot): Promise<void> {
  const existing = await loadCachedChat(snapshot.projectId);
  const normalized: CachedChatSnapshot = {
    ...existing,
    ...snapshot,
    cachedAt: Date.now(),
    teamMessages: sortRecent(snapshot.teamMessages),
    roomMessages: Object.fromEntries(
      Object.entries(snapshot.roomMessages).map(([roomId, messages]) => [roomId, sortRecent(messages)]),
    ),
    privateMessages: Object.fromEntries(
      Object.entries(snapshot.privateMessages).map(([partner, messages]) => [dmKey(partner), sortRecent(messages)]),
    ),
  };

  await AsyncStorage.setItem(cacheKey(snapshot.projectId), JSON.stringify(normalized));
}

export async function getProjectQueue(projectId: string): Promise<QueuedChatMessage[]> {
  await ensureLoaded();
  return getProjectQueueSync(projectId);
}

export function addChatOfflineListener(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function enqueueChatMessage(
  item: Omit<QueuedChatMessage, 'id' | 'status'>,
): Promise<QueuedChatMessage> {
  await ensureLoaded();
  const queued: QueuedChatMessage = {
    ...item,
    id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`,
    status: 'pending',
  };

  queue.push(queued);
  await saveQueue(item.projectId);
  await addCachedMessage(item.projectId, item.scope, {
    localId: item.localId,
    sender: item.sender,
    content: item.content,
    recipient: item.scope.type === 'PRIVATE' ? item.scope.recipient : undefined,
    roomId: item.scope.type === 'ROOM' ? item.scope.roomId : undefined,
    chatType: item.scope.type,
    type: 'CHAT',
    formatType: 'PLAIN',
    timestamp: item.createdAt,
    syncStatus: 'pending',
    offlineQueued: true,
  });
  return queued;
}

export async function syncQueuedChatMessages(
  projectId: string,
  loadLatestMessages: LatestMessageLoader,
) {
  await ensureLoaded();
  if (isSyncing) return;

  const nextItem = queue.find(item => item.projectId === projectId && item.status === 'pending');
  if (!nextItem) {
    emit({ type: 'SYNC_COMPLETED', projectId });
    return;
  }

  isSyncing = true;
  nextItem.status = 'syncing';
  nextItem.error = undefined;
  await saveQueue(projectId);
  await updateCachedMessage(projectId, nextItem.localId, { syncStatus: 'syncing', failureReason: undefined });

  try {
    const latestMessages = await loadLatestMessages(nextItem);
    const latestServerMessage = latestMessages.find(message => !!message.id);
    const serverChangedWhileOffline = Boolean(
      nextItem.baseLastMessageId &&
      latestServerMessage?.id &&
      latestServerMessage.id !== nextItem.baseLastMessageId,
    );

    const synced = nextItem.scope.type === 'PRIVATE'
      ? await sendRestMessage(projectId, nextItem.content, nextItem.scope.recipient, nextItem.localId)
      : nextItem.scope.type === 'ROOM'
        ? await sendRoomRestMessage(projectId, nextItem.scope.roomId, nextItem.content, nextItem.localId)
        : await sendRestMessage(projectId, nextItem.content, undefined, nextItem.localId);

    const syncedMessage: ChatMessage = {
      ...synced,
      localId: nextItem.localId,
      syncStatus: 'sent',
      offlineQueued: false,
    };

    queue = queue.filter(item => item.id !== nextItem.id);
    await saveQueue(projectId);
    await addCachedMessage(projectId, nextItem.scope, syncedMessage);
    emit({
      type: 'MESSAGE_SYNCED',
      projectId,
      localId: nextItem.localId,
      message: syncedMessage,
      serverChangedWhileOffline,
      queueItem: nextItem,
      latestMessages,
    });
  } catch (err: any) {
    if (!err.response || err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      nextItem.status = 'pending';
      await updateCachedMessage(projectId, nextItem.localId, { syncStatus: 'pending' });
    } else {
      nextItem.status = 'failed';
      nextItem.error = err.response?.status === 409
        ? 'Conflict: server chat state changed while offline'
        : err.response?.data?.message || 'Failed to send queued message';
      await updateCachedMessage(projectId, nextItem.localId, {
        syncStatus: 'failed',
        failureReason: nextItem.error,
      });
      emit({
        type: 'MESSAGE_FAILED',
        projectId,
        localId: nextItem.localId,
        error: nextItem.error || 'Failed to send queued message',
        queueItem: nextItem,
      });
    }
    await saveQueue(projectId);
  } finally {
    isSyncing = false;
    if (queue.some(item => item.projectId === projectId && item.status === 'pending')) {
      void syncQueuedChatMessages(projectId, loadLatestMessages);
    }
  }
}

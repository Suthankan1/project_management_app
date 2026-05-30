import { chatApi, authApi } from './api-contract';
import type {
  ChatFeatureFlags,
  ChatMessage,
  ChatReactionSummary,
  ChatRoom,
  ChatSearchResult,
  PresenceResponse,
  UnreadBadgeSummary,
} from '@/app/(project)/project/[id]/chat/components/chat';
import type { ChatSummaries, ChatInboxResponse, AuthUserSummary, ChatInboxActivity, ChatInboxProjectGroup } from './api-contract';

export type { ChatSummaries, ChatInboxResponse, AuthUserSummary, ChatInboxActivity, ChatInboxProjectGroup };
export type InboxChatType = 'TEAM' | 'ROOM' | 'DIRECT';

// ── Team / General ──

export async function markTeamAsRead(projectId: string): Promise<void> {
  return chatApi.markTeamRead(projectId);
}

export async function markRoomAsRead(projectId: string, roomId: number): Promise<void> {
  return chatApi.markRoomRead(projectId, roomId);
}

export async function markDirectConversationAsRead(projectId: string, withUser: string): Promise<void> {
  return chatApi.markDirectRead(projectId, withUser);
}

export async function fetchPresence(projectId: string): Promise<PresenceResponse> {
  return chatApi.getPresence(projectId);
}

export async function postTelemetry(
  projectId: string,
  action: string,
  target: string,
  details?: string,
): Promise<void> {
  return chatApi.postTelemetry(projectId, { action, target, details });
}

export async function fetchFeatureFlags(projectId: string): Promise<ChatFeatureFlags> {
  return chatApi.getFeatureFlags(projectId);
}

export async function fetchUnreadBadge(projectId: string): Promise<UnreadBadgeSummary> {
  return chatApi.getUnreadBadge(projectId);
}

// ── Search ──

export async function searchChatMessages(
  projectId: string,
  query: string,
): Promise<ChatSearchResult[]> {
  return chatApi.searchMessages(projectId, query);
}

// ── Members / Users ──

export async function fetchChatMembers(projectId: string): Promise<string[]> {
  return chatApi.getMembers(projectId);
}

export async function fetchAllUserProfiles(): Promise<AuthUserSummary[]> {
  return authApi.getAllUsers();
}

export async function fetchCurrentUser(): Promise<{ username: string }> {
  return authApi.getCurrentUser();
}

// ── Summaries ──

export async function fetchChatSummaries(projectId: string): Promise<ChatSummaries> {
  return chatApi.getSummaries(projectId);
}

export async function fetchChatInbox(params?: {
  projectLimit?: number;
  activityLimit?: number;
  status?: 'all' | 'unread';
}): Promise<ChatInboxResponse> {
  return chatApi.getInbox(params);
}

// ── Messages ──

export async function fetchTeamMessages(projectId: string): Promise<ChatMessage[]> {
  return chatApi.getTeamMessages(projectId);
}

export async function fetchRoomMessages(
  projectId: string,
  roomId: number,
): Promise<ChatMessage[]> {
  return chatApi.getRoomMessages(projectId, roomId);
}

export async function fetchPrivateMessages(
  projectId: string,
  currentUser: string,
  withUser: string,
): Promise<ChatMessage[]> {
  return chatApi.getPrivateMessages(projectId, currentUser, withUser);
}

export async function editMessageRest(
  projectId: string,
  messageId: number,
  content: string,
): Promise<ChatMessage> {
  return chatApi.editMessage(projectId, messageId, content);
}

export async function deleteMessageRest(
  projectId: string,
  messageId: number,
): Promise<ChatMessage> {
  return chatApi.deleteMessage(projectId, messageId);
}

// ── Threads ──

export async function fetchThreadMessages(
  projectId: string,
  parentMessageId: number,
): Promise<ChatMessage[]> {
  return chatApi.getThreadMessages(projectId, parentMessageId);
}

export async function postThreadReply(
  projectId: string,
  parentMessageId: number,
  content: string,
): Promise<ChatMessage> {
  return chatApi.postThreadReply(projectId, parentMessageId, content);
}

// ── Reactions ──

export async function fetchMessageReactions(
  projectId: string,
  messageId: number,
): Promise<ChatReactionSummary[]> {
  return chatApi.getMessageReactions(projectId, messageId);
}

export async function toggleReactionRest(
  projectId: string,
  messageId: number,
  emoji: string,
): Promise<ChatReactionSummary[]> {
  return chatApi.toggleReaction(projectId, messageId, emoji);
}

// ── Rooms ──

export async function fetchRooms(projectId: string): Promise<ChatRoom[]> {
  return chatApi.getRooms(projectId);
}

export async function createRoomRest(
  projectId: string,
  name: string,
  members: string[],
): Promise<ChatRoom> {
  return chatApi.createRoom(projectId, { name, members });
}

export async function deleteRoomRest(
  projectId: string,
  roomId: number,
): Promise<void> {
  return chatApi.deleteRoom(projectId, roomId);
}

export async function updateRoomMetaRest(
  projectId: string,
  roomId: number,
  updates: { name?: string; topic?: string; description?: string },
): Promise<ChatRoom> {
  return chatApi.updateRoomMeta(projectId, roomId, updates);
}

export async function pinRoomMessageRest(
  projectId: string,
  roomId: number,
  messageId: number | null,
): Promise<ChatRoom> {
  return chatApi.pinRoomMessage(projectId, roomId, messageId);
}

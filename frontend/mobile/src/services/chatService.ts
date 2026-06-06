import api from '@/src/api/axios';
import {
  postTelemetry as postTelemetryBuilder,
  createRoom as createRoomBuilder,
  createChatMessage as createChatMessageBuilder,
} from '@planora/contracts';
import {
  ChatMessage,
  ChatReactionSummary,
  ChatRoom,
  ChatFeatureFlags,
  ChatSearchResult,
  DirectChatSummary,
  RoomChatSummary,
  TeamChatSummary,
  UnreadBadgeSummary,
  PresenceResponse,
} from '../types/chat';

export async function fetchCurrentUser(): Promise<{ username: string; email: string; aliases?: string[] }> {
  const { data } = await api.get('/api/user/me');
  return data;
}

export async function fetchProjectUsers(projectId: string): Promise<string[]> {
  const { data } = await api.get(`/api/projects/${projectId}/chat/members`);
  return data;
}

export async function fetchUserProfilePics(projectId: string): Promise<Record<string, string>> {
  // Mock or actual implementation if backend supports it
  // For now, returning empty record as placeholders
  return {};
}

export async function fetchTeamMessages(projectId: string): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(`/api/projects/${projectId}/chat/messages`);
  return data;
}

export async function fetchPrivateHistory(projectId: string, partner: string): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(`/api/projects/${projectId}/chat/messages`, {
    params: { with: partner },
  });
  return data;
}

export async function fetchRoomHistory(projectId: string, roomId: number): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(`/api/projects/${projectId}/chat/messages`, {
    params: { roomId },
  });
  return data;
}

export async function fetchRooms(projectId: string): Promise<ChatRoom[]> {
  const { data } = await api.get<ChatRoom[]>(`/api/projects/${projectId}/chat/rooms`);
  return data;
}

export async function fetchFeatureFlags(projectId: string): Promise<ChatFeatureFlags> {
  const { data } = await api.get<ChatFeatureFlags>(`/api/projects/${projectId}/chat/features`);
  return data;
}

export async function fetchChatSummaries(projectId: string): Promise<{
  directSummaries: DirectChatSummary[];
  roomSummaries: RoomChatSummary[];
  teamSummary: TeamChatSummary | null;
}> {
  const { data } = await api.get(`/api/projects/${projectId}/chat/summaries`);
  return {
    directSummaries: data.directSummaries || [],
    roomSummaries: data.roomSummaries || [],
    teamSummary: data.teamSummary || null,
  };
}

export async function fetchUnreadBadge(projectId: string): Promise<UnreadBadgeSummary> {
  const { data } = await api.get<UnreadBadgeSummary>(`/api/projects/${projectId}/chat/unread-badge`);
  return data;
}

export async function fetchPresence(projectId: string): Promise<PresenceResponse> {
  const { data } = await api.get<PresenceResponse>(`/api/projects/${projectId}/chat/presence`);
  return data;
}

export async function fetchReactions(messageIds: number[]): Promise<Record<number, ChatReactionSummary[]>> {
  // Batch fetching reactions if supported, else individual
  // For simplicity and matching web pattern:
  const reactions: Record<number, ChatReactionSummary[]> = {};
  // This might be inefficient if many messages, but following the service contract
  return reactions;
}

export async function fetchThreadMessages(parentMessageId: number, projectId: string): Promise<ChatMessage[]> {
  const { data } = await api.get<ChatMessage[]>(`/api/projects/${projectId}/chat/messages/${parentMessageId}/thread`);
  return data;
}

export async function searchMessages(projectId: string, query: string): Promise<ChatSearchResult[]> {
  const { data } = await api.get<{ messages: ChatSearchResult[] }>(`/api/search`, {
    params: { q: query, projectId },
  });
  return data.messages || [];
}

export async function sendRestMessage(
  projectId: string,
  content: string,
  recipient?: string,
  localId?: string,
): Promise<ChatMessage> {
  const { data } = await createChatMessageBuilder(api, projectId, {
    content,
    recipient,
    localId,
    formatType: 'PLAIN',
  });
  return data;
}

export async function sendRoomRestMessage(
  projectId: string,
  roomId: number,
  content: string,
  localId?: string,
): Promise<ChatMessage> {
  const { data } = await createChatMessageBuilder(api, projectId, {
    content,
    roomId,
    localId,
    formatType: 'PLAIN',
  });
  return data;
}

export async function editMessageRest(
  projectId: string,
  messageId: number,
  content: string,
): Promise<ChatMessage> {
  const { data } = await api.patch<ChatMessage>(
    `/api/projects/${projectId}/chat/messages/${messageId}`,
    { content, formatType: 'PLAIN' },
  );
  return data;
}

export async function deleteMessageRest(
  projectId: string,
  messageId: number,
): Promise<ChatMessage> {
  const { data } = await api.delete<ChatMessage>(
    `/api/projects/${projectId}/chat/messages/${messageId}`,
  );
  return data;
}

export async function postThreadReply(
  projectId: string,
  parentMessageId: number,
  content: string,
): Promise<ChatMessage> {
  const { data } = await api.post<ChatMessage>(
    `/api/projects/${projectId}/chat/messages/${parentMessageId}/thread/replies`,
    { content, formatType: 'PLAIN' },
  );
  return data;
}

export async function createRoom(projectId: string, name: string, memberUsernames: string[]): Promise<ChatRoom> {
  const { data } = await createRoomBuilder(api, projectId, {
    name,
    members: memberUsernames,
  });
  return data;
}

export async function deleteRoom(projectId: string, roomId: number): Promise<void> {
  await api.delete(`/api/projects/${projectId}/chat/rooms/${roomId}`);
}

export async function updateRoomMeta(
  projectId: string,
  roomId: number,
  updates: { name?: string; topic?: string; description?: string }
): Promise<ChatRoom> {
  const { data } = await api.patch(`/api/projects/${projectId}/chat/rooms/${roomId}/meta`, updates);
  return data;
}

export async function pinRoomMessage(projectId: string, roomId: number, messageId: number | null): Promise<void> {
  await api.patch(`/api/projects/${projectId}/chat/rooms/${roomId}/pin`, { messageId });
}

export async function toggleReaction(messageId: number, emoji: string, projectId: string): Promise<ChatReactionSummary[]> {
  const { data } = await api.post<ChatReactionSummary[]>(
    `/api/projects/${projectId}/chat/messages/${messageId}/reactions/toggle`,
    { emoji },
  );
  return data;
}

export async function markTeamRead(projectId: string): Promise<void> {
  await api.post(`/api/projects/${projectId}/chat/team/read`);
}

export async function markRoomRead(projectId: string, roomId: number): Promise<void> {
  await api.post(`/api/projects/${projectId}/chat/rooms/${roomId}/read`);
}

export async function markPrivateRead(projectId: string, partner: string): Promise<void> {
  await api.post(`/api/projects/${projectId}/chat/direct/read`, null, {
    params: { with: partner },
  });
}

export async function uploadChatDocument(
  projectId: string,
  file: { uri: string; name: string; mimeType?: string; file?: File },
): Promise<string> {
  const formData = new FormData();

  if (file.file) {
    formData.append('file', file.file);
  } else {
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/octet-stream',
    } as any);
  }

  const { data } = await api.post<string>(`/api/projects/${projectId}/chat/messages/upload-document`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
}

export async function postTelemetry(
  projectId: string,
  action: string,
  target: string,
  details?: string
): Promise<void> {
  await postTelemetryBuilder(api, projectId, { action, target, details });
}

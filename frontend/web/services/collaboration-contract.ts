import api from '@/lib/axios';
import type {
  ChatMessage,
  ChatReactionSummary,
  ChatRoom,
  ChatSearchResult,
  PresenceResponse,
  UnreadBadgeSummary,
  ChatFeatureFlags,
  DirectChatSummary,
  RoomChatSummary,
  TeamChatSummary,
} from '@/app/(project)/project/[id]/chat/components/chat';

export interface ChatSummaries {
  directSummaries: DirectChatSummary[];
  roomSummaries: RoomChatSummary[];
  teamSummary: TeamChatSummary | null;
}

export interface PageSummaryDto {
  id: number;
  title: string;
}

export interface PageDetailDto {
  id: number;
  title: string;
  content?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatInboxActivity {
  projectId: number;
  projectName: string;
  chatType: 'TEAM' | 'ROOM' | 'DIRECT';
  roomId?: number | null;
  roomName?: string | null;
  username?: string | null;
  participantLabel?: string | null;
  lastMessage?: string | null;
  lastMessageSender?: string | null;
  lastMessageTimestamp?: string | null;
  unseenCount: number;
  unread: boolean;
  activityStatus: 'UNREAD' | 'READ';
}

export interface ChatInboxProjectGroup {
  projectId: number;
  projectName: string;
  unreadCount: number;
  totalItems: number;
  activities: ChatInboxActivity[];
}

export interface ChatInboxResponse {
  recentActivities: ChatInboxActivity[];
  projects: ChatInboxProjectGroup[];
  totalProjects: number;
  totalActivities: number;
  totalUnread: number;
}

export const documentsApi = {
  listByProject: async (projectId: number | string, includeDeleted = false): Promise<any[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/documents`, {
      params: { includeDeleted },
    });
    return data;
  },
};

export const pagesApi = {
  listByProject: async (projectId: number | string): Promise<PageSummaryDto[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/pages`);
    return data;
  },
  get: async (pageId: number | string): Promise<PageDetailDto> => {
    const { data } = await api.get(`/api/pages/${pageId}`);
    return data;
  },
  create: async (projectId: number | string, payload: { title: string; content: string }): Promise<PageDetailDto> => {
    const { data } = await api.post(`/api/projects/${projectId}/pages`, payload);
    return data;
  },
  update: async (pageId: number | string, payload: { title: string; content: string }): Promise<PageDetailDto> => {
    const { data } = await api.put(`/api/pages/${pageId}`, payload);
    return data;
  },
  delete: async (pageId: number | string): Promise<void> => {
    await api.delete(`/api/pages/${pageId}`);
  },
};

export const chatApi = {
  getSummaries: async (projectId: number | string): Promise<ChatSummaries> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/summaries`);
    return data;
  },
  markTeamRead: async (projectId: number | string): Promise<void> => {
    await api.post(`/api/projects/${projectId}/chat/team/read`);
  },
  markRoomRead: async (projectId: number | string, roomId: number): Promise<void> => {
    await api.post(`/api/projects/${projectId}/chat/rooms/${roomId}/read`);
  },
  markDirectRead: async (projectId: number | string, withUser: string): Promise<void> => {
    await api.post(`/api/projects/${projectId}/chat/direct/read`, null, {
      params: { with: withUser },
    });
  },
  getPresence: async (projectId: number | string): Promise<PresenceResponse> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/presence`);
    return data;
  },
  postTelemetry: async (projectId: number | string, payload: { action: string; target: string; details?: string }): Promise<void> => {
    await api.post(`/api/projects/${projectId}/chat/telemetry`, payload);
  },
  getFeatureFlags: async (projectId: number | string): Promise<ChatFeatureFlags> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/features`);
    return data;
  },
  getUnreadBadge: async (projectId: number | string): Promise<UnreadBadgeSummary> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/unread-badge`);
    return data;
  },
  searchMessages: async (projectId: number | string, query: string): Promise<ChatSearchResult[]> => {
    const { data } = await api.get<{ messages: ChatSearchResult[] }>('/api/search', {
      params: { q: query, projectId },
    });
    return data.messages || [];
  },
  getMembers: async (projectId: number | string): Promise<string[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/members`);
    return data;
  },
  getInbox: async (params?: { projectLimit?: number; activityLimit?: number; status?: 'all' | 'unread' }): Promise<ChatInboxResponse> => {
    const { data } = await api.get('/api/chat/inbox', { params });
    return data;
  },
  getTeamMessages: async (projectId: number | string): Promise<ChatMessage[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/messages`);
    return data;
  },
  getRoomMessages: async (projectId: number | string, roomId: number): Promise<ChatMessage[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/messages`, {
      params: { roomId },
    });
    return data;
  },
  getPrivateMessages: async (projectId: number | string, currentUser: string, withUser: string): Promise<ChatMessage[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/messages`, {
      params: { recipient: currentUser, with: withUser },
    });
    return data;
  },
  editMessage: async (projectId: number | string, messageId: number, content: string): Promise<ChatMessage> => {
    const { data } = await api.patch(`/api/projects/${projectId}/chat/messages/${messageId}`, {
      content,
      formatType: 'PLAIN',
    });
    return data;
  },
  deleteMessage: async (projectId: number | string, messageId: number): Promise<ChatMessage> => {
    const { data } = await api.delete(`/api/projects/${projectId}/chat/messages/${messageId}`);
    return data;
  },
  getThreadMessages: async (projectId: number | string, parentMessageId: number): Promise<ChatMessage[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/messages/${parentMessageId}/thread`);
    return data;
  },
  postThreadReply: async (projectId: number | string, parentMessageId: number, content: string): Promise<ChatMessage> => {
    const { data } = await api.post(`/api/projects/${projectId}/chat/messages/${parentMessageId}/thread/replies`, {
      content,
      formatType: 'PLAIN',
    });
    return data;
  },
  getMessageReactions: async (projectId: number | string, messageId: number): Promise<ChatReactionSummary[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/messages/${messageId}/reactions`);
    return data;
  },
  toggleReaction: async (projectId: number | string, messageId: number, emoji: string): Promise<ChatReactionSummary[]> => {
    const { data } = await api.post(`/api/projects/${projectId}/chat/messages/${messageId}/reactions/toggle`, {
      emoji,
    });
    return data;
  },
  getRooms: async (projectId: number | string): Promise<ChatRoom[]> => {
    const { data } = await api.get(`/api/projects/${projectId}/chat/rooms`);
    return data;
  },
  createRoom: async (projectId: number | string, payload: { name: string; members: string[] }): Promise<ChatRoom> => {
    const { data } = await api.post(`/api/projects/${projectId}/chat/rooms`, payload);
    return data;
  },
  deleteRoom: async (projectId: number | string, roomId: number): Promise<void> => {
    await api.delete(`/api/projects/${projectId}/chat/rooms/${roomId}`);
  },
  updateRoomMeta: async (projectId: number | string, roomId: number, updates: { name?: string; topic?: string; description?: string }): Promise<ChatRoom> => {
    const { data } = await api.patch(`/api/projects/${projectId}/chat/rooms/${roomId}/meta`, updates);
    return data;
  },
  pinRoomMessage: async (projectId: number | string, roomId: number, messageId: number | null): Promise<ChatRoom> => {
    const { data } = await api.patch(`/api/projects/${projectId}/chat/rooms/${roomId}/pin`, { messageId });
    return data;
  },
};

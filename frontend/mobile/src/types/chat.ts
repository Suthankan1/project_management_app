export interface ChatMessage {
  id?: number;
  localId?: string;
  type?: 'CHAT' | 'JOIN' | 'LEAVE';
  sender: string;
  recipient?: string;
  projectId?: number;
  roomId?: number;
  chatType?: 'TEAM' | 'ROOM' | 'PRIVATE';
  parentMessageId?: number;
  replyCount?: number;
  formatType?: 'PLAIN' | 'MARKDOWN';
  content: string;
  timestamp?: string | null;
  reactions?: ChatReactionSummary[];
  deleted?: boolean;
  deletedAt?: string | null;
  editedAt?: string | null;
  syncStatus?: 'pending' | 'syncing' | 'sent' | 'failed';
  offlineQueued?: boolean;
  failureReason?: string;
}

export interface ChatReactionSummary {
  emoji: string;
  count: number;
  reactedByCurrentUser: boolean;
}

export interface ChatRoom {
  id: number;
  name: string;
  projectId?: number;
  createdBy?: string | null;
  topic?: string | null;
  description?: string | null;
  pinnedMessageId?: number | null;
  members?: string[];
}

export interface ChatFeatureFlags {
  phaseDEnabled: boolean;
  phaseEEnabled: boolean;
  webhooksEnabled: boolean;
  telemetryEnabled: boolean;
}

export interface ChatSearchResult {
  messageId: number;
  highlightedContent: string;
  senderName: string;
  timestamp?: string | null;
  deepLinkUrl: string;
  type: 'MESSAGE' | string;
  roomOrProjectId: number;
  projectId: number;
  roomId?: number | null;
}

export interface DirectChatSummary {
  username: string;
  lastMessage: string | null;
  lastMessageSender: string | null;
  lastMessageTimestamp: string | null;
  unseenCount: number;
}

export interface RoomChatSummary {
  roomId: number;
  lastMessage: string | null;
  lastMessageSender: string | null;
  lastMessageTimestamp: string | null;
  unseenCount: number;
}

export interface TeamChatSummary {
  lastMessage: string | null;
  lastMessageSender: string | null;
  lastMessageTimestamp: string | null;
  unseenCount: number;
}

export interface PresenceResponse {
  onlineUsers: string[];
  onlineCount: number;
}

export interface UnreadBadgeSummary {
  teamUnread: number;
  roomsUnread: number;
  directsUnread: number;
  totalUnread: number;
}

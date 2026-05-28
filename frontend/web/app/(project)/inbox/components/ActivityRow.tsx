// UI component rendering a single chat conversation (team, room, or DM) within the inbox list.
import { memo, useCallback } from 'react';
import { MessageSquare, UserRound, Users } from 'lucide-react';
import type { ChatInboxActivity } from '@/services/chat-service';
import { formatRelativeTime, getChatTypeLabel } from '../utils';

// Helper to render the appropriate icon based on the chat type.
function getChatTypeIcon(activity: ChatInboxActivity) {
  if (activity.chatType === 'TEAM') {
    return <Users size={16} className="text-cu-primary" />;
  }

  if (activity.chatType === 'ROOM') {
    return <MessageSquare size={16} className="text-indigo-500" />;
  }

  return <UserRound size={16} className="text-emerald-500" />;
}

// =====================================================
// ACTIVITY ROW COMPONENT
// =====================================================
export const ActivityRow = memo(function ActivityRow({
  activity,
  onActivityClick,
}: {
  activity: ChatInboxActivity;
  onActivityClick: (activity: ChatInboxActivity) => void;
}) {
  const handleClick = useCallback(() => {
    onActivityClick(activity);
  }, [activity, onActivityClick]);

  return (
    <button
      onClick={handleClick}
      className="w-full text-left px-4 py-4 min-h-[44px] rounded-xl border border-cu-border bg-cu-bg hover:border-cu-primary/35 hover:bg-cu-primary/5 transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-cu-bg-secondary border border-cu-border-light flex items-center justify-center flex-shrink-0 mt-0.5">
            {getChatTypeIcon(activity)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-[14px] sm:text-[13px] font-semibold text-cu-text-primary truncate">{getChatTypeLabel(activity)}</p>
              <span className="text-[11px] sm:text-[10px] font-bold uppercase tracking-wide text-cu-text-muted bg-cu-bg-secondary border border-cu-border-light px-1.5 py-0.5 rounded">
                {activity.chatType}
              </span>
            </div>
            <p className="text-[12px] sm:text-[11px] text-cu-text-muted mt-0.5 truncate">{activity.projectName}</p>
            <p className="text-[13px] sm:text-[12px] text-cu-text-secondary mt-1 truncate">
              {activity.lastMessageSender && <span className="font-semibold text-cu-text-primary">{activity.lastMessageSender}: </span>}
              {activity.lastMessage || 'No messages yet'}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="text-[11px] text-cu-text-muted">{formatRelativeTime(activity.lastMessageTimestamp)}</span>
          {activity.unread ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-cu-primary text-white shadow-cu-sm">
              {activity.unseenCount > 99 ? '99+' : activity.unseenCount}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cu-bg-secondary text-cu-text-muted border border-cu-border-light">
              READ
            </span>
          )}
        </div>
      </div>
    </button>
  );
});

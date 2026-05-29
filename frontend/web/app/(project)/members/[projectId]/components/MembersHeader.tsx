import { UserPlus } from 'lucide-react';

interface MembersHeaderProps {
  onInviteClick: () => void;
}

export function MembersHeader({ onInviteClick }: MembersHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-cu-text-primary">Team Members</h1>
        <div className="text-sm text-cu-text-muted mt-1">Manage your team and their permissions</div>
      </div>
      <button
        className="flex w-full items-center justify-center gap-2 px-4 sm:w-auto sm:px-5 py-2 min-h-[44px] rounded-lg bg-cu-primary text-white font-semibold text-sm shadow-md hover:bg-cu-primary-dark focus:outline-none focus:ring-2 focus:ring-blue-300"
        style={{ boxShadow: '0 2px 8px 0 rgba(21,93,252,0.1)' }}
        onClick={onInviteClick}
      >
        <UserPlus size={18} aria-hidden="true" />
        Invite Member
      </button>
    </div>
  );
}

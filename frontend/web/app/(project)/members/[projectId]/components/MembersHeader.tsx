import { UserPlus } from 'lucide-react';
import Button from '@/components/shared/Button';

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
      <Button
        variant="primary"
        size="lg"
        leftIcon={<UserPlus size={18} />}
        className="w-full sm:w-auto"
        onClick={onInviteClick}
      >
        Invite Member
      </Button>
    </div>
  );
}

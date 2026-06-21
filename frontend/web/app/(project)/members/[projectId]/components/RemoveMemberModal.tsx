import type { MemberCombined } from '../types';

interface RemoveMemberModalProps {
  isOpen: boolean;
  memberToRemove: MemberCombined | null;
  removeLoading: boolean;
  removeError: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function RemoveMemberModal({
  isOpen,
  memberToRemove,
  removeLoading,
  removeError,
  onClose,
  onConfirm,
}: RemoveMemberModalProps) {
  if (!isOpen || !memberToRemove) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50 p-4 sm:p-0">
      <div className="bg-cu-bg rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-sm relative">
        <button
          className="absolute top-2 right-2 text-cu-text-muted hover:text-cu-text-primary"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4 text-cu-text-primary">Remove Member</h2>
        <p className="text-xs sm:text-sm text-cu-text-secondary mb-6 leading-relaxed">
          Are you sure you want to remove <strong>{memberToRemove.user.fullName || memberToRemove.user.email}</strong> from this project? This action cannot be undone.
        </p>
        {removeError && <div className="text-cu-danger text-sm mb-4">{removeError}</div>}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            className="flex-1 py-2.5 min-h-[44px] rounded border border-cu-border bg-cu-bg-secondary hover:bg-cu-hover font-medium text-cu-text-primary"
            onClick={onClose}
            disabled={removeLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="flex-1 py-2.5 min-h-[44px] rounded bg-cu-danger text-white hover:opacity-90 font-medium flex items-center justify-center"
            onClick={onConfirm}
            disabled={removeLoading}
          >
            {removeLoading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

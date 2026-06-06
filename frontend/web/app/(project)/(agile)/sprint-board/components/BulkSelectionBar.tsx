'use client';

interface BulkSelectionBarProps {
  count: number;
  isBulkApplying: boolean;
  onBulkStatus: (status: string) => void;
  onBulkDelete: () => void;
  onClear: () => void;
}

export default function BulkSelectionBar({ count, isBulkApplying, onBulkStatus, onBulkDelete, onClear }: BulkSelectionBarProps) {
  if (count === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-cu-border bg-cu-bg px-4 py-2 md:px-6">
      <span className="text-xs font-semibold text-cu-text-primary">{count} selected</span>
      <button disabled={isBulkApplying} onClick={() => onBulkStatus('TODO')} className="rounded-lg border border-cu-border bg-cu-bg-secondary px-2 py-1 text-xs font-medium text-cu-text-secondary transition-colors hover:bg-cu-hover hover:text-cu-text-primary disabled:cursor-not-allowed disabled:opacity-50">To do</button>
      <button disabled={isBulkApplying} onClick={() => onBulkStatus('IN_PROGRESS')} className="rounded-lg border border-cu-border bg-cu-bg-secondary px-2 py-1 text-xs font-medium text-cu-text-secondary transition-colors hover:bg-cu-hover hover:text-cu-text-primary disabled:cursor-not-allowed disabled:opacity-50">In progress</button>
      <button disabled={isBulkApplying} onClick={() => onBulkStatus('DONE')} className="rounded-lg border border-cu-border bg-cu-bg-secondary px-2 py-1 text-xs font-medium text-cu-text-secondary transition-colors hover:bg-cu-hover hover:text-cu-text-primary disabled:cursor-not-allowed disabled:opacity-50">Done</button>
      <button disabled={isBulkApplying} onClick={onBulkDelete} className="rounded-lg border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs font-semibold text-red-500 transition-colors hover:bg-red-500/15 disabled:cursor-not-allowed disabled:opacity-50">Delete</button>
      <button onClick={onClear} className="rounded-lg border border-cu-border bg-cu-bg-secondary px-2 py-1 text-xs font-medium text-cu-text-secondary transition-colors hover:bg-cu-hover hover:text-cu-text-primary">Clear</button>
    </div>
  );
}

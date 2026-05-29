'use client';

interface CompleteSprintModalProps {
  open: boolean;
  allActiveSprints: Array<{ id: number; sprintName?: string }>;
  sprintIdToComplete: number | null;
  onSelectSprint: (id: number) => void;
  onComplete: () => void;
  onCancel: () => void;
}

export default function CompleteSprintModal({ open, allActiveSprints, sprintIdToComplete, onSelectSprint, onComplete, onCancel }: CompleteSprintModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-cu-border bg-cu-bg p-6 shadow-cu-xl">
        <h3 className="mb-4 text-lg font-bold text-cu-text-primary">Complete Sprint</h3>
        <div className="space-y-2">
          {allActiveSprints.map((s) => (
            <button key={s.id} onClick={() => onSelectSprint(s.id)}
              className={`w-full rounded-xl border p-3 text-left text-sm font-medium transition-colors ${sprintIdToComplete === s.id ? 'border-cu-primary bg-cu-primary/10 text-cu-primary' : 'border-cu-border bg-cu-bg-secondary text-cu-text-primary hover:bg-cu-hover'}`}
            >
              {s.sprintName || `Sprint #${s.id}`}
            </button>
          ))}
        </div>
        <div className="mt-4 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-xl border border-cu-border px-3 py-2 text-sm font-semibold text-cu-text-secondary transition-colors hover:bg-cu-hover hover:text-cu-text-primary">Cancel</button>
          <button onClick={onComplete} className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700">Complete</button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { Pencil } from 'lucide-react';

interface SprintGoalEditorProps {
  goalText: string;
  editingGoal: boolean;
  savingGoal: boolean;
  onGoalTextChange: (text: string) => void;
  onStartEditing: () => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function SprintGoalEditor({
  goalText,
  editingGoal,
  savingGoal,
  onGoalTextChange,
  onStartEditing,
  onSave,
  onCancel,
}: SprintGoalEditorProps) {
  if (editingGoal) {
    return (
      <div className="mb-3 px-1">
        <div className="flex items-start gap-2">
          <textarea
            value={goalText}
            onChange={(e) => onGoalTextChange(e.target.value)}
            placeholder="Define the sprint goal..."
            className="flex-1 rounded-lg border border-cu-border bg-cu-bg px-3 py-2 text-[13px] text-cu-text-primary placeholder:text-cu-text-muted focus:outline-none focus:ring-2 focus:ring-cu-primary/20 focus:border-cu-primary resize-none"
            rows={2}
            maxLength={500}
          />
          <button
            onClick={onSave}
            disabled={savingGoal}
            className="rounded-lg bg-cu-primary px-3 py-2 text-[12px] font-bold text-white hover:bg-cu-primary-hover disabled:opacity-50 transition-colors"
          >
            {savingGoal ? '...' : 'Save'}
          </button>
          <button
            onClick={onCancel}
            className="rounded-lg border border-cu-border bg-cu-bg px-3 py-2 text-[12px] font-bold text-cu-text-primary hover:bg-cu-hover transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-3 px-1">
      <button
        type="button"
        onClick={onStartEditing}
        className="group flex items-center gap-2 text-[13px] text-cu-text-secondary hover:text-cu-text-primary transition-colors"
      >
        <span className="font-medium">Goal:</span>
        <span className={goalText ? 'text-cu-text-primary' : 'italic text-cu-text-muted'}>
          {goalText || 'Click to set a sprint goal...'}
        </span>
        <Pencil size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
      </button>
    </div>
  );
}

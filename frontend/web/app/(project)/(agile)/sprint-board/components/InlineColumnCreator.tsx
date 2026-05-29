'use client';

import { Check, Plus, X } from 'lucide-react';

interface InlineColumnCreatorProps {
  isAddingColumn: boolean;
  newColumnName: string;
  isCreatingColumn: boolean;
  onNewColumnNameChange: (name: string) => void;
  onStartAdding: () => void;
  onFinalize: (name: string, status: string) => void;
  onCancel: () => void;
}

const toColumnStatus = (name: string) => name.trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_');

export default function InlineColumnCreator({ isAddingColumn, newColumnName, isCreatingColumn, onNewColumnNameChange, onStartAdding, onFinalize, onCancel }: InlineColumnCreatorProps) {
  if (!isAddingColumn) {
    return (
      <button onClick={onStartAdding} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-cu-border text-cu-text-muted hover:border-cu-primary/60 hover:bg-cu-primary/10 hover:text-cu-primary transition-all text-sm font-medium">
        <Plus size={16} />Add Column
      </button>
    );
  }

  return (
    <div className="rounded-xl bg-cu-bg border border-cu-border p-3 w-full shadow-cu-sm">
      <div className="flex items-center gap-2">
        <input
          id="new-column-input"
          type="text"
          placeholder="Column name..."
          value={newColumnName}
          onChange={(e) => onNewColumnNameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newColumnName.trim()) onFinalize(newColumnName.trim(), toColumnStatus(newColumnName.trim()));
            else if (e.key === 'Escape') onCancel();
          }}
          disabled={isCreatingColumn}
          className="flex-1 px-3 py-2 border border-cu-border bg-cu-bg-secondary text-cu-text-primary placeholder:text-cu-text-muted rounded-lg text-sm focus:outline-none focus:border-cu-primary focus:ring-2 focus:ring-cu-primary/20"
        />
        <button onClick={() => newColumnName.trim() && onFinalize(newColumnName.trim(), toColumnStatus(newColumnName.trim()))} disabled={isCreatingColumn} className="p-2 bg-cu-primary text-white rounded-lg hover:bg-cu-primary-hover disabled:opacity-50"><Check size={16} /></button>
        <button onClick={onCancel} className="p-2 border border-cu-border text-cu-text-secondary hover:bg-cu-hover hover:text-cu-text-primary rounded-lg"><X size={16} /></button>
      </div>
    </div>
  );
}

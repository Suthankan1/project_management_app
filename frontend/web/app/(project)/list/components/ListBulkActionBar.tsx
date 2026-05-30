'use client';

import { ChevronDown, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface ListBulkActionBarProps {
  selectedCount: number;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

const STATUS_OPTIONS = [
  { value: 'TODO',        label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW',   label: 'In Review' },
  { value: 'DONE',        label: 'Done' },
];

export default function ListBulkActionBar({
  selectedCount,
  onStatusChange,
  onDelete,
  onClear,
}: ListBulkActionBarProps) {
  const [openStatus, setOpenStatus] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenStatus(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200">
      <div ref={ref} className="flex items-center gap-2 rounded-2xl border border-cu-border bg-cu-bg px-4 py-2.5 shadow-cu-xl">

        {/* Count */}
        <div className="flex items-center gap-2 pr-3 border-r border-cu-border">
          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-cu-primary px-1.5 text-[11px] font-bold text-white">
            {selectedCount}
          </span>
          <span className="text-[13px] font-bold text-cu-text-primary hidden sm:inline">selected</span>
        </div>

        {/* Status change */}
        <div className="relative">
          <button
            onClick={() => setOpenStatus((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-cu-text-primary hover:bg-cu-hover transition-colors"
          >
            Status
            <ChevronDown size={12} />
          </button>
          {openStatus && (
            <div className="absolute bottom-10 left-0 min-w-[140px] rounded-xl border border-cu-border bg-cu-bg shadow-cu-xl overflow-hidden">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onStatusChange(opt.value); setOpenStatus(false); }}
                  className="flex w-full items-center px-3 py-2.5 text-[12px] font-bold text-cu-text-primary hover:bg-cu-hover transition-colors"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Delete */}
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-bold text-cu-danger hover:bg-cu-danger-light transition-colors"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Delete</span>
        </button>

        {/* Clear */}
        <div className="pl-2 border-l border-cu-border">
          <button
            onClick={onClear}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-cu-text-secondary hover:bg-cu-hover hover:text-cu-text-primary transition-colors"
            aria-label="Clear selection"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

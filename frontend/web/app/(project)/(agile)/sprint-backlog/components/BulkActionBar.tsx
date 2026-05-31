'use client';

import { ChevronDown, MoveRight, Trash2, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { SprintItem } from '@/types';

interface BulkActionBarProps {
  selectedCount: number;
  sprints: SprintItem[];
  onMoveToSprint: (sprintId: number) => void;
  onMoveToBacklog: () => void;
  onStatusChange: (status: string) => void;
  onDelete: () => void;
  onClear: () => void;
}

const STATUS_OPTIONS = [
  { value: 'TODO', label: 'To Do' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'IN_REVIEW', label: 'In Review' },
  { value: 'DONE', label: 'Done' },
];

export default function BulkActionBar({
  selectedCount,
  sprints,
  onMoveToSprint,
  onMoveToBacklog,
  onStatusChange,
  onDelete,
  onClear,
}: BulkActionBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  if (selectedCount === 0) return null;

  return (
    <div className="fixed left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-200" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' }}>
      <div
        ref={menuRef}
        className="flex max-w-[calc(100vw-16px)] items-center gap-1.5 sm:gap-2 rounded-2xl border border-cu-border bg-cu-bg px-2.5 sm:px-4 py-2.5 shadow-cu-xl"
      >
        {/* Count badge */}
        <div className="flex items-center gap-2 pr-3 border-r border-cu-border">
          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-cu-primary px-1.5 text-[11px] font-bold text-white">
            {selectedCount}
          </span>
          <span className="text-[13px] font-bold text-cu-text-primary hidden sm:inline">selected</span>
        </div>

        {/* Move to Sprint */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'move' ? null : 'move')}
            className="flex min-h-[42px] items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[12px] font-bold text-cu-text-primary hover:bg-cu-hover transition-all"
          >
            <MoveRight size={14} />
            <span className="hidden sm:inline">Move</span>
            <ChevronDown size={12} />
          </button>
          {openMenu === 'move' && (
            <div className="absolute bottom-10 left-0 min-w-[180px] rounded-xl border border-cu-border bg-cu-bg shadow-cu-xl overflow-hidden">
              <button
                onClick={() => { onMoveToBacklog(); setOpenMenu(null); }}
                className="flex w-full items-center px-3 py-2.5 text-[12px] font-bold text-cu-text-primary hover:bg-cu-hover"
              >
                Backlog
              </button>
              <div className="border-t border-cu-border" />
              {sprints.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { onMoveToSprint(s.id); setOpenMenu(null); }}
                  className="flex w-full items-center px-3 py-2.5 text-[12px] font-bold text-cu-text-primary hover:bg-cu-hover"
                >
                  {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bulk Status Change */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === 'status' ? null : 'status')}
            className="flex min-h-[42px] items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[12px] font-bold text-cu-text-primary hover:bg-cu-hover transition-all"
          >
            Status
            <ChevronDown size={12} />
          </button>
          {openMenu === 'status' && (
            <div className="absolute bottom-10 left-0 min-w-[140px] rounded-xl border border-cu-border bg-cu-bg shadow-cu-xl overflow-hidden">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onStatusChange(opt.value); setOpenMenu(null); }}
                  className="flex w-full items-center px-3 py-2.5 text-[12px] font-bold text-cu-text-primary hover:bg-cu-hover"
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
          className="flex min-h-[42px] items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-[12px] font-bold text-cu-danger hover:bg-cu-danger-light transition-all"
        >
          <Trash2 size={14} />
          <span className="hidden sm:inline">Delete</span>
        </button>

        {/* Clear selection */}
        <div className="pl-2 border-l border-cu-border">
          <button
            onClick={onClear}
            className="flex h-10 w-10 items-center justify-center rounded-lg text-cu-text-secondary hover:bg-cu-hover hover:text-cu-text-primary transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

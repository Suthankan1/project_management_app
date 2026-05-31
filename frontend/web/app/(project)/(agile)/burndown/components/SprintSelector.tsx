'use client';

import { ChevronDown } from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Sprint {
  id: number;
  name: string;
  startDate?: string | null;
  endDate?: string | null;
  status: 'NOT_STARTED' | 'ACTIVE' | 'COMPLETED';
}

interface SprintSelectorProps {
  sprints: Sprint[];
  selectedSprint: Sprint | undefined;
  selectedSprintId: number | null;
  sprintDropOpen: boolean;
  filterFrom: string;
  filterTo: string;
  dropdownRef: React.RefObject<HTMLDivElement | null>;
  onToggleDropdown: () => void;
  onSelectSprint: (sprint: Sprint) => void;
  onFilterFromChange: (val: string) => void;
  onFilterToChange: (val: string) => void;
}

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_STYLE: Record<Sprint['status'], string> = {
  NOT_STARTED: 'bg-cu-bg-tertiary text-cu-text-secondary',
  ACTIVE:      'bg-emerald-500/10 text-emerald-500',
  COMPLETED:   'bg-cu-primary/10 text-cu-primary',
};
const STATUS_LABEL: Record<Sprint['status'], string> = {
  NOT_STARTED: 'Not Started',
  ACTIVE:      'Active',
  COMPLETED:   'Completed',
};

// ─── Component ───────────────────────────────────────────────────────────────

export { STATUS_STYLE, STATUS_LABEL };
export type { Sprint as BurndownSprint };

export default function SprintSelector({
  sprints,
  selectedSprint,
  selectedSprintId,
  sprintDropOpen,
  filterFrom,
  filterTo,
  dropdownRef,
  onToggleDropdown,
  onSelectSprint,
  onFilterFromChange,
  onFilterToChange,
}: SprintSelectorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Sprint selector */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={onToggleDropdown}
          className="flex items-center gap-2 rounded-lg border border-cu-border bg-cu-bg px-4 py-2 text-[14px] font-medium text-cu-text-primary shadow-cu-sm transition-colors hover:border-cu-primary/40 hover:bg-cu-hover"
        >
          <span>
            {selectedSprint ? selectedSprint.name : 'Select Sprint'}
          </span>
          {selectedSprint && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[selectedSprint.status]}`}>
              {STATUS_LABEL[selectedSprint.status]}
            </span>
          )}
          <ChevronDown size={16} className="text-cu-text-muted" />
        </button>

        {sprintDropOpen && (
          <div className="absolute left-0 top-11 z-50 min-w-[220px] overflow-hidden rounded-xl border border-cu-border bg-cu-bg shadow-cu-xl">
            {sprints.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSprint(s)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] transition-colors hover:bg-cu-hover ${s.id === selectedSprintId ? 'bg-cu-primary/10 font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
              >
                <span>{s.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[s.status]}`}>
                  {STATUS_LABEL[s.status]}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Date range filter */}
      <div className="flex items-center gap-2 rounded-lg border border-cu-border bg-cu-bg px-3 py-2 shadow-cu-sm">
        <input
          type="date"
          value={filterFrom}
          max={filterTo || undefined}
          onChange={(e) => onFilterFromChange(e.target.value)}
          className="border-none bg-transparent text-[13px] text-cu-text-primary outline-none"
        />
        <span className="text-[12px] text-cu-text-muted">-</span>
        <input
          type="date"
          value={filterTo}
          min={filterFrom || undefined}
          onChange={(e) => onFilterToChange(e.target.value)}
          className="border-none bg-transparent text-[13px] text-cu-text-primary outline-none"
        />
      </div>
    </div>
  );
}

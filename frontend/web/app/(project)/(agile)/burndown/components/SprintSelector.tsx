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
  NOT_STARTED: 'bg-[#F2F4F7] text-[#344054]',
  ACTIVE:      'bg-[#ECFDF3] text-[#027A48]',
  COMPLETED:   'bg-[#EFF8FF] text-[#175CD3]',
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
          className="flex items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-4 py-2 text-[14px] font-medium text-[#344054] shadow-sm hover:border-[#98A2B3] transition-colors"
        >
          <span>
            {selectedSprint ? selectedSprint.name : 'Select Sprint'}
          </span>
          {selectedSprint && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${STATUS_STYLE[selectedSprint.status]}`}>
              {STATUS_LABEL[selectedSprint.status]}
            </span>
          )}
          <ChevronDown size={16} className="text-[#98A2B3]" />
        </button>

        {sprintDropOpen && (
          <div className="absolute left-0 top-11 z-50 min-w-[220px] rounded-xl border border-[#E4E7EC] bg-white shadow-xl overflow-hidden">
            {sprints.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSprint(s)}
                className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-[13px] hover:bg-[#F9FAFB] transition-colors ${s.id === selectedSprintId ? 'bg-[#EFF8FF] font-semibold text-[#175CD3]' : 'text-[#344054]'}`}
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
      <div className="flex items-center gap-2 rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 shadow-sm">
        <input
          type="date"
          value={filterFrom}
          max={filterTo || undefined}
          onChange={(e) => onFilterFromChange(e.target.value)}
          className="border-none bg-transparent text-[13px] text-[#344054] outline-none"
        />
        <span className="text-[#98A2B3] text-[12px]">→</span>
        <input
          type="date"
          value={filterTo}
          min={filterFrom || undefined}
          onChange={(e) => onFilterToChange(e.target.value)}
          className="border-none bg-transparent text-[13px] text-[#344054] outline-none"
        />
      </div>
    </div>
  );
}

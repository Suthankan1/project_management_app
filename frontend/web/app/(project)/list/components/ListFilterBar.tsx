'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Filter, Layers, Search, X } from 'lucide-react';

export interface ListFilters {
  search: string;
  statuses: string[];
  priorities: string[];
  assignee: string;
}

interface ListFilterBarProps {
  filters: ListFilters;
  onChange: (next: ListFilters) => void;
  assigneeNames: string[];
  groupBy: 'none' | 'status' | 'priority' | 'assignee';
  onGroupByChange: (next: 'none' | 'status' | 'priority' | 'assignee') => void;
}

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
const PRIORITY_OPTIONS = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];

export default function ListFilterBar({
  filters,
  onChange,
  assigneeNames,
  groupBy,
  onGroupByChange,
}: ListFilterBarProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpenMenu(null);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const activeCount =
    filters.statuses.length + filters.priorities.length + (filters.assignee ? 1 : 0);

  const btnBase = 'h-10 px-3 rounded-xl border border-cu-border text-[12px] font-semibold text-cu-text-primary bg-cu-bg hover:bg-cu-hover flex items-center gap-1.5 transition-colors';
  const dropdownBase = 'absolute top-11 left-0 z-50 min-w-[160px] rounded-xl border border-cu-border bg-cu-bg shadow-cu-xl overflow-hidden';
  const optionBase = 'w-full text-left px-3 py-2 text-[12px] hover:bg-cu-hover transition-colors';

  return (
    <div ref={ref} className="rounded-2xl border border-cu-border bg-cu-bg p-3 sm:p-4 shadow-cu-sm mb-4">
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">

        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-cu-text-tertiary" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            placeholder="Search by task title or assignee..."
            className="w-full h-10 rounded-xl border border-cu-border bg-cu-bg text-cu-text-primary placeholder:text-cu-text-muted pl-9 pr-8 text-[13px] focus:outline-none focus:ring-2 focus:ring-cu-primary/25 focus:border-cu-primary transition-colors"
          />
          {filters.search && (
            <button
              onClick={() => onChange({ ...filters, search: '' })}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-cu-text-tertiary hover:text-cu-text-primary"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <div className="relative">
          <button onClick={() => setOpenMenu(openMenu === 'status' ? null : 'status')} className={btnBase}>
            <Filter size={13} />
            Status
            {filters.statuses.length > 0 && (
              <span className="text-cu-primary">({filters.statuses.length})</span>
            )}
            <ChevronDown size={12} />
          </button>
          {openMenu === 'status' && (
            <div className={dropdownBase}>
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    const has = filters.statuses.includes(status);
                    onChange({ ...filters, statuses: has ? filters.statuses.filter((x) => x !== status) : [...filters.statuses, status] });
                  }}
                  className={`${optionBase} ${filters.statuses.includes(status) ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Priority filter */}
        <div className="relative">
          <button onClick={() => setOpenMenu(openMenu === 'priority' ? null : 'priority')} className={btnBase}>
            Priority
            {filters.priorities.length > 0 && (
              <span className="text-cu-primary">({filters.priorities.length})</span>
            )}
            <ChevronDown size={12} />
          </button>
          {openMenu === 'priority' && (
            <div className={dropdownBase}>
              {PRIORITY_OPTIONS.map((priority) => (
                <button
                  key={priority}
                  onClick={() => {
                    const has = filters.priorities.includes(priority);
                    onChange({ ...filters, priorities: has ? filters.priorities.filter((x) => x !== priority) : [...filters.priorities, priority] });
                  }}
                  className={`${optionBase} ${filters.priorities.includes(priority) ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
                >
                  {priority}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Assignee filter */}
        <div className="relative">
          <button onClick={() => setOpenMenu(openMenu === 'assignee' ? null : 'assignee')} className={btnBase}>
            Assignee
            {filters.assignee && <span className="text-cu-primary">(1)</span>}
            <ChevronDown size={12} />
          </button>
          {openMenu === 'assignee' && (
            <div className={`${dropdownBase} max-h-52 overflow-y-auto`}>
              <button
                onClick={() => onChange({ ...filters, assignee: '' })}
                className={`${optionBase} ${!filters.assignee ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
              >
                All assignees
              </button>
              {assigneeNames.map((name) => (
                <button
                  key={name}
                  onClick={() => onChange({ ...filters, assignee: name })}
                  className={`${optionBase} ${filters.assignee === name ? 'font-semibold text-cu-primary' : 'text-cu-text-primary'}`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Group by */}
        <button
          onClick={() => onGroupByChange(groupBy === 'none' ? 'status' : groupBy === 'status' ? 'priority' : groupBy === 'priority' ? 'assignee' : 'none')}
          className={btnBase}
        >
          <Layers size={13} />
          {groupBy === 'none' ? 'Group by' : `By ${groupBy}`}
        </button>

        {/* Clear */}
        {activeCount > 0 && (
          <button
            onClick={() => onChange({ ...filters, statuses: [], priorities: [], assignee: '' })}
            className="h-10 px-3 rounded-xl border border-cu-border text-[12px] font-semibold text-cu-text-secondary hover:text-cu-text-primary bg-cu-bg hover:bg-cu-hover transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

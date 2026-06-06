'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

interface FilterDropdownProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  searchablePlaceholder: string;
  widthClassName?: string;
}

const SPECIAL_ALL_VALUES = new Set([
  'All assignees',
  'All standard work types',
  'All sub-tasks',
  'Standard work types',
  'Show full list',
]);

export default function FilterDropdown({
  label,
  options,
  selected,
  onChange,
  searchablePlaceholder,
  widthClassName = 'w-72',
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const filtered = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    if (!normalized) return options;
    return options.filter((item) => item.toLowerCase().includes(normalized));
  }, [options, search]);

  const handleToggle = (value: string) => {
    if (SPECIAL_ALL_VALUES.has(value)) {
      onChange([]);
      return;
    }

    if (selected.includes(value)) {
      onChange(selected.filter((item) => item !== value));
      return;
    }

    onChange([...selected, value]);
  };

  const buttonLabel = selected.length > 0 ? `${label}: ${selected.length}` : label;

  return (
    <div className={`relative ${widthClassName}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`group flex h-10 w-full items-center justify-between rounded-md border px-3 text-left text-sm font-medium transition-all duration-150 ${
          open
            ? 'border-cu-primary bg-cu-bg text-cu-text-primary'
            : 'border-cu-border bg-cu-bg text-cu-text-secondary hover:border-cu-primary hover:bg-cu-hover'
        }`}
      >
        <span className="truncate">{buttonLabel}</span>
        <svg
          className={`ml-2 h-4 w-4 flex-shrink-0 text-cu-text-muted transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="absolute left-0 top-11 z-50 max-h-80 w-full overflow-hidden rounded-lg border border-cu-border bg-cu-bg shadow-xl">
          <div className="border-b border-cu-border bg-cu-bg-secondary p-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchablePlaceholder}
              className="h-9 w-full rounded-md border border-cu-border bg-cu-bg px-3 text-sm text-cu-text-primary outline-none placeholder:text-cu-text-muted focus:border-cu-primary"
            />
          </div>
          <div className="max-h-60 overflow-y-auto p-1.5">
            {filtered.map((item) => {
              const checked = selected.includes(item);
              const isAll = SPECIAL_ALL_VALUES.has(item);

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleToggle(item)}
                  className={`flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm transition-colors ${
                    isAll ? 'font-medium text-cu-text-primary' : 'text-cu-text-secondary'
                  } hover:bg-cu-hover`}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={isAll ? selected.length === 0 : checked}
                    className="h-4 w-4 rounded border-cu-border"
                  />
                  <span className="truncate">{item}</span>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="px-2.5 py-3 text-sm text-cu-text-muted">No options found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

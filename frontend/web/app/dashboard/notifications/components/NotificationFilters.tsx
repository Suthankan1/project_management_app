import type { NotificationFilter } from '../types';

interface NotificationFiltersProps {
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
}

export function NotificationFilters({ filter, onFilterChange }: NotificationFiltersProps) {
  return (
    <div className="flex items-center gap-2 bg-cu-bg-secondary rounded-xl p-1 w-full sm:w-fit border border-cu-border">
      {([
        { key: 'all', label: 'All' },
        { key: 'unread', label: 'Unread' },
        { key: 'read', label: 'Read' },
      ] as const).map((option) => (
        <button
          key={option.key}
          type="button"
          onClick={() => onFilterChange(option.key)}
          className={`px-4 py-2 sm:py-1.5 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-bold transition-all font-outfit ${
            filter === option.key
              ? 'bg-cu-bg text-cu-primary shadow-cu-sm ring-1 ring-cu-border'
              : 'text-cu-text-secondary hover:text-cu-text-primary hover:bg-cu-hover'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

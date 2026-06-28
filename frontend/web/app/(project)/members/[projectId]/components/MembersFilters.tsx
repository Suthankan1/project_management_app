import { Search, SlidersHorizontal } from 'lucide-react';
import Button from '@/components/shared/Button';

interface MembersFiltersProps {
  search: string;
  roleFilter: string | null;
  statusFilter: string | null;
  showFilters: boolean;
  onSearchChange: (value: string) => void;
  onToggleFilters: () => void;
  onRoleFilterChange: (value: string | null) => void;
  onStatusFilterChange: (value: string | null) => void;
}

export function MembersFilters({
  search,
  roleFilter,
  statusFilter,
  showFilters,
  onSearchChange,
  onToggleFilters,
  onRoleFilterChange,
  onStatusFilterChange,
}: MembersFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cu-text-muted" aria-hidden="true" />
          <input
            type="text"
            className="w-full border border-cu-border rounded-lg bg-cu-bg text-cu-text-primary pl-10 pr-4 py-2.5 min-h-[44px] text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-cu-primary/20 placeholder:text-cu-text-muted"
            placeholder="Search members by name or email..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <Button
          variant="secondary"
          size="lg"
          rightIcon={<SlidersHorizontal size={16} />}
          onClick={onToggleFilters}
        >
          Filters
        </Button>
      </div>

      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <select
            className="border border-cu-border rounded-lg bg-cu-bg text-cu-text-primary px-3 py-2.5 min-h-[44px] text-sm shadow-sm"
            value={roleFilter || ''}
            onChange={(e) => onRoleFilterChange(e.target.value || null)}
          >
            <option value="">All Roles</option>
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
            <option value="VIEWER">Viewer</option>
          </select>

          <select
            className="border border-cu-border rounded-lg bg-cu-bg text-cu-text-primary px-3 py-2.5 min-h-[44px] text-sm shadow-sm"
            value={statusFilter || ''}
            onChange={(e) => onStatusFilterChange(e.target.value || null)}
          >
            <option value="">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      )}
    </div>
  );
}

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
        <input
          type="text"
          className="flex-1 border border-cu-border bg-cu-bg text-cu-text-primary rounded px-4 py-2.5 min-h-[44px] text-sm focus:outline-none focus:ring-2 focus:ring-cu-primary/20 placeholder:text-cu-text-muted"
          placeholder="Search members by name or email..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <button
          className="border border-cu-border rounded px-4 py-2.5 min-h-[44px] flex items-center justify-center gap-2 text-sm bg-cu-bg text-cu-text-secondary hover:bg-cu-hover"
          onClick={onToggleFilters}
        >
          <span>Filters</span>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M4 6h16M6 12h12M10 18h4" /></svg>
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <select
            className="border border-cu-border bg-cu-bg text-cu-text-primary rounded px-3 py-2.5 min-h-[44px] text-sm"
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
            className="border border-cu-border bg-cu-bg text-cu-text-primary rounded px-3 py-2.5 min-h-[44px] text-sm"
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

export const BIO_MAX = 300;

export function formatRelativeTime(iso: string | null): string {
    if (!iso) return 'Never';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export const inputCls = 'h-10 w-full rounded-xl border border-cu-border bg-cu-bg text-cu-text-primary px-3.5 text-sm shadow-cu-sm transition-colors focus:outline-none focus:ring-2 focus:ring-cu-primary/20 focus:border-cu-primary placeholder:text-cu-text-muted';
export const disabledCls = 'h-10 w-full rounded-xl border border-cu-border bg-cu-bg-secondary text-cu-text-muted px-3.5 text-sm';
export const labelCls = 'mb-1.5 block text-[13px] font-semibold text-cu-text-secondary';

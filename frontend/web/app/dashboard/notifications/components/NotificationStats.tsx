interface NotificationStatsProps {
  total: number;
  unread: number;
  read: number;
}

export function NotificationStats({ total, unread, read }: NotificationStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-4">
      <div className="rounded-2xl border border-cu-border bg-cu-bg px-4 sm:px-5 py-3 sm:py-4 shadow-cu-sm">
        <p className="text-[10px] uppercase tracking-widest text-cu-text-muted font-bold font-outfit">Total</p>
        <p className="text-2xl font-bold text-cu-text-primary mt-1 font-outfit">{total}</p>
      </div>
      <div className="rounded-2xl border border-cu-border bg-cu-bg px-4 sm:px-5 py-3 sm:py-4 shadow-cu-sm">
        <p className="text-[10px] uppercase tracking-widest text-cu-text-muted font-bold font-outfit">Unread</p>
        <p className="text-2xl font-bold text-cu-primary mt-1 font-outfit">{unread}</p>
      </div>
      <div className="rounded-2xl border border-cu-border bg-cu-bg px-4 sm:px-5 py-3 sm:py-4 shadow-cu-sm">
        <p className="text-[10px] uppercase tracking-widest text-cu-text-muted font-bold font-outfit">Read</p>
        <p className="text-2xl font-bold text-cu-text-secondary mt-1 font-outfit">{read}</p>
      </div>
    </div>
  );
}

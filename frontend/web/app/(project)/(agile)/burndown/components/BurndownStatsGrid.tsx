'use client';

interface BurndownStatsGridProps {
  totalStoryPoints: number;
  donePoints: number;
  remainingPoints: number;
  progressPct: number;
}

export default function BurndownStatsGrid({
  totalStoryPoints,
  donePoints,
  remainingPoints,
  progressPct,
}: BurndownStatsGridProps) {
  const stats = [
    {
      label: 'Total Points',
      value: totalStoryPoints,
      sub: 'in sprint',
      color: 'text-cu-text-primary',
    },
    {
      label: 'Completed',
      value: donePoints,
      sub: 'story points',
      color: 'text-emerald-500',
    },
    {
      label: 'Remaining',
      value: remainingPoints,
      sub: 'story points',
      color: 'text-cu-primary',
    },
    {
      label: 'Progress',
      value: `${progressPct}%`,
      sub: 'completed',
      color: progressPct >= 80 ? 'text-emerald-500' : progressPct >= 50 ? 'text-amber-500' : 'text-red-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="group rounded-xl border border-cu-border bg-cu-bg px-4 py-3 shadow-cu-sm transition-all duration-300 hover:-translate-y-1 hover:border-cu-primary/30 hover:shadow-cu-md">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-cu-text-muted transition-colors group-hover:text-cu-text-secondary">{stat.label}</p>
          <p className={`mt-1 text-[22px] font-bold leading-tight transition-transform duration-300 group-hover:scale-105 origin-left ${stat.color}`}>{stat.value}</p>
          <p className="text-[11px] text-cu-text-secondary transition-opacity duration-300 group-hover:opacity-80">{stat.sub}</p>
        </div>
      ))}
    </div>
  );
}

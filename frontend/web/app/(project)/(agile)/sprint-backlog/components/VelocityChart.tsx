'use client';

import { useMemo, useRef, useEffect, useState } from 'react';

export interface SprintVelocityPoint {
  sprintId: number;
  sprintName: string;
  committedPoints: number;
  completedPoints: number;
}

interface VelocityChartProps {
  sprints: SprintVelocityPoint[];
}

export default function VelocityChart({ sprints }: VelocityChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const data = useMemo(() => {
    return sprints.slice(-8).map((s, index) => ({
      key: `${s.sprintId}-${index}`,
      name: s.sprintName,
      committed: s.committedPoints,
      completed: s.completedPoints,
    }));
  }, [sprints]);

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-cu-border bg-cu-bg-secondary p-6 text-center text-[13px] text-cu-text-secondary">
        No sprint data available for velocity chart.
      </div>
    );
  }

  const maxVal = Math.max(...data.flatMap((d) => [d.committed, d.completed]), 1);
  const padding = { top: 30, right: 20, bottom: 50, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = 200;
  const barGroupW = Math.min(80, chartW / data.length);
  const barW = barGroupW * 0.35;
  const gap = barGroupW * 0.1;

  const avgCommitted = data.length > 0 ? Math.round(data.reduce((a, d) => a + d.committed, 0) / data.length) : 0;
  const avgCompleted = data.length > 0 ? Math.round(data.reduce((a, d) => a + d.completed, 0) / data.length) : 0;

  const tickCount = 5;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => Math.round((maxVal / tickCount) * i));

  return (
    <div className="rounded-xl border border-cu-border bg-cu-bg-secondary p-5 shadow-cu-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[16px] font-bold text-cu-text-primary">Sprint Velocity</h3>
        <div className="flex items-center gap-4 text-[12px]">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-cu-primary-muted" />
            <span className="text-cu-text-secondary">Committed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-sm bg-cu-primary" />
            <span className="text-cu-text-secondary">Completed</span>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="rounded-lg border border-cu-border bg-cu-bg px-3 py-2 text-center">
          <p className="text-[10px] font-medium text-cu-text-secondary uppercase">Avg Committed</p>
          <p className="text-[18px] font-bold text-cu-text-primary">{avgCommitted}</p>
        </div>
        <div className="rounded-lg border border-cu-border bg-cu-bg px-3 py-2 text-center">
          <p className="text-[10px] font-medium text-cu-text-secondary uppercase">Avg Completed</p>
          <p className="text-[18px] font-bold text-cu-primary">{avgCompleted}</p>
        </div>
        <div className="rounded-lg border border-cu-border bg-cu-bg px-3 py-2 text-center">
          <p className="text-[10px] font-medium text-cu-text-secondary uppercase">Best Sprint</p>
          <p className="text-[18px] font-bold text-cu-success">
            {data.length > 0 ? Math.max(...data.map((d) => d.completed)) : 0}
          </p>
        </div>
        <div className="rounded-lg border border-cu-border bg-cu-bg px-3 py-2 text-center">
          <p className="text-[10px] font-medium text-cu-text-secondary uppercase">Total Sprints</p>
          <p className="text-[18px] font-bold text-cu-text-primary">{data.length}</p>
        </div>
      </div>

      <div ref={containerRef} className="w-full overflow-x-auto">
        <svg width={width} height={chartH + padding.top + padding.bottom} className="min-w-[300px]">
          {/* Y-axis grid lines and labels */}
          {ticks.map((tick, i) => {
            const y = padding.top + chartH - (tick / maxVal) * chartH;
            return (
              <g key={`tick-${i}`}>
                <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="var(--cu-border)" strokeWidth={1} />
                <text x={padding.left - 8} y={y + 4} textAnchor="end" className="text-[10px] fill-cu-text-muted">
                  {tick}
                </text>
              </g>
            );
          })}

          {/* Average line */}
          {avgCompleted > 0 && (
            <>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={padding.top + chartH - (avgCompleted / maxVal) * chartH}
                y2={padding.top + chartH - (avgCompleted / maxVal) * chartH}
                stroke="var(--cu-primary)"
                strokeWidth={1}
                strokeDasharray="4 4"
                opacity={0.5}
              />
              <text
                x={width - padding.right - 4}
                y={padding.top + chartH - (avgCompleted / maxVal) * chartH - 4}
                textAnchor="end"
                className="text-[9px] fill-cu-primary"
                opacity={0.7}
              >
                avg: {avgCompleted}
              </text>
            </>
          )}

          {/* Bars */}
          {data.map((d, i) => {
            const groupX = padding.left + (chartW / data.length) * i + (chartW / data.length - barGroupW) / 2;
            const committedH = (d.committed / maxVal) * chartH;
            const completedH = (d.completed / maxVal) * chartH;
            return (
              <g key={d.key}>
                {/* Committed bar */}
                <rect
                  x={groupX}
                  y={padding.top + chartH - committedH}
                  width={barW}
                  height={committedH}
                  rx={3}
                  fill="var(--cu-primary-muted)"
                  className="transition-all duration-300"
                />
                {/* Completed bar */}
                <rect
                  x={groupX + barW + gap}
                  y={padding.top + chartH - completedH}
                  width={barW}
                  height={completedH}
                  rx={3}
                  fill="var(--cu-primary)"
                  className="transition-all duration-300"
                />
                {/* Value labels */}
                {committedH > 14 && (
                  <text
                    x={groupX + barW / 2}
                    y={padding.top + chartH - committedH + 12}
                    textAnchor="middle"
                    className="text-[9px] fill-cu-primary font-bold"
                  >
                    {d.committed}
                  </text>
                )}
                {completedH > 14 && (
                  <text
                    x={groupX + barW + gap + barW / 2}
                    y={padding.top + chartH - completedH + 12}
                    textAnchor="middle"
                    className="text-[9px] fill-white font-bold"
                  >
                    {d.completed}
                  </text>
                )}
                {/* X-axis label */}
                <text
                  x={groupX + barGroupW / 2}
                  y={padding.top + chartH + 20}
                  textAnchor="middle"
                  className="text-[10px] fill-cu-text-secondary"
                >
                  {(d.name ?? '').length > 12 ? d.name.slice(0, 10) + '…' : (d.name ?? '')}
                </text>
              </g>
            );
          })}

          {/* X-axis line */}
          <line x1={padding.left} x2={width - padding.right} y1={padding.top + chartH} y2={padding.top + chartH} stroke="var(--cu-border)" strokeWidth={1} />
        </svg>
      </div>
    </div>
  );
}

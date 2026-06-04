"use client";

import React, { useEffect, useState } from "react";
import { sprintsApi } from "@/services/tasks-contract";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { SafeChartFrame } from "@/components/shared/SafeChartFrame";

type BurndownPoint = {
  date: string;
  remainingPoints: number;
  idealPoints: number;
};

export default function BurndownChart({ sprintId }: { sprintId: number }) {
  const [data, setData] = useState<BurndownPoint[]>([]);

  useEffect(() => {
    sprintsApi
      .getBurndown(sprintId)
      .then((res) => {
        const points: BurndownPoint[] = (res.dataPoints ?? []).map(
          (p: { date: string; remainingPoints: number; idealPoints: number }) => ({
            date: p.date,
            remainingPoints: p.remainingPoints,
            idealPoints: p.idealPoints,
          })
        );
        setData(points);
      })
      .catch(() => {
        // silently ignore — empty state shown below
      });
  }, [sprintId]);

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-cu-text-muted">
        No burndown data available for this sprint.
      </div>
    );
  }

  return (
    <div className="w-full h-[400px]">
      <h2 className="mb-2 text-base font-semibold text-cu-text-primary">Burndown Chart</h2>

      <SafeChartFrame minHeight="360px">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--cu-border)" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--cu-text-secondary)' }} stroke="var(--cu-border)" />
            <YAxis allowDecimals={false} tick={{ fill: 'var(--cu-text-secondary)' }} stroke="var(--cu-border)" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--cu-bg)',
                border: '1px solid var(--cu-border)',
                borderRadius: 8,
                color: 'var(--cu-text-primary)',
              }}
              labelStyle={{ color: 'var(--cu-text-primary)' }}
              itemStyle={{ color: 'var(--cu-text-secondary)' }}
            />
            <Legend wrapperStyle={{ color: 'var(--cu-text-secondary)' }} />

            <Line
              type="monotone"
              dataKey="remainingPoints"
              name="Actual"
              stroke="var(--cu-primary)"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="idealPoints"
              name="Ideal"
              stroke="var(--cu-text-muted)"
              strokeDasharray="5 5"
              strokeWidth={1.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </SafeChartFrame>
    </div>
  );
}

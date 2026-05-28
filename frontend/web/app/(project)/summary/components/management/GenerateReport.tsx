'use client';

import React from 'react';
import Link from 'next/link';
import { FileBarChart2, ArrowRight, BarChart3 } from 'lucide-react';

/**
 * A call-to-action card that links users to the full project analytics and reporting page.
 */
export function GenerateReport({ projectId, isAgile }: { projectId: number | string, isAgile: boolean }) {
  return (
    <div className="h-full w-full">
      <div className="h-full bg-gradient-to-r from-cu-primary via-cu-primary-hover to-cu-primary-light rounded-xl border border-white/15 p-4 shadow-cu-lg text-white relative overflow-hidden group">
        {/* Background decorative elements */}
        <div className="absolute right-[-8px] top-[8px] text-white/5 rotate-[-12deg] pointer-events-none">
          <FileBarChart2 size={78} strokeWidth={1} />
        </div>

        <div className="relative z-10 flex flex-row items-center justify-between gap-4 h-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-cu-bg/15 flex items-center justify-center shrink-0">
              <BarChart3 size={18} className="text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-arimo text-[15px] font-bold text-white truncate">Project Analytics Report</h3>
              <p className="font-arimo text-[11px] text-white/80 truncate">
                {isAgile ? 'Agile / Scrum' : 'Kanban'} · Full insights + Downloads
              </p>
            </div>
          </div>

          <Link
            href={`/report/${projectId}`}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] transition-all bg-cu-bg text-cu-primary hover:bg-cu-bg-secondary shadow-cu-sm whitespace-nowrap border border-white/20"
          >
            <ArrowRight size={15} />
            View Report
          </Link>
        </div>
      </div>
    </div>
  );
}

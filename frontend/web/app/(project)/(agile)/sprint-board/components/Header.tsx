"use client";

import React from "react";
import { Search } from "lucide-react";

export default function Header() {
  return (
    <div className="sticky top-0 z-20 border-b border-cu-border bg-cu-bg px-[10px] py-2 shadow-cu-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="text-[16px] font-semibold text-cu-text-primary">Sprint Board</div>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <input
              className="h-9 w-64 rounded-lg border border-cu-border bg-cu-bg-secondary pl-9 pr-3 text-sm text-cu-text-primary placeholder:text-cu-text-muted focus:border-cu-primary focus:outline-none focus:ring-2 focus:ring-cu-primary/20"
              placeholder="Search tasks..."
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-cu-text-muted" size={15} />
          </div>
          <button className="h-[33.6px] w-[134px] rounded-[10px] border border-cu-primary bg-cu-primary text-white transition hover:-translate-y-0.5 hover:scale-[1.02] hover:bg-cu-primary-hover focus:outline-none focus:ring-2 focus:ring-cu-primary/30">
            Complete Sprint
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { DashboardItem } from './types';
import { EmptyState, ItemIcon, StatusBadge } from './SharedComponents';

interface ItemsTableProps {
  activeTab: string;
  searchQuery: string;
  visibleData: DashboardItem[];
  filteredItems: DashboardItem[];
  visibleCount: number;
  hoveredSlice: string | null;
  onRowClick: (item: DashboardItem) => void;
  onShowMore: () => void;
  onShowLess: () => void;
}

// ─── Table Header ─────────────────────────────────────────────────────────────

function TableHeader({ activeTab }: { activeTab: string }) {
  const thBase = 'py-3.5 text-left font-outfit text-[11px] font-bold text-cu-text-muted uppercase tracking-widest border-b border-cu-border';

  if (activeTab === 'assigned-to-me') {
    return (
      <tr className="border-b border-cu-border">
        <th className={`sticky left-0 z-20 bg-cu-bg px-4 ${thBase}`}>Task Name</th>
        <th className={`px-4 ${thBase}`}>Status</th>
      </tr>
    );
  }

  const nameLabel = activeTab === 'boards' ? 'Board Name' : activeTab === 'favorites' ? 'Project Name' : 'Name';
  const locationLabel = activeTab === 'boards' ? 'Project' : activeTab === 'favorites' ? 'Project Key' : 'Location';

  return (
    <tr className="border-b border-cu-border">
      <th className="py-3.5 w-[48px] border-b border-cu-border" />
      <th className={`sticky left-0 z-20 bg-cu-bg pr-4 ${thBase}`}>{nameLabel}</th>
      <th className={thBase}>{locationLabel}</th>
    </tr>
  );
}

// ─── Table Row ────────────────────────────────────────────────────────────────

function TableRow({
  item,
  index,
  activeTab,
  hoveredSlice,
  onRowClick,
}: {
  item: DashboardItem;
  index: number;
  activeTab: string;
  hoveredSlice: string | null;
  onRowClick: (item: DashboardItem) => void;
}) {
  const isDimmed =
    activeTab === 'assigned-to-me' && hoveredSlice !== null && item.status !== hoveredSlice;

  return (
    <motion.tr
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: activeTab === 'assigned-to-me' ? Math.min(index * 0.05, 0.4) : 0,
      }}
      key={item.id}
      className={`group border-b border-cu-border hover:bg-cu-hover cursor-pointer transition-all duration-300 ${
        isDimmed ? 'opacity-20 scale-[0.99] grayscale' : 'opacity-100'
      }`}
      onClick={() => onRowClick(item)}
    >
      {activeTab === 'assigned-to-me' ? (
        <>
          <td className="sticky left-0 z-10 bg-cu-bg/95 backdrop-blur-sm py-3.5 px-4 max-w-[150px] sm:max-w-[200px] xl:max-w-[280px] shadow-[6px_0_10px_-6px_rgba(0,0,0,0.15)]">
            <div className="font-outfit text-[13.5px] text-cu-text-primary font-bold truncate group-hover:text-cu-primary transition-colors" title={item.name}>
              {item.name}
            </div>
            <div className="font-outfit text-[10px] font-bold text-cu-text-muted mt-1 truncate tracking-wider uppercase">
              {item.location}
            </div>
          </td>
          <td className="py-3.5 px-4 whitespace-nowrap">
            {item.type === 'TASK' && <StatusBadge status={item.status ?? 'TODO'} />}
          </td>
        </>
      ) : (
        <>
          <td className="py-3.5 whitespace-nowrap">
            <ItemIcon item={item} />
          </td>
          <td className="sticky left-0 z-10 bg-cu-bg/95 backdrop-blur-sm py-3.5 pr-4 text-cu-text-primary font-outfit text-[13.5px] font-bold whitespace-nowrap shadow-[6px_0_10px_-6px_rgba(0,0,0,0.15)]">
            {item.name}
          </td>
          <td className="py-3.5 text-cu-text-secondary font-outfit text-[12.5px] font-medium">
            {item.location}
          </td>
        </>
      )}
    </motion.tr>
  );
}

// ─── Pagination Controls ──────────────────────────────────────────────────────

function PaginationControls({
  visibleCount,
  totalCount,
  onShowMore,
  onShowLess,
}: {
  visibleCount: number;
  totalCount: number;
  onShowMore: () => void;
  onShowLess: () => void;
}) {
  if (totalCount <= 5) return null;

  return (
    <div className="w-full flex items-center justify-center gap-3 mt-4 mb-2 pt-4 border-t border-cu-border">
      {visibleCount < totalCount && (
        <button
          onClick={onShowMore}
          className="group flex items-center gap-1.5 px-4 py-1.5 font-arimo text-[13px] font-semibold text-cu-text-primary bg-cu-bg border border-cu-border rounded-full shadow-sm hover:text-cu-primary hover:border-cu-primary/30 hover:bg-cu-primary/5 transition-all active:scale-95"
        >
          <span>Show More</span>
          <svg className="w-3.5 h-3.5 text-cu-text-muted group-hover:text-cu-primary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
      {visibleCount > 5 && (
        <button
          onClick={onShowLess}
          className="group flex items-center gap-1.5 px-4 py-1.5 font-arimo text-[13px] font-semibold text-cu-text-primary bg-cu-bg border border-cu-border rounded-full shadow-sm hover:text-cu-text-primary hover:border-cu-border hover:bg-cu-hover transition-all active:scale-95"
        >
          <span>Show Less</span>
          <svg className="w-3.5 h-3.5 text-cu-text-muted group-hover:text-cu-text-secondary transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 15l-6-6-6 6" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ─── Main Items Table ─────────────────────────────────────────────────────────

export function ItemsTable({
  activeTab,
  searchQuery,
  visibleData,
  filteredItems,
  visibleCount,
  hoveredSlice,
  onRowClick,
  onShowMore,
  onShowLess,
}: ItemsTableProps) {
  const colSpan = activeTab === 'assigned-to-me' ? 2 : 3;

  return (
    <div className="w-full flex-1 overflow-x-auto custom-scrollbar">
      <table className="min-w-full border-separate border-spacing-0">
        <thead>
          <TableHeader activeTab={activeTab} />
        </thead>
        <tbody>
          {filteredItems.length === 0 ? (
            <tr>
              <td colSpan={colSpan} className="border-b border-cu-border">
                <EmptyState activeTab={activeTab} searchQuery={searchQuery} />
              </td>
            </tr>
          ) : (
            visibleData.map((item, index) => (
              <TableRow
                key={item.id}
                item={item}
                index={index}
                activeTab={activeTab}
                hoveredSlice={hoveredSlice}
                onRowClick={onRowClick}
              />
            ))
          )}
        </tbody>
      </table>

      <PaginationControls
        visibleCount={visibleCount}
        totalCount={filteredItems.length}
        onShowMore={onShowMore}
        onShowLess={onShowLess}
      />
    </div>
  );
}

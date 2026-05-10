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
  const thBase = 'py-3.5 text-left font-outfit text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100';

  if (activeTab === 'assigned-to-me') {
    return (
      <tr className="border-b border-slate-100">
        <th className={`sticky left-0 z-20 bg-white px-4 ${thBase}`}>Task Name</th>
        <th className={`px-4 ${thBase}`}>Status</th>
      </tr>
    );
  }

  const nameLabel = activeTab === 'boards' ? 'Board Name' : activeTab === 'favorites' ? 'Project Name' : 'Name';
  const locationLabel = activeTab === 'boards' ? 'Project' : activeTab === 'favorites' ? 'Project Key' : 'Location';

  return (
    <tr className="border-b border-slate-100">
      <th className="py-3.5 w-[48px] border-b border-slate-100" />
      <th className={`sticky left-0 z-20 bg-white pr-4 ${thBase}`}>{nameLabel}</th>
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
      className={`group border-b-[0.8px] border-[#E5E7EB] hover:bg-gray-50/80 cursor-pointer transition-all duration-300 ${
        isDimmed ? 'opacity-20 scale-[0.99] grayscale' : 'opacity-100'
      }`}
      onClick={() => onRowClick(item)}
    >
      {activeTab === 'assigned-to-me' ? (
        <>
          <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm py-3.5 px-4 max-w-[150px] sm:max-w-[200px] xl:max-w-[280px] shadow-[6px_0_10px_-6px_rgba(0,0,0,0.08)]">
            <div className="font-outfit text-[13.5px] text-slate-900 font-bold truncate group-hover:text-blue-600 transition-colors" title={item.name}>
              {item.name}
            </div>
            <div className="font-outfit text-[10px] font-bold text-slate-400 mt-1 truncate tracking-wider uppercase">
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
          <td className="sticky left-0 z-10 bg-white/95 backdrop-blur-sm py-3.5 pr-4 text-[#101828] font-outfit text-[13.5px] font-bold whitespace-nowrap shadow-[6px_0_10px_-6px_rgba(0,0,0,0.08)]">
            {item.name}
          </td>
          <td className="py-3.5 text-slate-500 font-outfit text-[12.5px] font-medium">
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
    <div className="w-full flex items-center justify-center gap-3 mt-4 mb-2 pt-4 border-t border-gray-100/80">
      {visibleCount < totalCount && (
        <button
          onClick={onShowMore}
          className="group flex items-center gap-1.5 px-4 py-1.5 font-arimo text-[13px] font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-full shadow-sm hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50/50 transition-all active:scale-95"
        >
          <span>Show More</span>
          <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-500 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      )}
      {visibleCount > 5 && (
        <button
          onClick={onShowLess}
          className="group flex items-center gap-1.5 px-4 py-1.5 font-arimo text-[13px] font-semibold text-[#4B5563] bg-white border border-[#E5E7EB] rounded-full shadow-sm hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95"
        >
          <span>Show Less</span>
          <svg className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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
              <td colSpan={colSpan} className="border-b-[0.8px] border-[#E5E7EB]">
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

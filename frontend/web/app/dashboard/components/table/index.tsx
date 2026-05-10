'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import CoffeeLoader from '@/components/ui/CoffeeLoader';
import StatusDonutChart from '@/components/ui/StatusDonutChart';
import TaskCardModal from '@/app/taskcard/TaskCardModal';
import { useDashboardData } from './useDashboardData';
import { ItemsTable } from './ItemsTable';
import { DashboardItem, DashboardTableProps } from './types';

export default function DashboardTable({
  activeTab,
  searchQuery,
  setDashboardAssignedCount,
}: DashboardTableProps) {
  const router = useRouter();
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // ── Pagination state — resets automatically when tab or search changes ────────
  const paginationKey = `${activeTab}::${searchQuery}`;
  const [paginationState, setPaginationState] = useState({ key: paginationKey, visibleCount: 5 });
  const visibleCount = paginationState.key === paginationKey ? paginationState.visibleCount : 5;

  const updateVisibleCount = (delta: number) => {
    setPaginationState((prev) => {
      const current = prev.key === paginationKey ? prev.visibleCount : 5;
      return { key: paginationKey, visibleCount: Math.max(5, current + delta) };
    });
  };

  // ── Data fetching ─────────────────────────────────────────────────────────────
  const { items, loading } = useDashboardData({ activeTab, setDashboardAssignedCount });

  // ── Filtering (hide DONE tasks, apply search query) ───────────────────────────
  const filteredItems = items.filter((item) => {
    if (item.type === 'TASK' && item.status === 'DONE') return false;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q);
  });

  const visibleData = filteredItems.slice(0, visibleCount);

  // ── Row click handler ─────────────────────────────────────────────────────────
  const handleRowClick = (item: DashboardItem) => {
    if (item.type === 'TASK') {
      setSelectedTaskId(item.realId);
    } else {
      localStorage.setItem('currentProjectId', item.realId.toString());
      localStorage.setItem('currentProjectName', item.name);
      window.dispatchEvent(new CustomEvent('planora:project-accessed'));
      router.push(`/summary/${item.realId}`);
    }
  };

  // ── Loading state ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[40vh]">
        <CoffeeLoader />
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col-reverse lg:flex-row gap-6 lg:gap-8 items-start">
      {/* ── Table section ── */}
      <motion.div
        layout
        style={{ contentVisibility: 'auto', containIntrinsicSize: '0 500px' } as React.CSSProperties}
        className="w-full flex-1"
      >
        <ItemsTable
          activeTab={activeTab}
          searchQuery={searchQuery}
          visibleData={visibleData}
          filteredItems={filteredItems}
          visibleCount={visibleCount}
          hoveredSlice={hoveredSlice}
          onRowClick={handleRowClick}
          onShowMore={() => updateVisibleCount(5)}
          onShowLess={() => updateVisibleCount(-5)}
        />
      </motion.div>

      {/* ── Status Donut Chart (only for "Assigned to me") ── */}
      <AnimatePresence>
        {activeTab === 'assigned-to-me' && (
          <motion.div
            initial={{ opacity: 0, width: 0, scale: 0.95 }}
            animate={{ opacity: 1, width: '320px', scale: 1 }}
            exit={{ opacity: 0, width: 0, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full lg:w-[320px] shrink-0 lg:border-l border-gray-100 lg:pl-6 max-lg:pb-6 max-lg:border-b max-lg:mx-auto max-lg:max-w-[400px] bg-white lg:bg-transparent"
          >
            <StatusDonutChart items={filteredItems} onHover={setHoveredSlice} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Task Card Modal ── */}
      <AnimatePresence>
        {selectedTaskId && (
          <TaskCardModal
            taskId={selectedTaskId}
            onClose={(wasModified) => {
              setSelectedTaskId(null);
              if (wasModified) {
                window.dispatchEvent(new CustomEvent('planora:task-updated'));
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

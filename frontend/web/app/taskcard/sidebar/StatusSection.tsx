'use client';
import React, { useEffect, useState } from 'react';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Single source of truth for status display — badge color and dot color are co-located so
// adding a new status only requires one entry here, not edits across multiple render sites.
const STATUS_CONFIG: Record<string, { label: string; badge: string; dot: string }> = {
  TODO:        { label: 'To Do',       badge: 'bg-gray-100 text-gray-700',  dot: 'bg-gray-400' },
  IN_PROGRESS: { label: 'In Progress', badge: 'bg-blue-50 text-blue-700',   dot: 'bg-blue-500' },
  IN_REVIEW:   { label: 'In Review',   badge: 'bg-amber-50 text-amber-700', dot: 'bg-amber-400' },
  DONE:        { label: 'Done',        badge: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
};

const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
const STATUS_ORDER: Record<string, number> = { TODO: 0, IN_PROGRESS: 1, IN_REVIEW: 2, DONE: 3 };

interface StatusSectionProps {
  status: string;
  onUpdateStatus?: (status: string) => void;
}

const StatusSection: React.FC<StatusSectionProps> = ({ status, onUpdateStatus }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showDone, setShowDone] = useState(false);
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.TODO;

  const isBackward = (option: string) =>
    (STATUS_ORDER[option] ?? 0) < (STATUS_ORDER[status] ?? 0);

  const handleSelect = (option: string) => {
    if (option === 'DONE' && status !== 'DONE') setShowDone(true);
    onUpdateStatus?.(option);
    setIsOpen(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const close = () => setIsOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [isOpen]);

  return (
    <div>
      <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block tracking-wide">Status</label>
      <div className="relative">
        <button
          disabled={!onUpdateStatus}
          onClick={(e) => { e.stopPropagation(); setIsOpen((v) => !v); }}
          className={`w-full flex items-center justify-between px-3 py-2 min-h-[44px] sm:min-h-0 sm:py-2 border rounded text-sm font-semibold transition-colors shadow-sm ${cfg.badge} border-transparent hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-70`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span>{cfg.label}</span>
          </div>
          <ChevronDown size={16} className="opacity-60" />
        </button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 overflow-hidden">
            {STATUS_OPTIONS.map((option) => {
              const s = STATUS_CONFIG[option] ?? STATUS_CONFIG.TODO;
              const backward = isBackward(option);
              return (
                <button
                  key={option}
                  onClick={(e) => { e.stopPropagation(); handleSelect(option); }}
                  className={`w-full text-left px-3 py-2 min-h-[44px] sm:min-h-0 text-sm border-b border-gray-50 last:border-b-0 flex items-center gap-2 transition-colors hover:opacity-80 font-medium ${s.badge}`}
                  title={backward ? 'This moves the task backward in the workflow.' : undefined}
                >
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  {s.label}
                  {backward && (
                    <AlertTriangle size={12} className="ml-auto text-amber-500 flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <AnimatePresence>
        {showDone && (
          <motion.div
            className="flex items-center justify-center mt-2"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: [1.2, 1], opacity: [1, 0] }}
            transition={{ duration: 0.6 }}
            onAnimationComplete={() => setShowDone(false)}
          >
            <span className="text-2xl text-green-500">✓</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default StatusSection;

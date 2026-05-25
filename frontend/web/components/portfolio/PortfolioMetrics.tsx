'use client';

import { motion } from 'framer-motion';
import type { Portfolio } from '@/services/portfolioService';

const metrics = (p: Portfolio) => [
  { label: 'Projects',    value: p.projectCount,             color: '#155DFC' },
  { label: 'Total Tasks', value: p.totalTasks ?? 0,          color: '#4299E1' },
  { label: 'Completed',   value: p.completedTasks ?? 0,      color: '#6BC950' },
  { label: 'Overdue',     value: p.overdueTasks ?? 0,        color: '#FF5C5C' },
  { label: 'Members',     value: p.totalMembers ?? 0,        color: '#FF9F43' },
  { label: 'Health',      value: `${p.healthScore ?? 100}%`, color: '#8B5CF6' },
];

interface Props { portfolio: Portfolio }

export default function PortfolioMetrics({ portfolio }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {metrics(portfolio).map((m, i) => (
        <motion.div
          key={m.label}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
          className="bg-white rounded-xl border border-[#E8E8ED] p-4 flex flex-col gap-2.5"
        >
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${m.color}15` }}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: m.color }} />
          </div>
          <div>
            <div className="text-[#1A1A2E] font-bold text-xl leading-none">{m.value}</div>
            <div className="text-[#9CA3AF] text-xs mt-1">{m.label}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

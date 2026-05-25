'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Portfolio } from '@/services/portfolioService';

function healthInfo(score: number) {
  if (score >= 75) return { color: '#6BC950', bg: '#E6F9E0' };
  if (score >= 50) return { color: '#FF9F43', bg: '#FFF3E0' };
  return              { color: '#FF5C5C', bg: '#FFE5E5' };
}

interface Props {
  portfolio: Portfolio;
  index: number;
}

export default function PortfolioCard({ portfolio, index }: Props) {
  const score = portfolio.healthScore ?? 100;
  const hc = healthInfo(score);
  const completionPct = portfolio.totalTasks
    ? Math.round(((portfolio.completedTasks ?? 0) / portfolio.totalTasks) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -2, transition: { duration: 0.18 } }}
    >
      <Link href={`/portfolios/${portfolio.id}`}>
        <div className="bg-white rounded-2xl border border-[#E8E8ED] overflow-hidden cursor-pointer group transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]">

          {/* Color accent bar */}
          <div className="h-1" style={{ background: portfolio.color }} />

          <div className="p-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5 min-w-0">
                {portfolio.emoji && (
                  <span className="text-2xl leading-none flex-shrink-0">{portfolio.emoji}</span>
                )}
                <div className="min-w-0">
                  <h3 className="font-semibold text-[#1A1A2E] text-sm leading-tight truncate">
                    {portfolio.name}
                  </h3>
                  {portfolio.description && (
                    <p className="text-[#9CA3AF] text-xs mt-0.5 line-clamp-1">{portfolio.description}</p>
                  )}
                </div>
              </div>
              <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold"
                style={{ background: hc.bg, color: hc.color }}>
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: hc.color }} />
                {score}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: 'Projects', value: portfolio.projectCount },
                { label: 'Tasks',    value: portfolio.totalTasks ?? '—' },
                { label: 'Members',  value: portfolio.totalMembers ?? '—' },
              ].map(stat => (
                <div key={stat.label}
                  className="bg-[#F7F8FA] rounded-lg px-2 py-2 text-center border border-[#F0F0F5]">
                  <div className="text-[#1A1A2E] font-bold text-sm leading-none">{stat.value}</div>
                  <div className="text-[#9CA3AF] text-[10px] mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[#9CA3AF] text-[10px]">Completion</span>
                <span className="text-[#6B6F7B] text-[10px] font-medium">{completionPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#F0F0F5] overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: portfolio.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPct}%` }}
                  transition={{ duration: 0.8, delay: index * 0.06 + 0.25, ease: 'easeOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

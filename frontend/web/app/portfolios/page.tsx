'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { portfolioService, type Portfolio } from '@/services/portfolioService';
import PortfolioCard from '@/components/portfolio/PortfolioCard';
import CreatePortfolioModal from '@/components/portfolio/CreatePortfolioModal';

function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#E8E8ED] overflow-hidden animate-pulse">
      <div className="h-1 bg-[#E8E8ED]" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-[#F0F0F5] rounded w-2/3" />
        <div className="h-3 bg-[#F0F0F5] rounded w-1/2" />
        <div className="grid grid-cols-3 gap-2 pt-2">
          {[0,1,2].map(i => <div key={i} className="h-12 bg-[#F7F8FA] rounded-lg" />)}
        </div>
        <div className="h-1.5 bg-[#F0F0F5] rounded-full" />
      </div>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <motion.div className="flex flex-col items-center justify-center py-20 text-center"
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="w-16 h-16 rounded-2xl bg-[#EBF2FF] flex items-center justify-center mb-4 text-3xl">
        📁
      </div>
      <h3 className="text-[#1A1A2E] font-semibold text-base mb-1.5">No portfolios yet</h3>
      <p className="text-[#6B6F7B] text-sm mb-5 max-w-xs">
        Group your projects into portfolios to track cross-project health and progress.
      </p>
      <button onClick={onNew}
        className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
        style={{ background: '#155DFC' }}>
        Create your first portfolio
      </button>
    </motion.div>
  );
}

export default function PortfoliosPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    setLoadError('');
    try { setPortfolios(await portfolioService.list()); }
    catch { setLoadError('Failed to load portfolios. Please try again.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreated = (p: Portfolio) => {
    setPortfolios(prev => [p, ...prev]);
    setShowCreate(false);
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-10">

      {/* ── Mobile top bar ────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 py-3 md:hidden">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('planora:sidebar:toggle'))}
          className="p-2 -ml-1 rounded-xl text-[#6B6F7B] hover:bg-[#F0F0F5] transition-colors"
          aria-label="Toggle Sidebar"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <div className="flex-1 font-outfit text-[17px] font-extrabold tracking-tight text-[#1A1A2E] flex items-center gap-2">
          <span className="w-1.5 h-4 bg-[#155DFC] rounded-full" />
          PLANORA
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center justify-center w-8 h-8 rounded-xl text-white"
          style={{ background: '#155DFC' }}
          aria-label="New Portfolio"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </div>

      {/* ── Desktop header ─────────────────────────────────────────────── */}
      <div className="hidden sm:flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A2E] leading-tight">Portfolios</h1>
          <p className="text-[#6B6F7B] text-sm mt-0.5">
            {portfolios.length > 0
              ? `${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''}`
              : 'Aggregate projects and track cross-team progress'}
          </p>
        </div>
        <motion.button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: '#155DFC', boxShadow: '0 2px 8px rgba(21,93,252,0.25)' }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}>
          <span className="text-base leading-none">+</span>
          New Portfolio
        </motion.button>
      </div>

      {/* ── Mobile page title ──────────────────────────────────────────── */}
      <div className="md:hidden mb-3">
        <h1 className="text-xl font-bold text-[#1A1A2E] leading-tight">Portfolios</h1>
        <p className="text-[#6B6F7B] text-xs mt-0.5">
          {portfolios.length > 0
            ? `${portfolios.length} portfolio${portfolios.length !== 1 ? 's' : ''}`
            : 'Aggregate projects and track cross-team progress'}
        </p>
      </div>

      {/* View tabs */}
      <div className="flex gap-1 mb-7 bg-[#F0F0F5] p-1 rounded-xl w-full sm:w-fit">
        <Link
          href="/spaces"
          className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-lg text-[13px] font-medium text-[#6B6F7B] hover:text-[#1A1A2E] transition-colors"
        >
          All Projects
        </Link>
        <span className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-lg text-[13px] font-semibold bg-white text-[#155DFC] shadow-sm cursor-default">
          Portfolios
        </span>
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0,1,2].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-[#FF5C5C] text-sm mb-3">{loadError}</p>
          <button onClick={load}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
            style={{ background: '#155DFC' }}>
            Retry
          </button>
        </div>
      ) : portfolios.length === 0 ? (
        <EmptyState onNew={() => setShowCreate(true)} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {portfolios.map((p, i) => <PortfolioCard key={p.id} portfolio={p} index={i} />)}
        </div>
      )}

      {showCreate && (
        <CreatePortfolioModal onClose={() => setShowCreate(false)} onCreated={handleCreated} />
      )}
    </div>
  );
}

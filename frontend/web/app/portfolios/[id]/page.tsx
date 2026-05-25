'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { portfolioService, type Portfolio, type PortfolioProject } from '@/services/portfolioService';
import { fetchAllProjects, type ProjectSummary } from '@/services/projects-service';
import PortfolioMetrics from '@/components/portfolio/PortfolioMetrics';

// ── helpers ──────────────────────────────────────────────────────────────────

function healthInfo(score: number) {
  if (score >= 75) return { label: 'Healthy',  color: '#6BC950', bg: '#E6F9E0' };
  if (score >= 50) return { label: 'At Risk',  color: '#FF9F43', bg: '#FFF3E0' };
  return              { label: 'Critical', color: '#FF5C5C', bg: '#FFE5E5' };
}

// ── Add-project panel ─────────────────────────────────────────────────────────

function AddProjectPanel({
  available, adding, onAdd, onClose, portfolioColor,
}: {
  available: ProjectSummary[];
  adding: number | null;
  onAdd: (id: number) => void;
  onClose: () => void;
  portfolioColor: string;
}) {
  const [search, setSearch] = useState('');
  const filtered = available.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.18 }}
      className="bg-white rounded-xl border border-[#E8E8ED] shadow-[0_4px_16px_rgba(0,0,0,0.08)] overflow-hidden mt-2">

      {/* Search */}
      <div className="p-3 border-b border-[#F0F0F5]">
        <input
          autoFocus
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search projects…"
          className="w-full rounded-lg px-3 py-1.5 text-xs text-[#1A1A2E] placeholder-[#9CA3AF] outline-none"
          style={{ background: '#F7F8FA', border: '1px solid #E8E8ED' }}
        />
      </div>

      {/* Project list */}
      <div className="max-h-52 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-[#9CA3AF] text-xs py-6">
            {available.length === 0 ? 'All projects already added' : 'No projects found'}
          </p>
        ) : filtered.map(p => (
          <button key={p.id} onClick={() => onAdd(p.id)}
            disabled={adding === p.id}
            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F8FA] transition-colors text-left disabled:opacity-60">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{ background: `${portfolioColor}18`, color: portfolioColor }}>
              {p.name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[#1A1A2E] text-sm font-medium truncate">{p.name}</p>
              {p.projectKey && <p className="text-[#9CA3AF] text-xs">{p.projectKey}</p>}
            </div>
            <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold"
              style={{
                background: p.type === 'AGILE' ? '#EBF2FF' : '#E6F9E0',
                color:      p.type === 'AGILE' ? '#155DFC' : '#6BC950',
              }}>
              {p.type === 'AGILE' ? 'Sprint' : 'Kanban'}
            </span>
            <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
              {adding === p.id ? (
                <div className="w-3.5 h-3.5 rounded-full border-2 border-[#155DFC]/30 border-t-[#155DFC] animate-spin" />
              ) : (
                <span className="text-[#155DFC] font-bold text-lg leading-none">+</span>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Close */}
      <div className="border-t border-[#F0F0F5] px-4 py-2.5 flex justify-end">
        <button onClick={onClose} className="text-xs text-[#6B6F7B] hover:text-[#1A1A2E] transition-colors">
          Close
        </button>
      </div>
    </motion.div>
  );
}

// ── Project row ───────────────────────────────────────────────────────────────

function ProjectRow({
  project, color, onRemove, removing,
}: {
  project: PortfolioProject;
  color: string;
  onRemove: () => void;
  removing: boolean;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F7F8FA] transition-colors group">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
        style={{ background: `${color}18`, color }}>
        {project.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[#1A1A2E] text-sm font-medium truncate">{project.name}</p>
        <p className="text-[#9CA3AF] text-xs">{project.projectKey} · {project.teamName ?? project.type}</p>
      </div>
      <span className="flex-shrink-0 px-2 py-0.5 rounded-md text-[10px] font-semibold"
        style={{
          background: project.type === 'AGILE' ? '#EBF2FF' : '#E6F9E0',
          color:      project.type === 'AGILE' ? '#155DFC' : '#6BC950',
        }}>
        {project.type === 'AGILE' ? 'Sprint' : 'Kanban'}
      </span>
      <button
        onClick={onRemove}
        disabled={removing}
        className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md opacity-0 group-hover:opacity-100 transition-all hover:bg-[#FFE5E5] disabled:opacity-40"
        title="Remove from portfolio">
        {removing ? (
          <div className="w-3 h-3 rounded-full border-2 border-[#FF5C5C]/30 border-t-[#FF5C5C] animate-spin" />
        ) : (
          <span className="text-[#FF5C5C] text-xs font-bold leading-none">✕</span>
        )}
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Project panel state
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [allProjects, setAllProjects] = useState<ProjectSummary[]>([]);
  const [addingProject, setAddingProject] = useState<number | null>(null);
  const [removingProject, setRemovingProject] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    portfolioService.get(Number(id))
      .then(setPortfolio)
      .catch(() => setError('Failed to load portfolio'))
      .finally(() => setLoading(false));
  }, [id]);

  // Load all user projects for the add-panel
  useEffect(() => {
    fetchAllProjects().then(setAllProjects).catch(() => {});
  }, []);

  // Projects not yet in this portfolio
  const availableProjects = allProjects.filter(
    p => !portfolio?.projects?.some(pp => pp.id === p.id)
  );

  // Re-fetch full portfolio so metrics (tasks, health, members) stay accurate
  const refreshPortfolio = useCallback(async () => {
    if (!id) return;
    try {
      const updated = await portfolioService.get(Number(id));
      setPortfolio(updated);
    } catch {}
  }, [id]);

  const handleAddProject = useCallback(async (projectId: number) => {
    if (!portfolio) return;
    setAddingProject(projectId);
    try {
      await portfolioService.addProject(portfolio.id, projectId);
      await refreshPortfolio();
    } catch {} finally {
      setAddingProject(null);
    }
  }, [portfolio, refreshPortfolio]);

  const handleRemoveProject = useCallback(async (projectId: number) => {
    if (!portfolio) return;
    setRemovingProject(projectId);
    // Optimistic: remove from list immediately for instant feedback
    setPortfolio(prev => prev ? {
      ...prev,
      projectCount: Math.max(0, prev.projectCount - 1),
      projects: prev.projects?.filter(p => p.id !== projectId),
    } : prev);
    try {
      await portfolioService.removeProject(portfolio.id, projectId);
      await refreshPortfolio(); // sync metrics after actual deletion
    } catch {
      await refreshPortfolio(); // revert on failure
    } finally {
      setRemovingProject(null);
    }
  }, [portfolio, refreshPortfolio]);

  // ── render ──

  if (loading) return (
    <div className="w-full flex items-center justify-center py-24">
      <div className="w-8 h-8 rounded-full border-2 border-[#155DFC]/20 border-t-[#155DFC] animate-spin" />
    </div>
  );

  if (error || !portfolio) return (
    <div className="w-full flex flex-col items-center justify-center py-24 text-center">
      <p className="text-[#6B6F7B] text-sm mb-3">{error || 'Portfolio not found'}</p>
      <button onClick={() => router.push('/portfolios')}
        className="text-[#155DFC] text-sm hover:underline">← Back to portfolios</button>
    </div>
  );

  const hc = healthInfo(portfolio.healthScore ?? 100);
  const completionPct = portfolio.totalTasks
    ? Math.round(((portfolio.completedTasks ?? 0) / portfolio.totalTasks) * 100)
    : 0;

  return (
    <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-6 pb-10">

      {/* Back */}
      <motion.button onClick={() => router.push('/portfolios')}
        className="flex items-center gap-1.5 text-[#6B6F7B] hover:text-[#1A1A2E] text-sm transition-colors mb-6 group"
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
        <span className="transition-transform group-hover:-translate-x-0.5">←</span>
        Portfolios
      </motion.button>

      {/* Hero card */}
      <motion.div className="bg-white rounded-2xl border border-[#E8E8ED] shadow-sm overflow-hidden mb-6"
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
        <div className="h-1.5" style={{ background: portfolio.color }} />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
            <div className="flex items-start gap-3 min-w-0">
              {portfolio.emoji && <span className="text-3xl leading-none flex-shrink-0">{portfolio.emoji}</span>}
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-[#1A1A2E] leading-tight">{portfolio.name}</h1>
                {portfolio.description && (
                  <p className="text-[#6B6F7B] text-sm mt-1 max-w-xl">{portfolio.description}</p>
                )}
                <p className="text-[#9CA3AF] text-xs mt-1.5">by {portfolio.ownerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl flex-shrink-0"
              style={{ background: hc.bg }}>
              <div className="w-2 h-2 rounded-full" style={{ background: hc.color }} />
              <span className="text-sm font-semibold" style={{ color: hc.color }}>{hc.label}</span>
              <span className="text-sm font-bold ml-0.5" style={{ color: hc.color }}>{portfolio.healthScore ?? 100}%</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[#9CA3AF] text-xs">Overall completion</span>
              <span className="text-[#6B6F7B] text-xs font-medium">{completionPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-[#F0F0F5] overflow-hidden">
              <motion.div className="h-full rounded-full"
                style={{ background: portfolio.color }}
                initial={{ width: 0 }}
                animate={{ width: `${completionPct}%` }}
                transition={{ duration: 0.9, ease: 'easeOut', delay: 0.2 }} />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Metrics */}
      <motion.div className="mb-6"
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <h2 className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-widest mb-3">Metrics</h2>
        <PortfolioMetrics portfolio={portfolio} />
      </motion.div>

      {/* Projects */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>

        {/* Section header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#9CA3AF] text-xs font-semibold uppercase tracking-widest">
            Projects ({portfolio.projectCount})
          </h2>
          <button
            onClick={() => setShowAddPanel(v => !v)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: showAddPanel ? '#6B6F7B' : '#155DFC' }}>
            {showAddPanel ? '✕ Close' : '+ Add Project'}
          </button>
        </div>

        {/* Add project panel */}
        <AnimatePresence>
          {showAddPanel && (
            <AddProjectPanel
              available={availableProjects}
              adding={addingProject}
              onAdd={id => handleAddProject(id)}
              onClose={() => setShowAddPanel(false)}
              portfolioColor={portfolio.color}
            />
          )}
        </AnimatePresence>

        {/* Project list */}
        <div className="bg-white rounded-2xl border border-[#E8E8ED] shadow-sm overflow-hidden mt-2">
          {portfolio.projects && portfolio.projects.length > 0 ? (
            <div className="p-2 grid grid-cols-1 md:grid-cols-2 gap-0.5">
              {portfolio.projects.map((proj, i) => (
                <motion.div key={proj.id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ delay: i * 0.04 + 0.1 }}>
                  <ProjectRow
                    project={proj}
                    color={portfolio.color}
                    onRemove={() => handleRemoveProject(proj.id)}
                    removing={removingProject === proj.id}
                  />
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <p className="text-[#9CA3AF] text-sm mb-2">No projects yet</p>
              <button
                onClick={() => setShowAddPanel(true)}
                className="text-[#155DFC] text-sm hover:underline">
                + Add your first project
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

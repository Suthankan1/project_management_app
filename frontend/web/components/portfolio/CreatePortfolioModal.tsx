'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { portfolioService, type Portfolio } from '@/services/portfolioService';
import { fetchAllProjects, type ProjectSummary } from '@/services/projects-service';

const COLORS = ['#155DFC','#0C4DDA','#4299E1','#6BC950','#FF9F43','#FF5C5C','#8B5CF6','#EC4899'];
const EMOJIS = ['📁','🚀','💼','⚡','🎯','💡','🌟','🔥','🏆','📊'];

interface Props {
  onClose: () => void;
  onCreated: (p: Portfolio) => void;
}

export default function CreatePortfolioModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [emoji, setEmoji] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Project selection
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [projectSearch, setProjectSearch] = useState('');
  const [showProjects, setShowProjects] = useState(false);
  const [projectsLoading, setProjectsLoading] = useState(false);

  useEffect(() => {
    setProjectsLoading(true);
    fetchAllProjects()
      .then(setProjects)
      .catch(() => {})
      .finally(() => setProjectsLoading(false));
  }, []);

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(projectSearch.toLowerCase())
  );

  const toggleProject = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const submit = async () => {
    if (!name.trim()) { setError('Portfolio name is required'); return; }
    setLoading(true);
    setError('');
    try {
      const p = await portfolioService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        color,
        emoji: emoji || undefined,
        projectIds: selectedIds.length > 0 ? selectedIds : undefined,
      });
      onCreated(p);
    } catch {
      setError('Failed to create portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

        <motion.div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />

        <motion.div
          className="relative w-full max-w-md bg-white rounded-2xl shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-[#E8E8ED] overflow-hidden z-10 max-h-[90vh] flex flex-col"
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 380, damping: 36 }}>

          <div className="h-1 flex-shrink-0" style={{ background: color }} />

          <div className="overflow-y-auto flex-1 p-6">
            <h2 className="text-[#1A1A2E] text-base font-semibold mb-5">New Portfolio</h2>

            {/* Emoji picker */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(emoji === e ? '' : e)}
                  className={`w-9 h-9 rounded-lg text-lg transition-all border ${
                    emoji === e
                      ? 'border-[#155DFC] bg-[#EBF2FF] scale-110'
                      : 'border-[#E8E8ED] bg-[#F7F8FA] opacity-70 hover:opacity-100'
                  }`}>
                  {e}
                </button>
              ))}
            </div>

            {/* Name */}
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()}
              placeholder="Portfolio name *"
              className="w-full rounded-xl px-4 py-2.5 text-sm text-[#1A1A2E] placeholder-[#9CA3AF] mb-3 outline-none transition-colors"
              style={{ background: '#F7F8FA', border: '1px solid #E8E8ED' }}
            />

            {/* Description */}
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Description (optional)"
              rows={2}
              className="w-full rounded-xl px-4 py-2.5 text-sm text-[#1A1A2E] placeholder-[#9CA3AF] mb-4 outline-none resize-none"
              style={{ background: '#F7F8FA', border: '1px solid #E8E8ED' }}
            />

            {/* Color picker */}
            <div className="mb-5">
              <p className="text-[#9CA3AF] text-xs mb-2">Accent color</p>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-all border-2 ${
                      color === c ? 'scale-125 border-white' : 'border-transparent opacity-70 hover:opacity-100 hover:scale-110'
                    }`}
                    style={{ background: c, boxShadow: color === c ? `0 0 0 2px ${c}60` : undefined }} />
                ))}
              </div>
            </div>

            {/* Projects section */}
            <div className="border border-[#E8E8ED] rounded-xl overflow-hidden mb-4">
              <button
                onClick={() => setShowProjects(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-[#1A1A2E] font-medium hover:bg-[#F7F8FA] transition-colors">
                <span className="flex items-center gap-2">
                  <span>Add projects</span>
                  {selectedIds.length > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white"
                      style={{ background: color }}>
                      {selectedIds.length}
                    </span>
                  )}
                </span>
                <span className={`text-[#9CA3AF] text-xs transition-transform ${showProjects ? 'rotate-180' : ''}`}>▼</span>
              </button>

              <AnimatePresence>
                {showProjects && (
                  <motion.div
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
                    <div className="border-t border-[#E8E8ED]">
                      <div className="px-3 py-2">
                        <input
                          value={projectSearch}
                          onChange={e => setProjectSearch(e.target.value)}
                          placeholder="Search projects..."
                          className="w-full rounded-lg px-3 py-1.5 text-xs text-[#1A1A2E] placeholder-[#9CA3AF] outline-none"
                          style={{ background: '#F7F8FA', border: '1px solid #E8E8ED' }}
                        />
                      </div>
                      <div className="max-h-40 overflow-y-auto">
                        {projectsLoading ? (
                          <p className="text-center text-[#9CA3AF] text-xs py-4">Loading…</p>
                        ) : filteredProjects.length === 0 ? (
                          <p className="text-center text-[#9CA3AF] text-xs py-4">No projects found</p>
                        ) : filteredProjects.map(p => {
                          const selected = selectedIds.includes(p.id);
                          return (
                            <button key={p.id} onClick={() => toggleProject(p.id)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#F7F8FA] transition-colors">
                              <div className={`w-4 h-4 rounded flex items-center justify-center flex-shrink-0 border transition-colors ${
                                selected ? 'border-transparent' : 'border-[#D1D5DB]'
                              }`} style={selected ? { background: color } : {}}>
                                {selected && <span className="text-white text-[10px] font-bold">✓</span>}
                              </div>
                              <div className="min-w-0 flex-1 text-left">
                                <p className="text-[#1A1A2E] text-xs font-medium truncate">{p.name}</p>
                                {p.projectKey && (
                                  <p className="text-[#9CA3AF] text-[10px]">{p.projectKey}</p>
                                )}
                              </div>
                              <span className="flex-shrink-0 px-1.5 py-0.5 rounded text-[9px] font-semibold"
                                style={{
                                  background: p.type === 'AGILE' ? '#EBF2FF' : '#E6F9E0',
                                  color:      p.type === 'AGILE' ? '#155DFC' : '#6BC950',
                                }}>
                                {p.type === 'AGILE' ? 'Sprint' : 'Kanban'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {error && <p className="text-[#FF5C5C] text-xs mb-3">{error}</p>}
          </div>

          {/* Actions — always visible at bottom */}
          <div className="px-6 pb-6 pt-2 flex-shrink-0 flex gap-2.5 border-t border-[#F0F0F5]">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6F7B] font-medium transition-all hover:bg-[#F7F8FA] border border-[#E8E8ED]">
              Cancel
            </button>
            <button onClick={submit} disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm text-white font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: color }}>
              {loading ? 'Creating…' : `Create${selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

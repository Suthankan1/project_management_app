'use client';
import React, { useEffect, useState } from 'react';
import { Flag, ChevronDown, X } from 'lucide-react';
import { getMilestones, createMilestone } from '@/services/milestone-service';
import type { MilestoneResponse } from '@/types';
import SidebarField from './SidebarField';

interface MilestoneSectionProps {
  projectId?: number;
  milestoneId?: number | null;
  milestoneName?: string | null;
  onUpdateMilestone?: (milestoneId: number | null) => void;
}

const MilestoneSection: React.FC<MilestoneSectionProps> = ({
  projectId, milestoneId, milestoneName, onUpdateMilestone,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [milestones, setMilestones] = useState<MilestoneResponse[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    if (!projectId) return;
    getMilestones(projectId).then(setMilestones).catch(() => setMilestones([]));
  }, [projectId]);

  useEffect(() => {
    if (!isOpen) return;
    // Document-level click closes the dropdown when the user clicks anywhere outside it
    const close = () => setIsOpen(false);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [isOpen]);

  const handleSelect = (id: number | null) => {
    onUpdateMilestone?.(id);
    setIsOpen(false);
    setShowCreate(false);
  };

  const handleCreate = async () => {
    if (!projectId || !newName.trim()) return;
    try {
      const created = await createMilestone(projectId, { name: newName.trim() });
      setMilestones((prev) => [...prev, created]);
      handleSelect(created.id);
      setNewName('');
    } catch {
      // ignore
    }
  };

  return (
    <SidebarField label="Milestone">
      <div className="relative">
        <button
          onClick={(e) => { e.stopPropagation(); setIsOpen((v) => !v); }}
          className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-cu-hover border border-transparent hover:border-cu-border w-full text-left transition-all"
        >
          <Flag size={14} className={milestoneId ? 'text-violet-500' : 'text-cu-text-muted'} />
          <span className={milestoneId ? 'text-cu-text-primary' : 'text-cu-text-muted italic'}>
            {milestoneName ?? 'No milestone'}
          </span>
          <ChevronDown size={12} className="ml-auto text-cu-text-muted opacity-60" />
        </button>
        {isOpen && (
          <div
            className="absolute top-full left-0 right-0 mt-1 bg-cu-bg border border-cu-border rounded-lg shadow-cu-lg z-10 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {milestoneId && (
              <button
                onClick={() => handleSelect(null)}
                className="w-full text-left px-3 py-2 text-sm text-cu-text-secondary hover:bg-cu-hover border-b border-cu-border flex items-center gap-2"
              >
                <X size={12} /> Clear milestone
              </button>
            )}
            {milestones.map((m) => (
              <button
                key={m.id}
                onClick={() => handleSelect(m.id)}
                className={`w-full text-left px-3 py-2 text-sm border-b border-cu-border last:border-b-0 flex items-center gap-2 transition-colors hover:bg-violet-500/10 ${m.id === milestoneId ? 'text-violet-500 font-medium' : 'text-cu-text-primary'}`}
              >
                <Flag size={12} className="text-violet-400 shrink-0" />
                {m.name}
              </button>
            ))}
            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className="w-full text-left px-3 py-2 text-sm text-cu-primary hover:bg-cu-primary/10 flex items-center gap-2"
              >
                + Create milestone
              </button>
            ) : (
              <div className="p-2 border-t border-cu-border">
                <input
                  autoFocus
                  type="text"
                  placeholder="Milestone name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') void handleCreate();
                    if (e.key === 'Escape') setShowCreate(false);
                  }}
                  className="w-full border border-cu-border bg-cu-bg text-cu-text-primary rounded px-2 py-1 text-sm focus:outline-none focus:border-cu-primary mb-2"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => void handleCreate()}
                    className="flex-1 px-2 py-1 bg-cu-primary text-white text-xs rounded hover:bg-cu-primary-hover transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => { setShowCreate(false); setNewName(''); }}
                    className="flex-1 px-2 py-1 bg-cu-bg-secondary text-cu-text-primary text-xs rounded hover:bg-cu-bg-tertiary transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarField>
  );
};

export default MilestoneSection;

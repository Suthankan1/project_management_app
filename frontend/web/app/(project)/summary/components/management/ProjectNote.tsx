'use client';

import React, { useState, useEffect } from 'react';
import { Edit3, Check, Loader2 } from 'lucide-react';
import { updateProjectDetails } from '@/services/projects-service';
import useSWR, { mutate } from 'swr';
import { toast } from '@/components/ui/Toast';
import api from '@/lib/axios';
import { motion } from 'framer-motion';

const DELIMITER = '|||AUTHOR:';

function parseNote(raw: string) {
  if (!raw) return { text: '', author: '' };
  const parts = raw.split(DELIMITER);
  if (parts.length >= 2) return { text: parts[0], author: parts[1] };
  return { text: raw, author: '' };
}

function serializeNote(text: string, author: string) {
  return author ? text + DELIMITER + author : text;
}

/**
 * A collaborative note widget for the project summary.
 * Allows members to jot down and persist project-wide descriptions or rules.
 */
export function ProjectNote({ projectId, defaultNote = '' }: { projectId: number | string; defaultNote?: string }) {
  const parsedDefault = parseNote(defaultNote);
  const [isEditing, setIsEditing] = useState(false);
  const [note, setNote] = useState(parsedDefault.text);
  const [isSaving, setIsSaving] = useState(false);

  const { data: currentUser } = useSWR('/api/user/me', (url) => api.get(url).then(res => res.data));
  const authorName = currentUser?.fullName || currentUser?.username || 'Team Member';

  useEffect(() => {
    if (!isEditing) setNote(parseNote(defaultNote).text);
  }, [defaultNote, isEditing]);

  const handleSave = async () => {
    if (note === parsedDefault.text) {
      setIsEditing(false);
      return;
    }
    setIsSaving(true);
    try {
      await updateProjectDetails(projectId, { description: serializeNote(note, authorName) });
      mutate(`/api/projects/${projectId}`);
      setIsEditing(false);
      toast('Project note updated', 'success');
    } catch (err) {
      toast('Failed to update project note', 'error');
      setNote(parsedDefault.text);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col h-full w-full relative overflow-hidden">
      <div className="flex-1 p-0 relative w-full h-full overflow-hidden">
        {/* Floating Controls */}
        <div className="absolute top-2 right-3 z-10 flex items-center gap-2">
          {!isEditing && parsedDefault.author && (
            <span className="text-[10px] text-gray-400 italic hidden sm:block">
              Last edited by <span className="font-semibold text-gray-500">{parsedDefault.author}</span>
            </span>
          )}
          <button
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
            disabled={isSaving}
            className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md border shadow-sm transition-all ${isEditing ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
          >
            {isEditing ? (isSaving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />) : <Edit3 size={12} />}
            {isEditing ? (isSaving ? 'Saving...' : 'Save') : 'Edit'}
          </button>
        </div>

        {isEditing ? (
          <textarea
            autoFocus
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Jot down important rules, goals, or notes for this project..."
            className="absolute inset-0 w-full h-full px-4 pt-11 pb-4 resize-none bg-amber-50/20 text-[13px] font-arimo text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-200 border-none transition-all custom-scrollbar"
          />
        ) : (
          <div
            className="absolute inset-0 w-full h-full px-4 pt-11 pb-4 overflow-y-auto text-[13px] font-arimo text-gray-800 whitespace-pre-wrap cursor-text hover:bg-gray-50/50 transition-colors custom-scrollbar"
            onClick={() => setIsEditing(true)}
          >
            {note || <span className="text-gray-400 italic">Click to write a shared project note or summary...</span>}
          </div>
        )}
      </div>
    </motion.div>
  );
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GitBranch, Loader2, X } from 'lucide-react';
import api from '@/lib/axios';
import { getGitHubToken, type GitHubIssue } from '@/services/githubService';
import { IssueStateBadge } from '@/components/github/IssueStateBadge';

interface ImportIssueModalProps {
  issue: GitHubIssue;
  projectId: string;
  repoFullName: string;
  onSuccess: (taskId: number) => void;
  onClose: () => void;
}

interface ImportIssueResponse {
  imported: number[];
  skipped: number[];
}

function formatBodyPreview(body?: string): string {
  if (!body?.trim()) return 'No description provided.';
  return body.trim().replace(/\n{3,}/g, '\n\n');
}

export function ImportIssueModal({ issue, projectId, repoFullName, onSuccess, onClose }: ImportIssueModalProps) {
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const successTimerRef = useRef<number | null>(null);

  const bodyPreview = useMemo(() => formatBodyPreview(issue.body), [issue.body]);

  useEffect(() => {
    return () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const handleImport = async () => {
    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const githubToken = getGitHubToken();
      const response = await api.post<ImportIssueResponse>('/api/github/issues/import', {
        projectId,
        repoFullName,
        issueNumbers: [issue.number],
      }, {
        headers: githubToken ? { 'X-GitHub-Token': githubToken } : undefined,
      });

      const taskId = response.data.imported?.[0];
      if (typeof taskId !== 'number') {
        throw new Error(
          response.data.skipped?.includes(issue.number)
            ? 'This issue has already been imported or is no longer available.'
            : 'The issue could not be imported.',
        );
      }

      setSuccessMessage('Task created!');
      successTimerRef.current = window.setTimeout(() => {
        onSuccess(taskId);
      }, 700);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Failed to import issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
              <GitBranch size={16} />
            </div>
            <div>
              <h3 className="text-base font-outfit font-bold text-slate-800">Import as Task</h3>
              <p className="text-xs font-outfit text-slate-400">Create a Planora task from this GitHub issue</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-outfit font-bold text-slate-400">#{issue.number}</span>
                  <IssueStateBadge state={issue.state} size="md" />
                </div>
                <p className="mt-2 text-sm font-outfit font-semibold leading-snug text-slate-800 line-clamp-2">
                  {issue.title}
                </p>
              </div>

              {issue.assignees.slice(0, 3).length > 0 && (
                <div className="flex items-center -space-x-2">
                  {issue.assignees.slice(0, 3).map((assignee, index) => {
                    const login = typeof assignee === 'string' ? assignee : assignee.login;
                    const avatarUrl = typeof assignee === 'string' ? null : assignee.avatar_url;

                    return (
                      <div key={`${login}-${index}`} className="relative" title={`@${login}`}>
                        {avatarUrl ? (
                          <Image
                            src={avatarUrl}
                            alt={login}
                            width={28}
                            height={28}
                            className="h-7 w-7 rounded-full border-2 border-white object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-slate-200 text-[10px] font-outfit font-bold text-slate-500">
                            {login.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {issue.labels.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {issue.labels.map(label => (
                  <span
                    key={`${label.name}-${label.color}`}
                    className="rounded-full px-2 py-0.5 text-[10px] font-outfit font-semibold"
                    style={{
                      backgroundColor: `#${label.color}22`,
                      color: `#${label.color}`,
                      border: `1px solid #${label.color}44`,
                    }}
                  >
                    {label.name}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-outfit font-semibold uppercase tracking-wide text-slate-400">Body preview</p>
              <p className="mt-1.5 line-clamp-3 text-sm font-outfit leading-relaxed text-slate-600">
                {bodyPreview}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            {successMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-outfit font-semibold text-emerald-700">
                {successMessage}
              </div>
            )}
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-outfit font-semibold text-red-700">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-outfit font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleImport()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-outfit font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {loading ? 'Importing…' : 'Import Task'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ImportIssueModal;

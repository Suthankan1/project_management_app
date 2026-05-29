'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, Loader2 } from 'lucide-react';
import type { GithubCIUpdate } from '@/hooks/useGithubCISocket';

interface CIStatusBannerProps {
  update: GithubCIUpdate | null;
  repoFullName: string;
}

export default function CIStatusBanner({ update, repoFullName }: CIStatusBannerProps) {
  const [dismissedUpdateKey, setDismissedUpdateKey] = useState<string | null>(null);
  const updateKey = update
    ? `${update.status}:${update.workflow}:${update.branch}:${update.commitSha}`
    : null;

  useEffect(() => {
    if (!update || update.status !== 'success' || !updateKey) return;

    const timerId = window.setTimeout(() => {
      setDismissedUpdateKey(updateKey);
    }, 5000);

    return () => window.clearTimeout(timerId);
  }, [update, updateKey]);

  if (!update || updateKey === dismissedUpdateKey) return null;

  const commitUrl = `https://github.com/${repoFullName}/commit/${update.commitSha}/checks`;
  const shortSha = update.commitSha.slice(0, 7);
  const appearance = update.status === 'failure'
    ? {
        label: 'CI failed',
        className: 'border-red-200 bg-red-50 text-red-700',
        icon: <span aria-hidden="true" className="text-lg">{'\u274C'}</span>,
      }
    : update.status === 'success'
      ? {
          label: 'CI passed',
          className: 'border-emerald-200 bg-emerald-50 text-emerald-700',
          icon: <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />,
        }
      : {
          label: 'CI running',
          className: 'border-amber-200 bg-amber-50 text-amber-700',
          icon: <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden="true" />,
        };

  return (
    <div
      role={update.status === 'failure' ? 'alert' : 'status'}
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 shadow-sm ${appearance.className}`}
    >
      {appearance.icon}
      <div className="min-w-0 flex-1 text-sm font-outfit">
        <p className="font-semibold">{appearance.label}: {update.workflow}</p>
        <p className="truncate opacity-90">
          {update.branch} <span className="font-mono">({shortSha})</span>
        </p>
      </div>
      <a
        href={commitUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 text-xs font-outfit font-semibold hover:underline"
      >
        View on GitHub
        <ExternalLink size={11} />
      </a>
    </div>
  );
}

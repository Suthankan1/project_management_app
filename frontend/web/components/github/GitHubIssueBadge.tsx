'use client';

import GitHubMark from '@/components/github/GitHubMark';

interface GitHubIssueBadgeProps {
  issueNumber: number;
  repoFullName: string;
  size?: 'xs' | 'sm';
  linkToGitHub?: boolean;
}

const sizeClasses = {
  xs: 'text-[10px] px-2 py-0.5',
  sm: 'text-[10px] px-2.5 py-1',
} as const;

export function GitHubIssueBadge({ issueNumber, repoFullName, size = 'xs', linkToGitHub = true }: GitHubIssueBadgeProps) {
  const pill = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-slate-800 text-white font-mono font-semibold shadow-sm ${sizeClasses[size]}`}
      title={`Imported from GitHub: ${repoFullName}#${issueNumber}`}
    >
      <GitHubMark size={10} className="text-white" />
      <span>#{issueNumber}</span>
    </span>
  );

  if (!linkToGitHub) return pill;

  return (
    <a
      href={`https://github.com/${repoFullName}/issues/${issueNumber}`}
      target="_blank"
      rel="noopener noreferrer"
      title={`Imported from GitHub: ${repoFullName}#${issueNumber}`}
      className="inline-flex"
    >
      {pill}
    </a>
  );
}

export default GitHubIssueBadge;
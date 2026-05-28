'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { PageItem } from '@/types';

/**
 * Displays a list of the most recent documentation pages associated with the project.
 */
export function ProjectDocs({
  projectId,
  pages = [],
  isLoading = false,
}: {
  projectId: number;
  pages?: PageItem[];
  isLoading?: boolean;
}) {
  const recentPages = useMemo(
    () => [...pages]
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, 3),
    [pages]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-10 bg-cu-bg-secondary rounded-lg animate-pulse" />)}
      </div>
    );
  }

  return (
    <div className="h-full">
      {recentPages.length === 0 ? (
        <p className="text-[13px] text-cu-text-muted bg-cu-bg-secondary p-4 rounded-lg text-center border border-dashed border-cu-border">
          No documents found.
        </p>
      ) : (
        <div className="space-y-3">
          {recentPages.map(page => (
            <Link key={page.id} href={`/project/${projectId}/pages/${page.id}`} className="flex items-center gap-2 p-2 hover:bg-cu-hover rounded-lg border border-transparent hover:border-cu-border transition-all group">
              <span className="bg-cu-primary/10 text-cu-primary p-1.5 rounded-md group-hover:bg-cu-primary group-hover:text-white transition-colors">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" /><polyline points="13 2 13 9 20 9" />
                </svg>
              </span>
              <span className="text-[13px] text-cu-text-primary font-medium truncate flex-1">{page.title}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

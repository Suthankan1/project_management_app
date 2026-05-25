'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Circle, MessageSquare, User } from 'lucide-react';
import { type GitHubIssue } from '@/services/githubService';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

interface IssueCardProps {
  issue: GitHubIssue;
  onImport?: (issue: GitHubIssue) => void;
  isImported?: boolean;
}

function stateStyles(state: GitHubIssue['state']): { badge: string; icon: string } {
  if (state === 'open') {
    return {
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      icon: 'text-emerald-500',
    };
  }

  return {
    badge: 'bg-violet-50 text-violet-700 border-violet-100',
    icon: 'text-violet-500',
  };
}

function labelStyles(color: string): { backgroundColor: string; color: string; border: string } {
  return {
    backgroundColor: `#${color}22`,
    color: `#${color}`,
    border: `1px solid #${color}44`,
  };
}

export function IssueCard({ issue, onImport, isImported = false }: IssueCardProps) {
  const stateStyle = stateStyles(issue.state);
  const visibleAssignees = issue.assignees.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="group relative flex flex-col gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors"
    >
      {isImported && (
        <span className="absolute top-4 right-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-outfit font-semibold text-emerald-700">
          Imported
        </span>
      )}

      <div className="flex items-center gap-2 pr-20">
        <a
          href={issue.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-outfit font-bold transition-colors ${stateStyle.badge} hover:border-slate-300`}
        >
          <Circle size={11} className={stateStyle.icon} fill="currentColor" strokeWidth={2} />
          #{issue.number}
        </a>
        <span className="ml-auto text-[11px] text-slate-400 font-outfit shrink-0">
          {timeAgo(issue.updatedAt)}
        </span>
      </div>

      <a
        href={issue.htmlUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-outfit font-semibold text-slate-800 leading-snug line-clamp-2 hover:text-blue-600 transition-colors"
      >
        {issue.title}
      </a>

      {issue.labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {issue.labels.slice(0, 4).map(label => (
            <span
              key={`${label.name}-${label.color}`}
              className="px-1.5 py-0.5 rounded-full text-[10px] font-outfit font-semibold"
              style={labelStyles(label.color)}
            >
              {label.name}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-outfit">
        <div className="flex items-center">
          {visibleAssignees.length > 0 ? (
            visibleAssignees.map((assignee, index) => {
              const isFirst = index === 0;
              const login = typeof assignee === 'string' ? assignee : assignee.login;
              const avatarUrl = typeof assignee === 'string' ? null : assignee.avatar_url;
              return (
                <div
                  key={`${login}-${index}`}
                  className={`relative ${!isFirst ? '-ml-2' : ''}`}
                  style={{ zIndex: visibleAssignees.length - index }}
                  title={`@${login}`}
                >
                  {avatarUrl ? (
                    <Image
                      src={avatarUrl}
                      alt={login}
                      width={20}
                      height={20}
                      className="rounded-full ring-2 ring-white"
                      unoptimized
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-white">
                      <User size={11} className="text-slate-400" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-white">
              <User size={11} className="text-slate-400" />
            </div>
          )}
        </div>

        <span className="flex items-center gap-1.5">
          <MessageSquare size={11} className="text-slate-400" />
          {issue.comments}
        </span>

        <span className="text-slate-400">{timeAgo(issue.updatedAt)}</span>

        {onImport && !isImported && (
          <button
            type="button"
            onClick={() => onImport(issue)}
            className="ml-auto inline-flex items-center rounded-xl bg-slate-900 px-3 py-1.5 text-[11px] font-outfit font-semibold text-white shadow-sm transition-all duration-200 opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto hover:bg-slate-800"
          >
            Import as Task
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default IssueCard;

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

function stateStyles(state: GitHubIssue['state']): { badge: string; icon: string; glow: string } {
  if (state === 'open') {
    return {
      badge: 'text-emerald-300 bg-emerald-400/10 border-emerald-400/25',
      icon: 'text-emerald-400',
      glow: 'shadow-[0_0_8px_rgba(52,211,153,0.3)]',
    };
  }
  return {
    badge: 'text-purple-300 bg-purple-400/10 border-purple-400/25',
    icon: 'text-purple-400',
    glow: '',
  };
}

export function IssueCard({ issue, onImport, isImported = false }: IssueCardProps) {
  const stateStyle = stateStyles(issue.state);
  const visibleAssignees = issue.assignees.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        y: -3,
        boxShadow: '0 12px 40px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.1)',
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="group relative flex flex-col gap-3 p-4 rounded-2xl transition-all"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.09)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
      }}
    >
      {isImported && (
        <span
          className="absolute top-3.5 right-3.5 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-outfit font-semibold text-emerald-300"
          style={{
            background: 'rgba(52,211,153,0.12)',
            border: '1px solid rgba(52,211,153,0.25)',
          }}
        >
          Imported
        </span>
      )}

      <div className="flex items-center gap-2 pr-20">
        <a
          href={issue.htmlUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-outfit font-bold transition-all ${stateStyle.badge} ${stateStyle.glow}`}
        >
          <Circle size={10} className={stateStyle.icon} fill="currentColor" strokeWidth={0} />
          #{issue.number}
        </a>
        <span className="ml-auto text-[11px] text-slate-600 font-outfit shrink-0">
          {timeAgo(issue.updatedAt)}
        </span>
      </div>

      <a
        href={issue.htmlUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-outfit font-semibold text-slate-100 leading-snug line-clamp-2 hover:text-indigo-300 transition-colors"
      >
        {issue.title}
      </a>

      {issue.labels.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {issue.labels.slice(0, 4).map(label => (
            <span
              key={`${label.name}-${label.color}`}
              className="px-1.5 py-0.5 rounded-full text-[10px] font-outfit font-semibold"
              style={{
                backgroundColor: `#${label.color}1a`,
                color: `#${label.color}`,
                border: `1px solid #${label.color}30`,
              }}
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
                      className="rounded-full ring-2 ring-[rgba(10,15,35,0.9)]"
                      unoptimized
                    />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center ring-2 ring-[rgba(10,15,35,0.9)]"
                      style={{ background: 'rgba(255,255,255,0.08)' }}
                    >
                      <User size={10} className="text-slate-400" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <User size={10} className="text-slate-500" />
            </div>
          )}
        </div>

        <span className="flex items-center gap-1.5 text-slate-600">
          <MessageSquare size={11} />
          {issue.comments}
        </span>

        {onImport && !isImported && (
          <motion.button
            type="button"
            onClick={() => onImport(issue)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="ml-auto inline-flex items-center rounded-xl px-3 py-1.5 text-[11px] font-outfit font-semibold text-white opacity-0 translate-y-1 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.7), rgba(168,85,247,0.6))',
              border: '1px solid rgba(255,255,255,0.15)',
              boxShadow: '0 2px 12px rgba(99,102,241,0.35)',
            }}
          >
            Import as Task
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

export default IssueCard;

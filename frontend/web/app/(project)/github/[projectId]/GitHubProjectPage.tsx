'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Globe, Lock, RefreshCw, Search, X, Check, Link2,
  LogOut, User, ExternalLink, GitPullRequest, ChevronDown, AlertCircle, GitCommit,
  SlidersHorizontal, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  getProjectGitHubRepo,
  setProjectGitHubRepo,
  clearProjectGitHubRepo,
  getGitHubToken,
  clearGitHubToken,
  fetchRepositoriesWithToken,
  fetchGitHubUser,
  fetchPullRequests,
  fetchCommits,
  fetchIssues,
  getSavedGitHubAccounts,
  upsertSavedGitHubAccount,
  type GitHubRepository,
  type GitHubPullRequest,
  type GitHubCommit,
  type GitHubIssue,
  type GitHubUser,
  type ProjectGitHubConnection,
  type SavedGitHubAccount,
} from '@/services/githubService';
import IssueCard from '@/components/github/IssueCard';
import GitHubMark from '@/components/github/GitHubMark';
import { fetchMembers } from '@/services/members-service';
import { getUserFromToken } from '@/lib/auth';

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

// ── Shared glass style tokens ─────────────────────────────────────────────────
const glass = {
  card: {
    background: 'rgba(255,255,255,0.04)',
    backdropFilter: 'blur(20px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: '0 4px 24px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07)',
  },
  cardHover: {
    boxShadow: '0 12px 40px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.1)',
  },
  modal: {
    background: 'rgba(10,15,35,0.88)',
    backdropFilter: 'blur(28px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.11)',
    boxShadow: '0 24px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  button: {
    background: 'rgba(255,255,255,0.06)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  buttonActive: {
    background: 'rgba(99,102,241,0.22)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(99,102,241,0.32)',
    boxShadow: '0 0 18px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.12)',
  },
  input: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(12px)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  divider: { borderColor: 'rgba(255,255,255,0.07)' },
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────
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

function prStatus(pr: GitHubPullRequest): { label: string; color: string; dot: string; glow: string } {
  if (pr.draft) return { label: 'Draft', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20', dot: 'bg-slate-400', glow: '' };
  if (pr.merged_at) return { label: 'Merged', color: 'text-purple-300 bg-purple-400/12 border-purple-400/25', dot: 'bg-purple-400', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.35)]' };
  if (pr.state === 'closed') return { label: 'Closed', color: 'text-red-300 bg-red-400/12 border-red-400/25', dot: 'bg-red-400', glow: '' };
  return { label: 'Open', color: 'text-emerald-300 bg-emerald-400/12 border-emerald-400/25', dot: 'bg-emerald-400', glow: 'shadow-[0_0_10px_rgba(52,211,153,0.35)]' };
}

// ── Ambient background orbs ───────────────────────────────────────────────────
function BackgroundOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden>
      {/* Primary indigo orb */}
      <div
        className="absolute -top-40 left-1/3 w-[560px] h-[560px] rounded-full opacity-[0.18] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
      />
      {/* Purple orb bottom-right */}
      <div
        className="absolute bottom-10 right-10 w-[420px] h-[420px] rounded-full opacity-[0.13] blur-[100px]"
        style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 70%)' }}
      />
      {/* Blue orb mid */}
      <div
        className="absolute top-1/2 left-[10%] w-[280px] h-[280px] rounded-full opacity-[0.09] blur-[80px]"
        style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
      />
      {/* Subtle mesh grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
    </div>
  );
}

// ── Disconnected state ────────────────────────────────────────────────────────
function DisconnectedView({
  onConnect,
  onLogout,
  isPostLogout,
}: {
  onConnect: () => void;
  onLogout: () => void;
  isPostLogout: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
      className="flex flex-col items-center gap-8 max-w-sm w-full text-center"
    >
      {/* Logo orb */}
      <div className="relative">
        <div
          className="absolute inset-[-16px] rounded-full blur-3xl opacity-50"
          style={{ background: 'radial-gradient(circle, #6366f1, transparent 70%)' }}
        />
        <motion.div
          animate={{ boxShadow: ['0 0 24px rgba(99,102,241,0.25)', '0 0 48px rgba(99,102,241,0.4)', '0 0 24px rgba(99,102,241,0.25)'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="relative w-[88px] h-[88px] rounded-[28px] flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.04) 100%)',
            backdropFilter: 'blur(24px) saturate(200%)',
            border: '1px solid rgba(255,255,255,0.18)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)',
          }}
        >
          <GitHubMark size={42} className="text-white" />
        </motion.div>
      </div>

      {isPostLogout ? (
        <>
          <div className="flex flex-col gap-2.5">
            <h2 className="text-[22px] font-outfit font-black text-white tracking-tight">
              Choose a GitHub account
            </h2>
            <p className="text-sm text-slate-400 font-outfit leading-relaxed">
              You&apos;ll be redirected to GitHub to sign in. If you have multiple accounts you&apos;ll see a picker.
            </p>
          </div>

          <div
            className="w-full rounded-2xl p-4"
            style={{
              background: 'rgba(99,102,241,0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(99,102,241,0.2)',
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.3)' }}
              >
                <User size={11} className="text-indigo-300" />
              </div>
              <span className="text-sm text-slate-300 font-outfit text-left leading-relaxed">
                Your previous account has been disconnected. Sign in with any GitHub account.
              </span>
            </div>
          </div>

          <motion.button
            onClick={onConnect}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-outfit font-bold text-[15px] text-white w-full justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(99,102,241,0.7) 0%, rgba(168,85,247,0.6) 100%)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 4px 28px rgba(99,102,241,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <GitHubMark size={18} className="text-white" />
            Choose GitHub account
          </motion.button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            <h2 className="text-[22px] font-outfit font-black text-white tracking-tight">
              Connect to GitHub
            </h2>
            <p className="text-sm text-slate-400 font-outfit leading-relaxed">
              Link this project to a GitHub repository to track pull requests, commits, and issues.
            </p>
          </div>

          <div
            className="flex flex-col gap-3 w-full rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.07)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
          >
            {[
              { icon: <GitPullRequest size={13} />, text: 'View pull requests in real time' },
              { icon: <GitCommit size={13} />, text: 'Track commits and branch history' },
              { icon: <AlertCircle size={13} />, text: 'Monitor open, merged & closed PRs' },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-3">
                <div
                  className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-emerald-400"
                  style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.2)' }}
                >
                  {item.icon}
                </div>
                <span className="text-sm text-slate-300 font-outfit flex-1 text-left">{item.text}</span>
                <Check size={13} className="text-emerald-400 shrink-0" strokeWidth={2.5} />
              </div>
            ))}
          </div>

          <motion.button
            onClick={onConnect}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-8 py-3.5 rounded-2xl font-outfit font-bold text-[15px] text-white w-full justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.13) 0%, rgba(255,255,255,0.06) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.22)',
              boxShadow: '0 4px 28px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
            }}
          >
            <GitHubMark size={18} className="text-white" />
            Connect to GitHub
          </motion.button>
        </>
      )}

      <button
        onClick={onLogout}
        className="flex items-center gap-1.5 text-xs font-outfit font-semibold text-red-400/70 hover:text-red-400 transition-colors"
      >
        <LogOut size={12} />
        Logout from GitHub
      </button>

      {!GITHUB_CLIENT_ID && (
        <div
          className="w-full rounded-xl px-4 py-3"
          style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)' }}
        >
          <p className="text-xs text-amber-300 font-outfit">
            Set <code className="font-mono">NEXT_PUBLIC_GITHUB_CLIENT_ID</code> to enable GitHub OAuth.
          </p>
        </div>
      )}
    </motion.div>
  );
}

// ── PR Card ───────────────────────────────────────────────────────────────────
function PRCard({ pr }: { pr: GitHubPullRequest }) {
  const status = prStatus(pr);
  return (
    <motion.a
      href={pr.html_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, ...glass.cardHover }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="flex flex-col gap-3 p-4 rounded-2xl group transition-all cursor-pointer"
      style={glass.card}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-outfit font-bold text-slate-500">
          <GitPullRequest size={12} />
          #{pr.number}
        </span>
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-outfit font-semibold border ${status.color} ${status.glow}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        <span className="ml-auto text-[11px] text-slate-600 font-outfit shrink-0">
          {timeAgo(pr.updated_at)}
        </span>
      </div>

      <p className="text-sm font-outfit font-semibold text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
        {pr.title}
      </p>

      <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-outfit">
        <GitBranch size={11} />
        <span className="font-semibold text-slate-400">{pr.head.ref}</span>
        <span className="text-slate-700">→</span>
        <span className="text-slate-500">{pr.base.ref}</span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Image
            src={pr.user.avatar_url}
            alt={pr.user.login}
            width={18}
            height={18}
            className="rounded-full ring-1 ring-white/10"
            unoptimized
          />
          <span className="text-[11px] text-slate-500 font-outfit">@{pr.user.login}</span>
        </div>
        {pr.labels.slice(0, 3).map(label => (
          <span
            key={label.id}
            className="px-1.5 py-0.5 rounded-full text-[10px] font-outfit font-semibold"
            style={{
              backgroundColor: `#${label.color}22`,
              color: `#${label.color}`,
              border: `1px solid #${label.color}33`,
            }}
          >
            {label.name}
          </span>
        ))}
      </div>
    </motion.a>
  );
}

// ── Commit Card ───────────────────────────────────────────────────────────────
function CommitCard({ commit }: { commit: GitHubCommit }) {
  const firstLine = commit.commit.message.split('\n')[0];
  const shortSha = commit.sha.slice(0, 7);
  const authorName = commit.author?.login ?? commit.commit.author.name;
  const avatarUrl = commit.author?.avatar_url ?? null;

  return (
    <motion.a
      href={commit.html_url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, ...glass.cardHover }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="flex flex-col gap-3 p-4 rounded-2xl group transition-all cursor-pointer"
      style={glass.card}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-slate-400 px-2 py-0.5 rounded-lg"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <GitCommit size={11} />
          {shortSha}
        </span>
        <span className="ml-auto text-[11px] text-slate-600 font-outfit shrink-0">
          {timeAgo(commit.commit.author.date)}
        </span>
      </div>

      <p className="text-sm font-outfit font-semibold text-slate-100 leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
        {firstLine}
      </p>

      <div className="flex items-center gap-1.5">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={authorName} width={18} height={18} className="rounded-full ring-1 ring-white/10" unoptimized />
        ) : (
          <div
            className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          >
            <User size={10} className="text-slate-400" />
          </div>
        )}
        <span className="text-[11px] text-slate-500 font-outfit">@{authorName}</span>
      </div>
    </motion.a>
  );
}

// ── Account dropdown ──────────────────────────────────────────────────────────
function AccountDropdown({
  user,
  onLogout,
  onChangeRepo,
  canChangeRepo,
}: {
  user: GitHubUser | null;
  onLogout: () => void;
  onChangeRepo: () => void;
  canChangeRepo: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(p => !p)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:bg-white/[0.06]"
        style={glass.button}
      >
        {user?.avatar_url ? (
          <Image src={user.avatar_url} alt={user.login} width={20} height={20} className="rounded-full ring-1 ring-white/15" unoptimized />
        ) : (
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <User size={11} className="text-slate-300" />
          </div>
        )}
        <span className="text-xs font-outfit font-semibold text-slate-200 hidden sm:inline">
          {user?.login ?? 'Account'}
        </span>
        <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl overflow-hidden z-[300]"
            style={glass.modal}
          >
            <div className="px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
              <div className="flex items-center gap-3">
                {user?.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.login} width={38} height={38} className="rounded-full ring-2 ring-white/10" unoptimized />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                    <User size={16} className="text-slate-300" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-outfit font-bold text-slate-100 truncate">
                    {user?.name ?? user?.login ?? '—'}
                  </span>
                  <span className="text-xs text-slate-500 font-outfit truncate">@{user?.login}</span>
                </div>
              </div>
              {user && (
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 flex items-center gap-1.5 text-xs text-indigo-400 font-outfit font-semibold hover:text-indigo-300 transition-colors"
                >
                  <ExternalLink size={11} />
                  View GitHub profile
                </a>
              )}
            </div>

            <div className="py-1.5">
              {canChangeRepo && (
                <button
                  onClick={() => { setOpen(false); onChangeRepo(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-outfit font-semibold text-slate-300 hover:bg-white/[0.05] transition-colors text-left"
                >
                  <Link2 size={14} className="text-slate-500" />
                  Change repository
                </button>
              )}
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-outfit font-semibold text-red-400 hover:bg-red-400/[0.08] transition-colors text-left"
              >
                <LogOut size={14} />
                Logout from GitHub
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Repo selection modal ──────────────────────────────────────────────────────
function RepoModal({
  repos, search, loading, error, onSearch, onSelect, onClose, onRefresh,
}: {
  repos: GitHubRepository[];
  search: string;
  loading: boolean;
  error: string | null;
  onSearch: (v: string) => void;
  onSelect: (repo: GitHubRepository) => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,20,0.72)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-lg overflow-hidden flex flex-col rounded-2xl"
        style={{ ...glass.modal, maxHeight: '80vh' }}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <GitHubMark size={15} className="text-white" />
            </div>
            <span className="font-outfit font-bold text-slate-100 text-base">Select a repository</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={glass.input}>
            <Search size={14} className="text-slate-500 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search repositories…"
              value={search}
              onChange={e => onSearch(e.target.value)}
              className="flex-1 text-sm font-outfit bg-transparent outline-none text-slate-200 placeholder:text-slate-600"
            />
            {search && (
              <button onClick={() => onSearch('')} className="text-slate-500 hover:text-slate-300 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] animate-pulse" />
              <span className="text-sm text-slate-500 font-outfit">Loading repositories…</span>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
              >
                <X size={16} className="text-red-400" />
              </div>
              <p className="text-sm text-slate-400 font-outfit">{error}</p>
              <button onClick={onRefresh} className="text-sm text-indigo-400 font-outfit font-semibold hover:text-indigo-300 transition-colors">
                Try again
              </button>
            </div>
          )}
          {!loading && !error && repos.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-sm text-slate-500 font-outfit">No repositories found</span>
            </div>
          )}
          {!loading && !error && repos.length > 0 && (
            <ul className="py-1.5">
              {repos.map(repo => (
                <li key={repo.id}>
                  <button
                    onClick={() => onSelect(repo)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors text-left group"
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-white/[0.1] transition-colors"
                      style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.09)' }}
                    >
                      <GitHubMark size={14} className="text-slate-300" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-outfit font-semibold text-slate-200 truncate">{repo.full_name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-slate-500 font-outfit">
                          <GitBranch size={10} />{repo.default_branch}
                        </span>
                        <span className={`flex items-center gap-1 text-[11px] font-outfit ${repo.private ? 'text-slate-500' : 'text-blue-400'}`}>
                          {repo.private ? <Lock size={9} /> : <Globe size={9} />}
                          {repo.private ? 'Private' : 'Public'}
                        </span>
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Account picker modal ──────────────────────────────────────────────────────
function AccountPickerModal({
  accounts,
  onSelect,
  onAddAccount,
  onClose,
}: {
  accounts: SavedGitHubAccount[];
  onSelect: (login: string) => void;
  onAddAccount: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,20,0.72)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 14 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={glass.modal}
      >
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <GitHubMark size={13} className="text-white" />
            </div>
            <h2 className="text-sm font-outfit font-bold text-slate-100">Choose a GitHub account</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="py-1.5 max-h-[300px] overflow-y-auto">
          {accounts.map(account => (
            <button
              key={account.login}
              onClick={() => onSelect(account.login)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.04] transition-colors group text-left"
            >
              <Image
                src={account.avatarUrl}
                alt={account.login}
                width={36}
                height={36}
                className="rounded-full flex-shrink-0 ring-2 ring-white/10"
                unoptimized
              />
              <div className="flex flex-col min-w-0 flex-1">
                {account.name && (
                  <span className="text-sm font-outfit font-semibold text-slate-200 truncate leading-tight">
                    {account.name}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-outfit truncate">@{account.login}</span>
              </div>
              <span className="text-xs font-outfit font-semibold text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                Connect →
              </span>
            </button>
          ))}
        </div>

        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <button
            onClick={onAddAccount}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-outfit font-semibold text-slate-300 hover:text-slate-100 hover:bg-white/[0.06] transition-all"
            style={{ border: '1px solid rgba(255,255,255,0.09)' }}
          >
            <User size={13} className="text-slate-500" />
            Use a different account
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 5;

function PaginationBar({
  page,
  total,
  onPrev,
  onNext,
}: {
  page: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.07]"
        style={glass.button}
      >
        <ChevronLeft size={14} className="text-slate-400" />
      </button>
      <span
        className="text-xs font-outfit text-slate-400 tabular-nums px-3.5 py-1.5 rounded-lg"
        style={{ background: 'rgba(255,255,255,0.04)' }}
      >
        {page} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="p-2 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/[0.07]"
        style={glass.button}
      >
        <ChevronRight size={14} className="text-slate-400" />
      </button>
    </div>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-[116px] rounded-2xl animate-pulse"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
        />
      ))}
    </div>
  );
}

// ── Issue Import Modal ────────────────────────────────────────────────────────
function IssueImportModal({ issue, onClose }: { issue: GitHubIssue; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[500] flex items-center justify-center p-4"
      style={{ background: 'rgba(5,8,20,0.72)', backdropFilter: 'blur(10px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        className="w-full max-w-md rounded-2xl p-5"
        style={glass.modal}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-outfit font-semibold text-slate-500">Import GitHub issue</p>
            <h3 className="mt-1 text-base font-outfit font-bold text-slate-100">
              #{issue.number} {issue.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/[0.07] hover:text-slate-200 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-4 text-sm font-outfit text-slate-400 leading-relaxed">
          Choose import options and create the Planora task in the import workflow.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl px-4 py-2 text-sm font-outfit font-semibold text-slate-300 hover:bg-white/[0.07] transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Issues Panel ──────────────────────────────────────────────────────────────
function IssuesPanel({
  connection: _connection,
  issues,
  loading,
  error,
  onCountChange,
  onRequireLogin,
  onRefresh,
}: {
  connection: ProjectGitHubConnection;
  issues: GitHubIssue[];
  loading: boolean;
  error: string | null;
  onCountChange: (count: number | null) => void;
  onRequireLogin: () => void;
  onRefresh: () => void;
}) {
  const [selectedIssue, setSelectedIssue] = useState<GitHubIssue | null>(null);
  const [importedIssueNumbers] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    onCountChange(issues.length);
  }, [issues, onCountChange]);

  return (
    <div className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-outfit font-bold text-slate-300">Issues</h2>
          {!loading && !error && (
            <span className="text-sm text-slate-600 font-outfit">({issues.length})</span>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-xl transition-all disabled:opacity-40 text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]"
          style={glass.button}
          title="Refresh issues"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div
        className="flex items-center gap-2 rounded-2xl px-3 py-2.5"
        style={glass.card}
      >
        <SlidersHorizontal size={14} className="text-slate-600" />
        <span className="text-xs font-outfit font-semibold text-slate-600">Filters</span>
        <button disabled className="ml-2 rounded-lg px-2.5 py-1 text-xs font-outfit text-slate-600" style={{ background: 'rgba(255,255,255,0.04)' }}>
          All states
        </button>
        <button disabled className="rounded-lg px-2.5 py-1 text-xs font-outfit text-slate-600" style={{ background: 'rgba(255,255,255,0.04)' }}>
          All labels
        </button>
      </div>

      {loading && <SkeletonList />}

      {!loading && error && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
          >
            <AlertCircle size={16} className="text-red-400" />
          </div>
          <p className="text-xs text-slate-500 font-outfit">{error}</p>
          {(!getGitHubToken() || error.toLowerCase().includes('connect')) ? (
            <motion.button
              onClick={() => onRequireLogin()}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-white font-outfit font-bold text-sm"
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.6), rgba(168,85,247,0.5))',
                border: '1px solid rgba(255,255,255,0.15)',
              }}
            >
              <GitHubMark size={14} className="text-white" />
              Connect to GitHub
            </motion.button>
          ) : (
            <button onClick={onRefresh} className="text-xs text-indigo-400 font-outfit font-semibold hover:text-indigo-300 transition-colors">
              Retry
            </button>
          )}
        </div>
      )}

      {!loading && !error && issues.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10">
          <AlertCircle size={20} className="text-slate-700" />
          <p className="text-xs text-slate-500 font-outfit">No issues found</p>
        </div>
      )}

      {!loading && !error && issues.length > 0 && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {issues.map(issue => (
            <IssueCard
              key={issue.id}
              issue={issue}
              onImport={setSelectedIssue}
              isImported={importedIssueNumbers.has(issue.number)}
            />
          ))}
        </div>
      )}

      <AnimatePresence>
        {selectedIssue && <IssueImportModal issue={selectedIssue} onClose={() => setSelectedIssue(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Connected Dashboard ───────────────────────────────────────────────────────
function ConnectedDashboard({
  connection,
  prs,
  commits,
  issues,
  loading,
  prError,
  commitError,
  issueError,
  user,
  onRefresh,
  onLogout,
  onChangeRepo,
  canChangeRepo,
}: {
  connection: ProjectGitHubConnection;
  prs: GitHubPullRequest[];
  commits: GitHubCommit[];
  issues: GitHubIssue[];
  loading: boolean;
  prError: string | null;
  commitError: string | null;
  issueError: string | null;
  user: GitHubUser | null;
  onRefresh: () => void;
  onLogout: () => void;
  onChangeRepo: () => void;
  canChangeRepo: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'pullRequests' | 'commits' | 'issues'>('pullRequests');
  const [issueCount, setIssueCount] = useState<number | null>(null);
  const [prPage, setPRPage] = useState(1);
  const [commitPage, setCommitPage] = useState(1);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full flex flex-col gap-5">

      {/* ── Repo header ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Repo badge */}
        <div
          className="flex items-center gap-2.5 px-3.5 py-2 rounded-xl"
          style={{
            background: 'rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 0 24px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.08)',
          }}
        >
          <GitHubMark size={14} className="text-white" />
          <span className="text-xs font-outfit font-bold text-slate-100 truncate max-w-[180px] sm:max-w-[240px]">
            {connection.repoFullName}
          </span>
          <span
            className={`flex items-center gap-1 text-[10px] font-outfit px-1.5 py-0.5 rounded-full ${
              connection.private
                ? 'text-slate-400 bg-slate-400/10 border-slate-400/20'
                : 'text-blue-300 bg-blue-400/10 border-blue-400/20'
            } border`}
          >
            {connection.private ? <Lock size={8} /> : <Globe size={8} />}
            {connection.private ? 'Private' : 'Public'}
          </span>
          <span className="hidden sm:flex items-center gap-1 text-[10px] font-outfit text-slate-600">
            <GitBranch size={10} />
            {connection.defaultBranch}
          </span>
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-xl transition-all text-slate-400 hover:text-slate-200 hover:bg-white/[0.07] disabled:opacity-40"
            style={glass.button}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {canChangeRepo && (
            <button
              onClick={onChangeRepo}
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-outfit font-semibold text-slate-300 hover:text-slate-100 hover:bg-white/[0.07] transition-all"
              style={glass.button}
            >
              <Link2 size={13} />
              Change repo
            </button>
          )}
          <AccountDropdown user={user} onLogout={onLogout} onChangeRepo={onChangeRepo} canChangeRepo={canChangeRepo} />
        </div>
      </div>

      {/* ── Tab switcher ─────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-1 rounded-2xl p-1"
        style={{
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        {([
          { id: 'pullRequests', label: 'Pull Requests', short: 'PRs', icon: <GitPullRequest size={13} /> },
          { id: 'commits', label: 'Commits', short: 'Commits', icon: <GitCommit size={13} /> },
          {
            id: 'issues',
            label: `Issues${issueCount === null ? '' : ` (${issueCount})`}`,
            short: `Issues${issueCount === null ? '' : ` (${issueCount})`}`,
            icon: <AlertCircle size={13} />,
          },
        ] as const).map(tab => (
          <motion.button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            layout
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl px-2 sm:px-4 py-2.5 text-xs sm:text-sm font-outfit font-semibold transition-colors"
            style={activeTab === tab.id ? glass.buttonActive : {}}
            animate={activeTab === tab.id ? { color: '#f1f5f9' } : { color: '#64748b' }}
          >
            <span className="shrink-0 hidden sm:inline">{tab.icon}</span>
            <span className="sm:hidden">{tab.short}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </motion.button>
        ))}
      </div>

      {/* ── Content grid ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-6">

        {/* Pull Requests */}
        {activeTab === 'pullRequests' && (
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <GitPullRequest size={15} className="text-indigo-400 shrink-0" />
              <h2 className="text-sm font-outfit font-bold text-slate-300">
                Pull Requests
                {!loading && !prError && (
                  <span className="ml-1.5 text-slate-600 font-normal">({prs.length})</span>
                )}
              </h2>
              <a
                href={`https://github.com/${connection.repoFullName}/pulls`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-indigo-400 font-outfit font-semibold hover:text-indigo-300 transition-colors shrink-0"
              >
                GitHub <ExternalLink size={10} />
              </a>
            </div>

            {loading && <SkeletonList />}

            {!loading && prError && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
                >
                  <AlertCircle size={16} className="text-red-400" />
                </div>
                <p className="text-xs text-slate-500 font-outfit">{prError}</p>
                <button onClick={onRefresh} className="text-xs text-indigo-400 font-outfit font-semibold hover:text-indigo-300 transition-colors">
                  Retry
                </button>
              </div>
            )}

            {!loading && !prError && prs.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10">
                <GitPullRequest size={22} className="text-slate-700" />
                <p className="text-xs text-slate-500 font-outfit">No pull requests found</p>
              </div>
            )}

            {!loading && !prError && prs.length > 0 && (() => {
              const start = (prPage - 1) * PAGE_SIZE;
              const page = prs.slice(start, start + PAGE_SIZE);
              return (
                <div className="flex flex-col gap-3">
                  {page.map((pr, i) => (
                    <motion.div key={pr.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <PRCard pr={pr} />
                    </motion.div>
                  ))}
                  <PaginationBar
                    page={prPage}
                    total={prs.length}
                    onPrev={() => setPRPage(p => Math.max(1, p - 1))}
                    onNext={() => setPRPage(p => Math.min(Math.ceil(prs.length / PAGE_SIZE), p + 1))}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* Commits */}
        {activeTab === 'commits' && (
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <GitCommit size={15} className="text-indigo-400 shrink-0" />
              <h2 className="text-sm font-outfit font-bold text-slate-300">
                Commits
                {!loading && !commitError && (
                  <span className="ml-1.5 text-slate-600 font-normal">({commits.length})</span>
                )}
              </h2>
              <a
                href={`https://github.com/${connection.repoFullName}/commits`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto flex items-center gap-1 text-xs text-indigo-400 font-outfit font-semibold hover:text-indigo-300 transition-colors shrink-0"
              >
                GitHub <ExternalLink size={10} />
              </a>
            </div>

            {loading && <SkeletonList />}

            {!loading && commitError && (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)' }}
                >
                  <AlertCircle size={16} className="text-red-400" />
                </div>
                <p className="text-xs text-slate-500 font-outfit">{commitError}</p>
                <button onClick={onRefresh} className="text-xs text-indigo-400 font-outfit font-semibold hover:text-indigo-300 transition-colors">
                  Retry
                </button>
              </div>
            )}

            {!loading && !commitError && commits.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-10">
                <GitCommit size={22} className="text-slate-700" />
                <p className="text-xs text-slate-500 font-outfit">No commits found</p>
              </div>
            )}

            {!loading && !commitError && commits.length > 0 && (() => {
              const start = (commitPage - 1) * PAGE_SIZE;
              const page = commits.slice(start, start + PAGE_SIZE);
              return (
                <div className="flex flex-col gap-3">
                  {page.map((commit, i) => (
                    <motion.div key={commit.sha} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                      <CommitCard commit={commit} />
                    </motion.div>
                  ))}
                  <PaginationBar
                    page={commitPage}
                    total={commits.length}
                    onPrev={() => setCommitPage(p => Math.max(1, p - 1))}
                    onNext={() => setCommitPage(p => Math.min(Math.ceil(commits.length / PAGE_SIZE), p + 1))}
                  />
                </div>
              );
            })()}
          </div>
        )}

        {/* Issues */}
        <div className={activeTab === 'issues' ? '' : 'hidden'}>
          <IssuesPanel
            connection={connection}
            issues={issues}
            loading={loading}
            error={issueError}
            onCountChange={setIssueCount}
            onRequireLogin={onChangeRepo}
            onRefresh={onRefresh}
          />
        </div>
      </div>
    </motion.div>
  );
}

// ── Page root ─────────────────────────────────────────────────────────────────
export default function GitHubProjectPage({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [connection, setConnection] = useState<ProjectGitHubConnection | null>(null);
  const [user, setUser] = useState<GitHubUser | null>(null);
  const [prs, setPRs] = useState<GitHubPullRequest[]>([]);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [prError, setPRError] = useState<string | null>(null);
  const [commitError, setCommitError] = useState<string | null>(null);
  const [issueError, setIssueError] = useState<string | null>(null);
  const [canChangeRepo, setCanChangeRepo] = useState(false);
  const [isPostLogout, setIsPostLogout] = useState(false);
  const [savedAccounts, setSavedAccounts] = useState<SavedGitHubAccount[]>([]);
  const [showAccountPicker, setShowAccountPicker] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [allRepos, setAllRepos] = useState<GitHubRepository[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  useEffect(() => {
    setConnection(getProjectGitHubRepo(projectId));
  }, [projectId]);

  useEffect(() => {
    localStorage.removeItem('github_force_relogin');
    setSavedAccounts(getSavedGitHubAccounts());
  }, []);

  useEffect(() => {
    const currentUser = getUserFromToken();
    if (!currentUser?.userId) return;
    fetchMembers(projectId)
      .then(members => {
        const me = members.find(m => m.userId === currentUser.userId);
        setCanChangeRepo(me?.role === 'OWNER' || me?.role === 'ADMIN');
      })
      .catch(() => {});
  }, [projectId]);

  const loadData = useCallback(async (conn: ProjectGitHubConnection) => {
    const token = getGitHubToken();
    if (!token) return;
    setLoading(true);
    setPRError(null);
    setCommitError(null);
    setIssueError(null);

    const [prResult, commitResult, issueResult, userResult] = await Promise.allSettled([
      fetchPullRequests(token, conn.ownerLogin, conn.repoName),
      fetchCommits(token, conn.ownerLogin, conn.repoName),
      fetchIssues(conn.repoFullName),
      fetchGitHubUser(token),
    ]);

    if (prResult.status === 'fulfilled') setPRs(prResult.value);
    else setPRError(prResult.reason instanceof Error ? prResult.reason.message : 'Failed to load pull requests');

    if (commitResult.status === 'fulfilled') setCommits(commitResult.value);
    else setCommitError(commitResult.reason instanceof Error ? commitResult.reason.message : 'Failed to load commits');

    if (issueResult.status === 'fulfilled') setIssues(issueResult.value);
    else setIssueError(issueResult.reason instanceof Error ? issueResult.reason.message : 'Failed to load issues');

    if (userResult.status === 'fulfilled') {
      const githubUser = userResult.value;
      setUser(githubUser);
      upsertSavedGitHubAccount({ login: githubUser.login, name: githubUser.name, avatarUrl: githubUser.avatar_url });
      setSavedAccounts(getSavedGitHubAccounts());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (connection) void loadData(connection);
  }, [connection, loadData]);

  const loadRepos = useCallback(async () => {
    const token = getGitHubToken();
    if (!token) return;
    setLoadingRepos(true);
    setRepoError(null);
    try {
      const data = await fetchRepositoriesWithToken(token);
      setAllRepos(data);
    } catch (err) {
      setRepoError(err instanceof Error ? err.message : 'Failed to load repositories');
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  useEffect(() => {
    if (searchParams.get('select_repo') !== '1') return;
    router.replace(`/github/${projectId}`);
    setShowModal(true);
    void loadRepos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectGitHub = (loginHint?: string) => {
    if (!GITHUB_CLIENT_ID) {
      alert('GitHub OAuth is not configured.\nPlease set NEXT_PUBLIC_GITHUB_CLIENT_ID.');
      return;
    }
    const redirectUri = `${window.location.origin}/github/callback`;
    const params = new URLSearchParams({
      client_id: GITHUB_CLIENT_ID,
      scope: 'repo',
      state: projectId,
      redirect_uri: redirectUri,
    });
    if (loginHint !== undefined) params.set('login', loginHint);
    window.location.href = `https://github.com/login/oauth/authorize?${params}`;
  };

  const handleInitiateConnect = () => {
    if (savedAccounts.length > 0) setShowAccountPicker(true);
    else handleConnectGitHub();
  };

  const handleOpenModal = async () => {
    const token = getGitHubToken();
    if (!token) {
      if (savedAccounts.length > 0) setShowAccountPicker(true);
      else handleConnectGitHub();
      return;
    }
    setShowModal(true);
    await loadRepos();
  };

  const handleSelectRepo = (repo: GitHubRepository) => {
    setProjectGitHubRepo(projectId, repo);
    const newConn = getProjectGitHubRepo(projectId)!;
    setConnection(newConn);
    setIsPostLogout(false);
    setShowModal(false);
    setRepoSearch('');
    void loadData(newConn);
  };

  const handleLogout = async () => {
    const token = getGitHubToken();
    if (token) {
      try {
        await fetch('/api/github/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch { /* ignore */ }
    }
    clearGitHubToken();
    clearProjectGitHubRepo(projectId);
    setIsPostLogout(true);
    setConnection(null);
    setUser(null);
    setPRs([]);
    setCommits([]);
  };

  const filteredRepos = allRepos.filter(r =>
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div
      className="relative w-full min-h-[calc(100vh-120px)] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #050B1A 0%, #0C0921 35%, #120820 65%, #080E1C 100%)',
      }}
    >
      <BackgroundOrbs />

      <div
        className={`relative z-10 w-full px-4 sm:px-6 py-8 ${
          connection ? '' : 'min-h-[calc(100vh-120px)] flex flex-col items-center justify-center'
        }`}
      >
        <AnimatePresence mode="wait">
          {connection ? (
            <ConnectedDashboard
              key="dashboard"
              connection={connection}
              prs={prs}
              commits={commits}
              issues={issues}
              loading={loading}
              prError={prError}
              commitError={commitError}
              issueError={issueError}
              user={user}
              onRefresh={() => void loadData(connection)}
              onLogout={() => void handleLogout()}
              onChangeRepo={handleOpenModal}
              canChangeRepo={canChangeRepo}
            />
          ) : (
            <DisconnectedView
              key="disconnected"
              onConnect={handleInitiateConnect}
              onLogout={() => void handleLogout()}
              isPostLogout={isPostLogout}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showModal && (
            <RepoModal
              repos={filteredRepos}
              search={repoSearch}
              loading={loadingRepos}
              error={repoError}
              onSearch={setRepoSearch}
              onSelect={handleSelectRepo}
              onClose={() => { setShowModal(false); setRepoSearch(''); }}
              onRefresh={() => void loadRepos()}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showAccountPicker && (
            <AccountPickerModal
              accounts={savedAccounts}
              onSelect={login => { setShowAccountPicker(false); handleConnectGitHub(login); }}
              onAddAccount={() => { setShowAccountPicker(false); handleConnectGitHub(''); }}
              onClose={() => setShowAccountPicker(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

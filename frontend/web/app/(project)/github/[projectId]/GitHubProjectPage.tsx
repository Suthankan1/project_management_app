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

function prStatus(pr: GitHubPullRequest): { label: string; color: string; dot: string } {
  if (pr.draft) return { label: 'Draft', color: 'text-slate-500 bg-slate-100 border-slate-200', dot: 'bg-slate-400' };
  if (pr.merged_at) return { label: 'Merged', color: 'text-purple-700 bg-purple-50 border-purple-200', dot: 'bg-purple-500' };
  if (pr.state === 'closed') return { label: 'Closed', color: 'text-red-700 bg-red-50 border-red-200', dot: 'bg-red-500' };
  return { label: 'Open', color: 'text-green-700 bg-green-50 border-green-200', dot: 'bg-green-500' };
}

// ── Disconnected state ────────────────────────────────────────────────────────
function DisconnectedView({ onConnect, onLogout, isPostLogout }: { onConnect: () => void; onLogout: () => void; isPostLogout: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center gap-6 max-w-md w-full text-center"
    >
      <div className="w-20 h-20 rounded-3xl bg-slate-900 flex items-center justify-center shadow-[0_8px_32px_rgba(0,0,0,0.18)]">
        <GitHubMark size={40} className="text-white" />
      </div>

      {isPostLogout ? (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-outfit font-bold text-slate-800">Choose a GitHub account</h2>
            <p className="text-sm text-slate-500 font-outfit leading-relaxed">
              You&apos;ll be taken to GitHub to sign in and select which account to connect with.
              If you have multiple accounts you&apos;ll see an account picker.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full text-left bg-blue-50 rounded-2xl p-4 border border-blue-100">
            <div className="flex items-start gap-2.5">
              <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                <User size={9} className="text-blue-600" />
              </div>
              <span className="text-sm text-slate-600 font-outfit">
                Sign in with any GitHub account — your previous account is no longer connected.
              </span>
            </div>
          </div>
          <motion.button
            onClick={onConnect}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900 text-white font-outfit font-bold text-sm shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:bg-slate-800 transition-colors"
          >
            <GitHubMark size={18} className="text-white" />
            Choose GitHub account
          </motion.button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-outfit font-semibold text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={13} />
            Logout from GitHub
          </button>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-outfit font-bold text-slate-800">Connect to GitHub</h2>
            <p className="text-sm text-slate-500 font-outfit leading-relaxed">
              Link this project to a GitHub repository to track pull requests and activity.
            </p>
          </div>
          <div className="flex flex-col gap-2 w-full text-left bg-slate-50 rounded-2xl p-4 border border-slate-100">
            {['View pull requests', 'Track open, merged & closed PRs', 'See branch and author details'].map(item => (
              <div key={item} className="flex items-center gap-2.5">
                <div className="w-4 h-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <Check size={10} className="text-green-600" strokeWidth={3} />
                </div>
                <span className="text-sm text-slate-600 font-outfit">{item}</span>
              </div>
            ))}
          </div>
          <motion.button
            onClick={onConnect}
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-slate-900 text-white font-outfit font-bold text-sm shadow-[0_4px_20px_rgba(0,0,0,0.25)] hover:bg-slate-800 transition-colors"
          >
            <GitHubMark size={18} className="text-white" />
            Connect to GitHub
          </motion.button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-outfit font-semibold text-red-500 hover:text-red-600 transition-colors"
          >
            <LogOut size={13} />
            Logout from GitHub
          </button>
        </>
      )}

      {!GITHUB_CLIENT_ID && (
        <p className="text-xs text-amber-600 font-outfit bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          Set <code className="font-mono">NEXT_PUBLIC_GITHUB_CLIENT_ID</code> to enable GitHub OAuth.
        </p>
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
      whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="flex flex-col gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors group"
    >
      {/* Top row: number + status + date */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="flex items-center gap-1.5 text-xs font-outfit font-bold text-slate-400">
          <GitPullRequest size={12} />
          #{pr.number}
        </span>
        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-outfit font-semibold border ${status.color}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
        <span className="ml-auto text-[11px] text-slate-400 font-outfit shrink-0">
          {timeAgo(pr.updated_at)}
        </span>
      </div>

      {/* Title */}
      <p className="text-sm font-outfit font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
        {pr.title}
      </p>

      {/* Branch row */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-outfit">
        <GitBranch size={11} />
        <span className="font-semibold text-slate-500">{pr.head.ref}</span>
        <span>→</span>
        <span>{pr.base.ref}</span>
      </div>

      {/* Author + labels */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Image
            src={pr.user.avatar_url}
            alt={pr.user.login}
            width={18}
            height={18}
            className="rounded-full"
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
              border: `1px solid #${label.color}44`,
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
      whileHover={{ y: -2, boxShadow: '0 8px 28px rgba(0,0,0,0.10)' }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="flex flex-col gap-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-slate-300 transition-colors group"
    >
      {/* SHA + date */}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 font-mono text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-lg">
          <GitCommit size={11} />
          {shortSha}
        </span>
        <span className="ml-auto text-[11px] text-slate-400 font-outfit shrink-0">
          {timeAgo(commit.commit.author.date)}
        </span>
      </div>

      {/* Message */}
      <p className="text-sm font-outfit font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
        {firstLine}
      </p>

      {/* Author */}
      <div className="flex items-center gap-1.5">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={authorName} width={18} height={18} className="rounded-full" unoptimized />
        ) : (
          <div className="w-[18px] h-[18px] rounded-full bg-slate-200 flex items-center justify-center shrink-0">
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
        className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm"
      >
        {user?.avatar_url ? (
          <Image src={user.avatar_url} alt={user.login} width={20} height={20} className="rounded-full" unoptimized />
        ) : (
          <div className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center">
            <User size={11} className="text-slate-500" />
          </div>
        )}
        <span className="text-xs font-outfit font-semibold text-slate-700">
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
            className="absolute right-0 top-full mt-2 w-60 bg-white border border-slate-200 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] overflow-hidden z-[300]"
          >
            {/* Account info */}
            <div className="px-4 py-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                {user?.avatar_url ? (
                  <Image src={user.avatar_url} alt={user.login} width={36} height={36} className="rounded-full" unoptimized />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center">
                    <User size={16} className="text-slate-400" />
                  </div>
                )}
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-outfit font-bold text-slate-800 truncate">
                    {user?.name ?? user?.login ?? '—'}
                  </span>
                  <span className="text-xs text-slate-400 font-outfit truncate">@{user?.login}</span>
                </div>
              </div>
              {user && (
                <a
                  href={user.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 flex items-center gap-1.5 text-xs text-blue-500 font-outfit font-semibold hover:underline"
                >
                  <ExternalLink size={11} />
                  View GitHub profile
                </a>
              )}
            </div>

            {/* Actions */}
            <div className="py-1.5">
              {canChangeRepo && (
                <button
                  onClick={() => { setOpen(false); onChangeRepo(); }}
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-outfit font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <Link2 size={14} className="text-slate-400" />
                  Change repository
                </button>
              )}
              <button
                onClick={() => { setOpen(false); onLogout(); }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-outfit font-semibold text-red-600 hover:bg-red-50 transition-colors text-left"
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
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-lg overflow-hidden flex flex-col"
        style={{ maxHeight: '80vh' }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <GitHubMark size={18} className="text-slate-800" />
            <span className="font-outfit font-bold text-slate-800 text-base">Select a repository</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onRefresh} disabled={loading} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40" title="Refresh">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
              <X size={15} />
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input autoFocus type="text" placeholder="Search repositories…" value={search} onChange={e => onSearch(e.target.value)}
              className="flex-1 text-sm font-outfit bg-transparent outline-none text-slate-700 placeholder:text-slate-400" />
            {search && <button onClick={() => onSearch('')} className="text-slate-400 hover:text-slate-600"><X size={13} /></button>}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="w-8 h-8 rounded-xl bg-slate-100 animate-pulse" />
              <span className="text-sm text-slate-400 font-outfit">Loading repositories…</span>
            </div>
          )}
          {!loading && error && (
            <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
              <div className="w-8 h-8 rounded-xl bg-red-100 flex items-center justify-center">
                <X size={16} className="text-red-500" />
              </div>
              <p className="text-sm text-slate-600 font-outfit">{error}</p>
              <button onClick={onRefresh} className="text-sm text-blue-600 font-outfit font-semibold hover:underline">Try again</button>
            </div>
          )}
          {!loading && !error && repos.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-12">
              <span className="text-sm text-slate-400 font-outfit">No repositories found</span>
            </div>
          )}
          {!loading && !error && repos.length > 0 && (
            <ul className="py-1.5">
              {repos.map(repo => (
                <li key={repo.id}>
                  <button onClick={() => onSelect(repo)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group">
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                      <GitHubMark size={14} className="text-slate-600" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-outfit font-semibold text-slate-800 truncate">{repo.full_name}</span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-outfit"><GitBranch size={10} />{repo.default_branch}</span>
                        <span className={`flex items-center gap-1 text-[11px] font-outfit ${repo.private ? 'text-slate-400' : 'text-blue-400'}`}>
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
      style={{ background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 12 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-sm rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.18)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-slate-900 flex items-center justify-center shrink-0">
              <GitHubMark size={14} className="text-white" />
            </div>
            <h2 className="text-sm font-outfit font-bold text-slate-800">Choose a GitHub account</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Saved accounts list */}
        <div className="py-1.5 max-h-[300px] overflow-y-auto">
          {accounts.map(account => (
            <button
              key={account.login}
              onClick={() => onSelect(account.login)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors group text-left"
            >
              <Image
                src={account.avatarUrl}
                alt={account.login}
                width={36}
                height={36}
                className="rounded-full flex-shrink-0 ring-2 ring-slate-100"
                unoptimized
              />
              <div className="flex flex-col min-w-0 flex-1">
                {account.name && (
                  <span className="text-sm font-outfit font-semibold text-slate-800 truncate leading-tight">
                    {account.name}
                  </span>
                )}
                <span className="text-xs text-slate-500 font-outfit truncate">@{account.login}</span>
              </div>
              <span className="text-xs font-outfit font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                Connect →
              </span>
            </button>
          ))}
        </div>

        {/* Add / use a different account */}
        <div className="px-4 py-3 border-t border-slate-100">
          <button
            onClick={onAddAccount}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-outfit font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-colors"
          >
            <User size={14} className="text-slate-400" />
            Use a different account
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
const PAGE_SIZE = 5;

function PaginationBar({ page, total, onPrev, onNext }: { page: number; total: number; onPrev: () => void; onNext: () => void }) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 pt-1">
      <button
        onClick={onPrev}
        disabled={page === 1}
        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={14} />
      </button>
      <span className="text-xs font-outfit text-slate-500 tabular-nums">
        {page} / {totalPages}
      </span>
      <button
        onClick={onNext}
        disabled={page === totalPages}
        className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={14} />
      </button>
    </div>
  );
}

// ── Shared skeleton loader ────────────────────────────────────────────────────
function SkeletonList() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[120px] rounded-2xl bg-slate-100 animate-pulse" />
      ))}
    </div>
  );
}

// ── Connected dashboard ───────────────────────────────────────────────────────
function IssueImportModal({ issue, onClose }: { issue: GitHubIssue; onClose: () => void }) {
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
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)]"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-outfit font-semibold text-slate-400">Import GitHub issue</p>
            <h3 className="mt-1 text-base font-outfit font-bold text-slate-800">
              #{issue.number} {issue.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-4 text-sm font-outfit text-slate-500">
          Choose import options and create the Planora task in the import workflow.
        </p>
        <div className="mt-5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-outfit font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

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
          <h2 className="text-sm font-outfit font-bold text-slate-700">Issues</h2>
          {!loading && !error && (
            <span className="text-sm text-slate-400 font-outfit">({issues.length})</span>
          )}
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="p-2 rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:opacity-40"
          title="Refresh issues"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
        <SlidersHorizontal size={14} className="text-slate-400" />
        <span className="text-xs font-outfit font-semibold text-slate-500">Filters</span>
        <button disabled className="ml-2 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-outfit text-slate-400">
          All states
        </button>
        <button disabled className="rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-outfit text-slate-400">
          All labels
        </button>
      </div>

      {loading && <SkeletonList />}

      {!loading && error && (
        <div className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
            <AlertCircle size={16} className="text-red-500" />
          </div>
          <p className="text-xs text-slate-500 font-outfit">{error}</p>
          <div className="flex flex-col items-center gap-2">
            {(!getGitHubToken() || error.toLowerCase().includes('connect')) ? (
              <button
                onClick={() => onRequireLogin()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white font-outfit font-bold text-sm shadow-sm hover:bg-slate-800 transition-colors"
              >
                <GitHubMark size={14} className="text-white" />
                Connect to GitHub
              </button>
            ) : (
              <button
                onClick={() => onRefresh()}
                className="text-xs text-blue-600 font-outfit font-semibold hover:underline"
              >
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {!loading && !error && issues.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-10">
          <AlertCircle size={20} className="text-slate-300" />
          <p className="text-xs text-slate-400 font-outfit">No issues found</p>
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full flex flex-col gap-5"
    >
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 shadow-sm">
          <GitHubMark size={14} className="text-white" />
          <span className="text-xs font-outfit font-bold text-white truncate max-w-[220px]">
            {connection.repoFullName}
          </span>
          <span className={`flex items-center gap-1 text-[10px] font-outfit px-1.5 py-0.5 rounded-full ${
            connection.private ? 'bg-slate-700 text-slate-300' : 'bg-blue-500/20 text-blue-300'
          }`}>
            {connection.private ? <Lock size={8} /> : <Globe size={8} />}
            {connection.private ? 'Private' : 'Public'}
          </span>
          <span className="flex items-center gap-1 text-[10px] font-outfit text-slate-400">
            <GitBranch size={10} />
            {connection.defaultBranch}
          </span>
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            disabled={loading}
            title="Refresh"
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm text-slate-500 hover:text-slate-700 disabled:opacity-40"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {canChangeRepo && (
            <button
              onClick={onChangeRepo}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors shadow-sm text-xs font-outfit font-semibold text-slate-700"
            >
              <Link2 size={13} />
              Change repo
            </button>
          )}
          <AccountDropdown user={user} onLogout={onLogout} onChangeRepo={onChangeRepo} canChangeRepo={canChangeRepo} />
        </div>
      </div>

      {/* ── Two-column content ──────────────────────────────────────────── */}
      <div className="flex items-center gap-1 rounded-2xl border border-slate-200 bg-white p-1 shadow-sm">
        {([
          { id: 'pullRequests', label: 'Pull Requests' },
          { id: 'commits', label: 'Commits' },
          { id: 'issues', label: `Issues${issueCount === null ? '' : ` (${issueCount})`}` },
        ] as const).map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-sm font-outfit font-semibold transition-colors ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">

        {/* ── Left: Pull Requests ──────────────────────────────────── */}
        {activeTab === 'pullRequests' && (
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <GitPullRequest size={15} className="text-slate-500 shrink-0" />
            <h2 className="text-sm font-outfit font-bold text-slate-700">
              Pull Requests
              {!loading && !prError && (
                <span className="ml-1.5 text-slate-400 font-normal">({prs.length})</span>
              )}
            </h2>
            <a
              href={`https://github.com/${connection.repoFullName}/pulls`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-blue-500 font-outfit font-semibold hover:underline shrink-0"
            >
              GitHub <ExternalLink size={10} />
            </a>
          </div>

          {loading && <SkeletonList />}

          {!loading && prError && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle size={16} className="text-red-500" />
              </div>
              <p className="text-xs text-slate-500 font-outfit">{prError}</p>
              <button onClick={onRefresh} className="text-xs text-blue-600 font-outfit font-semibold hover:underline">Retry</button>
            </div>
          )}

          {!loading && !prError && prs.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10">
              <GitPullRequest size={20} className="text-slate-300" />
              <p className="text-xs text-slate-400 font-outfit">No pull requests found</p>
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

        {/* ── Right: Commits ───────────────────────────────────────── */}
        {activeTab === 'commits' && (
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex items-center gap-2">
              <GitCommit size={15} className="text-slate-500 shrink-0" />
            <h2 className="text-sm font-outfit font-bold text-slate-700">
              Commits
              {!loading && !commitError && (
                <span className="ml-1.5 text-slate-400 font-normal">({commits.length})</span>
              )}
            </h2>
            <a
              href={`https://github.com/${connection.repoFullName}/commits`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto flex items-center gap-1 text-xs text-blue-500 font-outfit font-semibold hover:underline shrink-0"
            >
              GitHub <ExternalLink size={10} />
            </a>
          </div>

          {loading && <SkeletonList />}

          {!loading && commitError && (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle size={16} className="text-red-500" />
              </div>
              <p className="text-xs text-slate-500 font-outfit">{commitError}</p>
              <button onClick={onRefresh} className="text-xs text-blue-600 font-outfit font-semibold hover:underline">Retry</button>
            </div>
          )}

          {!loading && !commitError && commits.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-10">
              <GitCommit size={20} className="text-slate-300" />
              <p className="text-xs text-slate-400 font-outfit">No commits found</p>
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

  // Repo modal state
  const [showModal, setShowModal] = useState(false);
  const [allRepos, setAllRepos] = useState<GitHubRepository[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  useEffect(() => {
    setConnection(getProjectGitHubRepo(projectId));
  }, [projectId]);

  // Load saved accounts and clean up any legacy force-relogin flag on mount
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
      // Persist this account so the picker shows it on next connect
      upsertSavedGitHubAccount({ login: githubUser.login, name: githubUser.name, avatarUrl: githubUser.avatar_url });
      setSavedAccounts(getSavedGitHubAccounts());
    }
    setLoading(false);
  }, []);

  // Auto-load data when connection is set
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

  // After returning from GitHub OAuth
  useEffect(() => {
    if (searchParams.get('select_repo') !== '1') return;
    router.replace(`/github/${projectId}`);
    setShowModal(true);
    void loadRepos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // loginHint=undefined  → normal OAuth (uses active GitHub browser session)
  // loginHint=''         → passes login= to GitHub, always shows the sign-in page
  // loginHint='username' → tells GitHub to sign in as that specific account
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

  // Show account picker when saved accounts exist; otherwise go straight to OAuth
  const handleInitiateConnect = () => {
    if (savedAccounts.length > 0) {
      setShowAccountPicker(true);
    } else {
      handleConnectGitHub();
    }
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
    <div className={`w-full px-6 py-6 ${connection ? '' : 'min-h-[calc(100vh-130px)] flex flex-col items-center justify-center'}`}>
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
          <DisconnectedView key="disconnected" onConnect={handleInitiateConnect} onLogout={() => void handleLogout()} isPostLogout={isPostLogout} />
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
  );
}

'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GitBranch, Globe, Lock, RefreshCw, Search, X, Unlink, Check, Link2, LogOut,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  getProjectGitHubRepo,
  setProjectGitHubRepo,
  clearProjectGitHubRepo,
  getGitHubToken,
  clearGitHubToken,
  fetchRepositoriesWithToken,
  type GitHubRepository,
  type ProjectGitHubConnection,
} from '@/services/githubService';

const GITHUB_CLIENT_ID = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;

// ── GitHub SVG mark ───────────────────────────────────────────────────────────
function GitHubMark({ size = 24, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 98 96" fill="currentColor" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" />
    </svg>
  );
}

// ── Disconnected state ────────────────────────────────────────────────────────
function DisconnectedView({ onConnect }: { onConnect: () => void }) {
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

      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-outfit font-bold text-slate-800">Connect to GitHub</h2>
        <p className="text-sm text-slate-500 font-outfit leading-relaxed">
          Link this project to a GitHub repository to track commits, branches, and pull requests
          directly from your project dashboard.
        </p>
      </div>

      <div className="flex flex-col gap-2 w-full text-left bg-slate-50 rounded-2xl p-4 border border-slate-100">
        {[
          'Track linked repository activity',
          'View branches and default branch',
          'Quickly jump to your GitHub repo',
        ].map(item => (
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

      {!GITHUB_CLIENT_ID && (
        <p className="text-xs text-amber-600 font-outfit bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          Set <code className="font-mono">NEXT_PUBLIC_GITHUB_CLIENT_ID</code> to enable GitHub OAuth.
        </p>
      )}
    </motion.div>
  );
}

// ── Connected state ───────────────────────────────────────────────────────────
function ConnectedView({
  connection,
  onChangeRepo,
  onDisconnect,
}: {
  connection: ProjectGitHubConnection;
  onChangeRepo: () => void;
  onDisconnect: () => void;
}) {
  const connectedDate = new Date(connection.connectedAt).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col gap-6 max-w-xl w-full"
    >
      {/* Status banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-50 border border-green-200">
        <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <Check size={14} className="text-green-600" strokeWidth={3} />
        </div>
        <span className="text-sm font-outfit font-semibold text-green-700">
          Connected to GitHub
        </span>
        <span className="ml-auto text-xs text-green-500 font-outfit">since {connectedDate}</span>
      </div>

      {/* Repo card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-4 p-5 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center shrink-0">
            <GitHubMark size={24} className="text-white" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-outfit font-bold text-slate-800 text-base truncate">
                {connection.repoFullName}
              </span>
              <span className={`flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-[11px] font-outfit font-semibold border ${
                connection.private
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-blue-50 text-blue-600 border-blue-100'
              }`}>
                {connection.private ? <Lock size={9} /> : <Globe size={9} />}
                {connection.private ? 'Private' : 'Public'}
              </span>
            </div>
            <a
              href={`https://github.com/${connection.repoFullName}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 font-outfit hover:underline mt-0.5"
            >
              github.com/{connection.repoFullName}
            </a>
          </div>
        </div>

        <div className="flex items-center gap-6 px-5 py-3.5 bg-slate-50/60">
          <div className="flex items-center gap-1.5 text-slate-600">
            <GitBranch size={13} className="text-slate-400" />
            <span className="text-xs font-outfit font-semibold">{connection.defaultBranch}</span>
            <span className="text-xs text-slate-400 font-outfit">default branch</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        <motion.button
          onClick={onChangeRepo}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-outfit font-semibold text-sm hover:bg-slate-50 transition-colors shadow-sm"
        >
          <Link2 size={14} />
          Change repository
        </motion.button>

        <motion.button
          onClick={onDisconnect}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-600 font-outfit font-semibold text-sm hover:bg-red-100 transition-colors"
        >
          <Unlink size={14} />
          Disconnect
        </motion.button>
      </div>
    </motion.div>
  );
}

// ── Repo selection modal ──────────────────────────────────────────────────────
function RepoModal({
  repos,
  search,
  loading,
  error,
  onSearch,
  onSelect,
  onClose,
  onRefresh,
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
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <GitHubMark size={18} className="text-slate-800" />
            <span className="font-outfit font-bold text-slate-800 text-base">Select a repository</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200">
            <Search size={14} className="text-slate-400 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search repositories…"
              value={search}
              onChange={e => onSearch(e.target.value)}
              className="flex-1 text-sm font-outfit bg-transparent outline-none text-slate-700 placeholder:text-slate-400"
            />
            {search && (
              <button onClick={() => onSearch('')} className="text-slate-400 hover:text-slate-600">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* List */}
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
              <button
                onClick={onRefresh}
                className="text-sm text-blue-600 font-outfit font-semibold hover:underline"
              >
                Try again
              </button>
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
                  <button
                    onClick={() => onSelect(repo)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors text-left group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 group-hover:bg-slate-200 transition-colors">
                      <GitHubMark size={14} className="text-slate-600" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-sm font-outfit font-semibold text-slate-800 truncate">
                        {repo.full_name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[11px] text-slate-400 font-outfit">
                          <GitBranch size={10} />
                          {repo.default_branch}
                        </span>
                        <span className={`flex items-center gap-1 text-[11px] font-outfit ${
                          repo.private ? 'text-slate-400' : 'text-blue-400'
                        }`}>
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

// ── Page root ─────────────────────────────────────────────────────────────────
export default function GitHubProjectPage({ projectId }: { projectId: string }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [connection, setConnection] = useState<ProjectGitHubConnection | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [allRepos, setAllRepos] = useState<GitHubRepository[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState<string | null>(null);

  useEffect(() => {
    setConnection(getProjectGitHubRepo(projectId));
    setIsAuthenticated(Boolean(getGitHubToken()));
  }, [projectId]);

  const loadRepos = useCallback(async () => {
    const token = getGitHubToken();
    if (!token) return false;
    setLoadingRepos(true);
    setRepoError(null);
    try {
      const data = await fetchRepositoriesWithToken(token);
      setAllRepos(data);
      return true;
    } catch (err) {
      setRepoError(err instanceof Error ? err.message : 'Failed to load repositories');
      return false;
    } finally {
      setLoadingRepos(false);
    }
  }, []);

  // After returning from GitHub OAuth, open the modal automatically
  useEffect(() => {
    if (searchParams.get('select_repo') !== '1') return;
    // Remove query param without navigation
    router.replace(`/github/${projectId}`);
    setShowModal(true);
    void loadRepos();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnectGitHub = () => {
    if (!GITHUB_CLIENT_ID) {
      alert('GitHub OAuth is not configured.\nPlease set NEXT_PUBLIC_GITHUB_CLIENT_ID in your environment.');
      return;
    }
    const redirectUri = `${window.location.origin}/github/callback`;
    const url =
      `https://github.com/login/oauth/authorize` +
      `?client_id=${GITHUB_CLIENT_ID}` +
      `&scope=repo` +
      `&state=${projectId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`;
    window.location.href = url;
  };

  const handleOpenModal = async () => {
    const token = getGitHubToken();
    if (!token) {
      handleConnectGitHub();
      return;
    }
    setShowModal(true);
    await loadRepos();
  };

  const handleSelectRepo = (repo: GitHubRepository) => {
    setProjectGitHubRepo(projectId, repo);
    setConnection(getProjectGitHubRepo(projectId));
    setShowModal(false);
    setRepoSearch('');
  };

  const handleDisconnect = () => {
    clearProjectGitHubRepo(projectId);
    setConnection(null);
  };

  const handleLogout = async () => {
    const token = getGitHubToken();

    // Revoke the grant on GitHub's side so the next connect shows the full OAuth screen.
    // We don't block on failure — local state is always cleared regardless.
    if (token) {
      try {
        await fetch('/api/github/revoke', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });
      } catch {
        // ignore network errors
      }
    }

    clearGitHubToken();
    clearProjectGitHubRepo(projectId);
    setIsAuthenticated(false);
    setConnection(null);
    setAllRepos([]);
  };

  const filteredRepos = allRepos.filter(r =>
    r.full_name.toLowerCase().includes(repoSearch.toLowerCase())
  );

  return (
    <div className="w-full min-h-[calc(100vh-130px)] flex flex-col items-center justify-center py-12 px-4">
      <AnimatePresence mode="wait">
        {connection ? (
          <ConnectedView
            key="connected"
            connection={connection}
            onChangeRepo={handleOpenModal}
            onDisconnect={handleDisconnect}
          />
        ) : (
          <DisconnectedView
            key="disconnected"
            onConnect={handleConnectGitHub}
          />
        )}
      </AnimatePresence>

      {isAuthenticated && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
            <GitHubMark size={11} className="text-white" />
          </div>
          <span className="text-xs text-slate-500 font-outfit">GitHub account connected</span>
          <button
            onClick={() => void handleLogout()}
            className="ml-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:border-red-200 border border-transparent text-slate-500 hover:text-red-600 font-outfit font-semibold text-xs transition-colors"
          >
            <LogOut size={12} />
            Logout
          </button>
        </motion.div>
      )}

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
    </div>
  );
}

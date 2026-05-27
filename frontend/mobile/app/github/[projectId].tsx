import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, FlatList, TextInput, Modal,
  Platform, Linking, LayoutChangeEvent,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

import {
  getGitHubToken, saveGitHubToken, clearGitHubToken,
  getProjectGitHubRepo, setProjectGitHubRepo, clearProjectGitHubRepo,
  fetchGitHubUser, fetchRepositoriesWithToken, fetchPullRequests, fetchCommits, fetchIssues,
  exchangeCodeForToken,
  type ProjectGitHubConnection, type GitHubUser,
  type GitHubPullRequest, type GitHubCommit, type GitHubIssue, type GitHubRepository,
} from '../../src/services/githubMobileService';

const GITHUB_CLIENT_ID = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID ?? '';
const REDIRECT_URI = 'mobile://github-callback';
type ActiveTab = 'prs' | 'commits' | 'issues';

// ── Helpers ───────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function prStatusInfo(pr: GitHubPullRequest) {
  if (pr.draft) return { label: 'Draft', color: '#94A3B8', bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.25)' };
  if (pr.merged_at) return { label: 'Merged', color: '#C084FC', bg: 'rgba(192,132,252,0.12)', border: 'rgba(192,132,252,0.3)' };
  if (pr.state === 'closed') return { label: 'Closed', color: '#F87171', bg: 'rgba(248,113,113,0.12)', border: 'rgba(248,113,113,0.25)' };
  return { label: 'Open', color: '#34D399', bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)' };
}

// ── Glass Card ────────────────────────────────────────────────────────────────
function GlassCard({ children, style }: { children: React.ReactNode; style?: object }) {
  return (
    <View style={[gc.wrap, style]}>
      <BlurView intensity={16} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
      <View style={gc.inner}>{children}</View>
    </View>
  );
}
const gc = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  inner: { padding: 14 },
});

// ── PR Card ───────────────────────────────────────────────────────────────────
function PRCard({ pr }: { pr: GitHubPullRequest }) {
  const st = prStatusInfo(pr);
  return (
    <TouchableOpacity onPress={() => Linking.openURL(pr.html_url)} activeOpacity={0.8}>
      <GlassCard>
        <View style={s.rowHead}>
          <View style={[s.badge, { backgroundColor: st.bg, borderColor: st.border }]}>
            <View style={[s.dot, { backgroundColor: st.color }]} />
            <Text style={[s.badgeText, { color: st.color }]}>{st.label}</Text>
          </View>
          <Text style={s.meta}>#{pr.number}</Text>
          <Text style={[s.meta, { marginLeft: 'auto' }]}>{timeAgo(pr.updated_at)}</Text>
        </View>
        <Text style={s.cardTitle} numberOfLines={2}>{pr.title}</Text>
        <View style={s.branchRow}>
          <MaterialCommunityIcons name="source-branch" size={11} color="#475569" />
          <Text style={s.branchText}>{pr.head.ref}</Text>
          <Text style={s.arrow}>→</Text>
          <Text style={s.branchText}>{pr.base.ref}</Text>
        </View>
        <View style={s.authorRow}>
          {pr.user?.avatar_url
            ? <Image source={{ uri: pr.user.avatar_url }} style={s.avatar} contentFit="cover" />
            : null}
          <Text style={s.authorText}>@{pr.user?.login}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

// ── Commit Card ───────────────────────────────────────────────────────────────
function CommitCard({ commit }: { commit: GitHubCommit }) {
  const firstLine = commit.commit.message.split('\n')[0];
  const authorName = commit.author?.login ?? commit.commit.author.name;
  return (
    <TouchableOpacity onPress={() => Linking.openURL(commit.html_url)} activeOpacity={0.8}>
      <GlassCard>
        <View style={s.rowHead}>
          <View style={s.shaChip}>
            <MaterialCommunityIcons name="source-commit" size={10} color="#64748B" />
            <Text style={s.shaText}>{commit.sha.slice(0, 7)}</Text>
          </View>
          <Text style={[s.meta, { marginLeft: 'auto' }]}>{timeAgo(commit.commit.author.date)}</Text>
        </View>
        <Text style={s.cardTitle} numberOfLines={2}>{firstLine}</Text>
        <View style={s.authorRow}>
          {commit.author?.avatar_url
            ? <Image source={{ uri: commit.author.avatar_url }} style={s.avatar} contentFit="cover" />
            : null}
          <Text style={s.authorText}>@{authorName}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

// ── Issue Card ────────────────────────────────────────────────────────────────
function IssueCard({ issue }: { issue: GitHubIssue }) {
  const open = issue.state === 'open';
  return (
    <TouchableOpacity onPress={() => Linking.openURL(issue.html_url)} activeOpacity={0.8}>
      <GlassCard>
        <View style={s.rowHead}>
          <View style={[s.badge, open
            ? { backgroundColor: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.3)' }
            : { backgroundColor: 'rgba(192,132,252,0.12)', borderColor: 'rgba(192,132,252,0.3)' },
          ]}>
            <View style={[s.dot, { backgroundColor: open ? '#34D399' : '#C084FC' }]} />
            <Text style={[s.badgeText, { color: open ? '#34D399' : '#C084FC' }]}>
              {open ? 'Open' : 'Closed'}
            </Text>
          </View>
          <Text style={s.meta}>#{issue.number}</Text>
          <Text style={[s.meta, { marginLeft: 'auto' }]}>{timeAgo(issue.updated_at)}</Text>
        </View>
        <Text style={s.cardTitle} numberOfLines={2}>{issue.title}</Text>
        <View style={s.authorRow}>
          {issue.user?.avatar_url
            ? <Image source={{ uri: issue.user.avatar_url }} style={s.avatar} contentFit="cover" />
            : null}
          <Text style={s.authorText}>@{issue.user?.login}</Text>
          <MaterialCommunityIcons name="comment-outline" size={11} color="#334155" style={{ marginLeft: 10 }} />
          <Text style={s.authorText}>{issue.comments}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <View style={[gc.wrap, { height: 100, opacity: 0.35 }]}>
      <LinearGradient
        colors={['rgba(255,255,255,0.04)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.04)']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      />
    </View>
  );
}

// ── Repo Picker Modal ─────────────────────────────────────────────────────────
function RepoPickerModal({
  visible, repos, loading, search, onSearch, onSelect, onClose,
}: {
  visible: boolean;
  repos: GitHubRepository[];
  loading: boolean;
  search: string;
  onSearch: (v: string) => void;
  onSelect: (repo: GitHubRepository) => void;
  onClose: () => void;
}) {
  const filtered = repos.filter(r => r.full_name.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={m.backdrop}>
        <View style={m.sheet}>
          <BlurView intensity={28} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
          <View style={m.content}>
            <View style={m.handle} />
            <View style={m.titleRow}>
              <MaterialCommunityIcons name="github" size={17} color="#fff" />
              <Text style={m.title}>Select a repository</Text>
              <TouchableOpacity onPress={onClose} style={m.closeBtn}>
                <MaterialCommunityIcons name="close" size={16} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={m.searchBox}>
              <MaterialCommunityIcons name="magnify" size={15} color="#475569" />
              <TextInput
                style={m.searchInput}
                placeholder="Search repositories…"
                placeholderTextColor="#334155"
                value={search}
                onChangeText={onSearch}
                autoFocus
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => onSearch('')}>
                  <MaterialCommunityIcons name="close-circle" size={14} color="#334155" />
                </TouchableOpacity>
              )}
            </View>
            {loading ? (
              <View style={m.center}><ActivityIndicator color="#6366F1" /></View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={r => String(r.id)}
                contentContainerStyle={{ paddingBottom: 40 }}
                ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)' }} />}
                renderItem={({ item }) => (
                  <TouchableOpacity style={m.repoRow} onPress={() => onSelect(item)} activeOpacity={0.7}>
                    <View style={m.repoIcon}>
                      <MaterialCommunityIcons name="github" size={13} color="#94A3B8" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={m.repoName} numberOfLines={1}>{item.full_name}</Text>
                      <Text style={m.repoMeta}>
                        {item.private ? '🔒 Private' : '🌐 Public'} · {item.default_branch}
                      </Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={16} color="#334155" />
                  </TouchableOpacity>
                )}
                ListEmptyComponent={<Text style={m.empty}>No repositories found</Text>}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function GitHubScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [token, setToken] = useState<string | null>(null);
  const [connection, setConnection] = useState<ProjectGitHubConnection | null>(null);
  const [ghUser, setGhUser] = useState<GitHubUser | null>(null);

  const [prs, setPRs] = useState<GitHubPullRequest[]>([]);
  const [commits, setCommits] = useState<GitHubCommit[]>([]);
  const [issues, setIssues] = useState<GitHubIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('prs');

  const [repos, setRepos] = useState<GitHubRepository[]>([]);
  const [repoSearch, setRepoSearch] = useState('');
  const [repoLoading, setRepoLoading] = useState(false);
  const [showRepoPicker, setShowRepoPicker] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Nav bar height (measured via onLayout for correct FlatList padding)
  const [navH, setNavH] = useState(0);

  // ── Load persisted state ─────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [tok, conn] = await Promise.all([
        getGitHubToken(),
        getProjectGitHubRepo(projectId),
      ]);
      if (!alive) return;
      setToken(tok);
      setConnection(conn);
    })();
    return () => { alive = false; };
  }, [projectId]);

  // ── Load GitHub data ─────────────────────────────────────────────────────
  const loadData = useCallback(async (tok: string, conn: ProjectGitHubConnection) => {
    setLoading(true);
    setError(null);
    try {
      const [prsRes, commitsRes, issuesRes, userRes] = await Promise.allSettled([
        fetchPullRequests(tok, conn.ownerLogin, conn.repoName),
        fetchCommits(tok, conn.ownerLogin, conn.repoName),
        fetchIssues(conn.repoFullName, tok),
        fetchGitHubUser(tok),
      ]);
      if (prsRes.status === 'fulfilled') setPRs(prsRes.value);
      else setError(prsRes.reason instanceof Error ? prsRes.reason.message : String(prsRes.reason));
      if (commitsRes.status === 'fulfilled') setCommits(commitsRes.value);
      if (issuesRes.status === 'fulfilled') setIssues(issuesRes.value);
      if (userRes.status === 'fulfilled') setGhUser(userRes.value);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token && connection) void loadData(token, connection);
  }, [token, connection, loadData]);

  // ── OAuth connect ────────────────────────────────────────────────────────
  const handleConnect = useCallback(async () => {
    if (!GITHUB_CLIENT_ID) {
      setError('GitHub OAuth not configured (EXPO_PUBLIC_GITHUB_CLIENT_ID missing).');
      return;
    }
    setConnecting(true);
    setError(null);
    try {
      const authUrl =
        `https://github.com/login/oauth/authorize` +
        `?client_id=${GITHUB_CLIENT_ID}&scope=repo&state=${projectId}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, REDIRECT_URI);
      if (result.type === 'success' && result.url) {
        const code = new URL(result.url).searchParams.get('code');
        if (code) {
          const accessToken = await exchangeCodeForToken(code);
          if (accessToken) {
            await saveGitHubToken(accessToken);
            setToken(accessToken);
            const data = await fetchRepositoriesWithToken(accessToken).catch(() => []);
            setRepos(data);
            setShowRepoPicker(true);
          } else {
            setError('Token exchange failed. Check EXPO_PUBLIC_WEB_URL points to the web frontend.');
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setConnecting(false);
    }
  }, [projectId]);

  const loadRepos = useCallback(async () => {
    if (!token) return;
    setRepoLoading(true);
    try {
      const data = await fetchRepositoriesWithToken(token);
      setRepos(data);
    } finally {
      setRepoLoading(false);
    }
  }, [token]);

  const handleSelectRepo = useCallback(async (repo: GitHubRepository) => {
    await setProjectGitHubRepo(projectId, repo);
    const conn = await getProjectGitHubRepo(projectId);
    setConnection(conn);
    setShowRepoPicker(false);
    setRepoSearch('');
    if (token && conn) void loadData(token, conn);
  }, [projectId, token, loadData]);

  const handleDisconnect = useCallback(async () => {
    await clearGitHubToken();
    await clearProjectGitHubRepo(projectId);
    setToken(null); setConnection(null); setGhUser(null);
    setPRs([]); setCommits([]); setIssues([]);
    setError(null);
  }, [projectId]);

  // ── Computed ─────────────────────────────────────────────────────────────
  const tabData =
    activeTab === 'prs' ? prs :
    activeTab === 'commits' ? commits :
    issues;

  // ── DISCONNECTED screen ──────────────────────────────────────────────────
  if (!connection || !token) {
    return (
      <LinearGradient
        colors={['#050B1A', '#0C0921', '#120820', '#080E1C']}
        style={StyleSheet.absoluteFill}
      >
        <StatusBar style="light" />
        <View style={[s.orb, { top: -80, left: '15%', width: 300, height: 300, backgroundColor: 'rgba(99,102,241,0.18)' }]} />
        <View style={[s.orb, { bottom: 60, right: '5%', width: 240, height: 240, backgroundColor: 'rgba(168,85,247,0.12)' }]} />

        <ScrollView
          contentContainerStyle={[s.disconnectContent, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color="rgba(255,255,255,0.75)" />
          </TouchableOpacity>

          {/* Logo orb */}
          <View style={s.logoOrb}>
            <BlurView intensity={20} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
            <MaterialCommunityIcons name="github" size={46} color="#fff" />
          </View>

          <Text style={s.heroTitle}>Connect to GitHub</Text>
          <Text style={s.heroSub}>
            Link this project to a repository to track pull requests, commits, and issues.
          </Text>

          {/* Feature list */}
          <GlassCard style={{ width: '100%', marginTop: 4 }}>
            {[
              { icon: 'source-pull' as const, text: 'View pull requests in real time' },
              { icon: 'source-commit' as const, text: 'Track commits and branch history' },
              { icon: 'alert-circle-outline' as const, text: 'Monitor open and closed issues' },
            ].map(f => (
              <View key={f.text} style={s.featureRow}>
                <View style={s.featureIcon}>
                  <MaterialCommunityIcons name={f.icon} size={13} color="#34D399" />
                </View>
                <Text style={s.featureText}>{f.text}</Text>
                <MaterialCommunityIcons name="check" size={13} color="#34D399" />
              </View>
            ))}
          </GlassCard>

          {error ? (
            <View style={s.errorBox}>
              <MaterialCommunityIcons name="alert-circle-outline" size={14} color="#F87171" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={handleConnect}
            disabled={connecting}
            activeOpacity={0.85}
            style={s.connectWrap}
          >
            <LinearGradient
              colors={['rgba(99,102,241,0.75)', 'rgba(168,85,247,0.65)']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.connectBtn}
            >
              {connecting
                ? <ActivityIndicator color="#fff" size="small" />
                : <MaterialCommunityIcons name="github" size={18} color="#fff" />}
              <Text style={s.connectText}>
                {connecting ? 'Connecting…' : 'Connect to GitHub'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        <RepoPickerModal
          visible={showRepoPicker} repos={repos} loading={repoLoading}
          search={repoSearch} onSearch={setRepoSearch}
          onSelect={handleSelectRepo} onClose={() => setShowRepoPicker(false)}
        />
      </LinearGradient>
    );
  }

  // ── CONNECTED screen ─────────────────────────────────────────────────────
  return (
    <LinearGradient
      colors={['#050B1A', '#0C0921', '#120820', '#080E1C']}
      style={StyleSheet.absoluteFill}
    >
      <StatusBar style="light" />
      <View style={[s.orb, { top: -60, left: '20%', width: 280, height: 280, backgroundColor: 'rgba(99,102,241,0.16)' }]} />
      <View style={[s.orb, { bottom: 40, right: '8%', width: 220, height: 220, backgroundColor: 'rgba(168,85,247,0.11)' }]} />

      {/* Fixed top nav — measured via onLayout for list padding */}
      <View
        style={s.topNav}
        onLayout={(e: LayoutChangeEvent) => setNavH(e.nativeEvent.layout.height)}
        pointerEvents="box-none"
      >
        <BlurView intensity={24} tint="dark" experimentalBlurMethod="dimezisBlurView" style={StyleSheet.absoluteFill} />
        <View style={{ borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' }}>
          {/* Row 1: Back / Repo / Actions */}
          <View style={[s.navRow, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity onPress={() => router.back()} style={s.navBackBtn}>
              <MaterialCommunityIcons name="arrow-left" size={20} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>

            <View style={s.repoBadge}>
              <MaterialCommunityIcons name="github" size={13} color="#fff" />
              <Text style={s.repoLabel} numberOfLines={1}>{connection.repoFullName}</Text>
              <View style={[s.visibilityChip,
                connection.private
                  ? { backgroundColor: 'rgba(148,163,184,0.12)', borderColor: 'rgba(148,163,184,0.22)' }
                  : { backgroundColor: 'rgba(96,165,250,0.1)', borderColor: 'rgba(96,165,250,0.22)' }
              ]}>
                <Text style={[s.visibilityText, { color: connection.private ? '#94A3B8' : '#60A5FA' }]}>
                  {connection.private ? 'Private' : 'Public'}
                </Text>
              </View>
            </View>

            <View style={s.navActions}>
              <TouchableOpacity
                onPress={() => token && connection && void loadData(token, connection)}
                disabled={loading}
                style={s.navActionBtn}
              >
                <MaterialCommunityIcons name="refresh" size={17} color={loading ? '#1E293B' : '#64748B'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { void loadRepos(); setShowRepoPicker(true); }} style={s.navActionBtn}>
                <MaterialCommunityIcons name="link-variant" size={17} color="#64748B" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDisconnect} style={s.navActionBtn}>
                <MaterialCommunityIcons name="logout" size={17} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Row 2: User + branch */}
          <View style={s.navMeta}>
            {ghUser?.avatar_url ? (
              <Image source={{ uri: ghUser.avatar_url }} style={s.userAvatar} contentFit="cover" />
            ) : null}
            {ghUser ? <Text style={s.userLogin}>@{ghUser.login}</Text> : null}
            <View style={s.branchPill}>
              <MaterialCommunityIcons name="source-branch" size={10} color="#475569" />
              <Text style={s.branchPillText}>{connection.defaultBranch}</Text>
            </View>
          </View>
        </View>

        {/* Tab switcher */}
        <View style={s.tabRow}>
          {([
            { id: 'prs' as ActiveTab, label: 'PRs', icon: 'source-pull' as const, count: prs.length },
            { id: 'commits' as ActiveTab, label: 'Commits', icon: 'source-commit' as const, count: commits.length },
            { id: 'issues' as ActiveTab, label: 'Issues', icon: 'alert-circle-outline' as const, count: issues.length },
          ]).map(tab => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[s.tabBtn, active && s.tabBtnActive]}
                activeOpacity={0.75}
              >
                <MaterialCommunityIcons name={tab.icon} size={13} color={active ? '#fff' : '#334155'} />
                <Text style={[s.tabText, active && s.tabTextActive]}>
                  {tab.label}{!loading && tab.count > 0 ? ` (${tab.count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List content */}
      {loading ? (
        <ScrollView
          contentContainerStyle={[s.listPad, { paddingTop: navH + 12 }]}
          showsVerticalScrollIndicator={false}
        >
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={{ marginBottom: 12 }}>
              <SkeletonCard />
            </View>
          ))}
        </ScrollView>
      ) : error ? (
        <View style={[s.centerContent, { paddingTop: navH }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={34} color="#EF4444" />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity
            onPress={() => token && connection && void loadData(token, connection)}
            style={s.retryBtn}
          >
            <Text style={s.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : tabData.length === 0 ? (
        <View style={[s.centerContent, { paddingTop: navH }]}>
          <MaterialCommunityIcons
            name={activeTab === 'commits' ? 'source-commit' : activeTab === 'issues' ? 'alert-circle-outline' : 'source-pull'}
            size={34}
            color="#1E293B"
          />
          <Text style={s.emptyText}>
            No {activeTab === 'prs' ? 'pull requests' : activeTab} found
          </Text>
        </View>
      ) : (
        <FlatList
          data={tabData as (GitHubPullRequest | GitHubCommit | GitHubIssue)[]}
          keyExtractor={item => 'sha' in item ? item.sha : String((item as GitHubPullRequest | GitHubIssue).id)}
          contentContainerStyle={[s.listPad, { paddingTop: navH + 12, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => {
            if (activeTab === 'prs') return <PRCard pr={item as GitHubPullRequest} />;
            if (activeTab === 'commits') return <CommitCard commit={item as GitHubCommit} />;
            return <IssueCard issue={item as GitHubIssue} />;
          }}
        />
      )}

      <RepoPickerModal
        visible={showRepoPicker} repos={repos} loading={repoLoading}
        search={repoSearch} onSearch={setRepoSearch}
        onSelect={handleSelectRepo} onClose={() => setShowRepoPicker(false)}
      />
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Ambient
  orb: { position: 'absolute', borderRadius: 9999 },

  // Disconnect
  disconnectContent: { alignItems: 'center', paddingHorizontal: 28, gap: 16 },
  backBtn: { alignSelf: 'flex-start', width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  logoOrb: { width: 92, height: 92, borderRadius: 26, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center', ...Platform.select({ ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20 }, android: { elevation: 10 } }) },
  heroTitle: { fontSize: 23, fontWeight: '900', color: '#F1F5F9', letterSpacing: -0.5, textAlign: 'center' },
  heroSub: { fontSize: 14, color: '#475569', textAlign: 'center', lineHeight: 22 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  featureIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: 'rgba(52,211,153,0.08)', borderWidth: 1, borderColor: 'rgba(52,211,153,0.18)', alignItems: 'center', justifyContent: 'center' },
  featureText: { flex: 1, fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  errorBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, width: '100%', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.22)', borderRadius: 12, padding: 12 },
  errorText: { flex: 1, fontSize: 12, color: '#F87171', lineHeight: 18 },
  connectWrap: { width: '100%', borderRadius: 18, overflow: 'hidden', ...Platform.select({ ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.45, shadowRadius: 16 }, android: { elevation: 8 } }) },
  connectBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 15, paddingHorizontal: 24, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)' },
  connectText: { fontSize: 15, fontWeight: '800', color: '#fff', letterSpacing: 0.2 },

  // Top nav (connected)
  topNav: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 50, overflow: 'hidden', backgroundColor: 'rgba(5,11,26,0.6)' },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingBottom: 10 },
  navBackBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  repoBadge: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', minWidth: 0 },
  repoLabel: { flex: 1, fontSize: 12, fontWeight: '700', color: '#CBD5E1', minWidth: 0 },
  visibilityChip: { borderRadius: 7, paddingHorizontal: 6, paddingVertical: 2, borderWidth: 1, flexShrink: 0 },
  visibilityText: { fontSize: 10, fontWeight: '700' },
  navActions: { flexDirection: 'row', gap: 6, flexShrink: 0 },
  navActionBtn: { width: 33, height: 33, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  navMeta: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 14, paddingBottom: 10 },
  userAvatar: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)' },
  userLogin: { fontSize: 11, color: '#475569', fontWeight: '600' },
  branchPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 8, paddingHorizontal: 7, paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.07)' },
  branchPillText: { fontSize: 10, color: '#334155', fontWeight: '600' },

  // Tabs
  tabRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 9, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tabBtnActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: 'rgba(99,102,241,0.35)', ...Platform.select({ ios: { shadowColor: '#6366F1', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 8 }, android: { elevation: 4 } }) },
  tabText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  tabTextActive: { color: '#fff' },

  // List
  listPad: { paddingHorizontal: 14 },
  centerContent: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emptyText: { fontSize: 14, color: '#1E293B', fontWeight: '600' },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, backgroundColor: 'rgba(99,102,241,0.18)', borderWidth: 1, borderColor: 'rgba(99,102,241,0.3)' },
  retryText: { fontSize: 13, color: '#818CF8', fontWeight: '700' },

  // Cards
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 8 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  meta: { fontSize: 11, color: '#334155', fontWeight: '600' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#E2E8F0', lineHeight: 20, marginBottom: 8 },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  branchText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  arrow: { fontSize: 11, color: '#1E293B' },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  avatar: { width: 18, height: 18, borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  authorText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  shaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  shaText: { fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', color: '#64748B', fontWeight: '600' },
});

// ── Repo modal styles ─────────────────────────────────────────────────────────
const m = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(5,8,20,0.65)' },
  sheet: { maxHeight: '80%', borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden', backgroundColor: 'rgba(10,15,35,0.92)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  content: { flex: 1, padding: 20 },
  handle: { width: 38, height: 4, backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  title: { flex: 1, fontSize: 15, fontWeight: '800', color: '#F1F5F9' },
  closeBtn: { width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.09)', paddingHorizontal: 11, paddingVertical: 9, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14, color: '#E2E8F0', padding: 0 },
  repoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11 },
  repoIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  repoName: { fontSize: 13, fontWeight: '700', color: '#CBD5E1' },
  repoMeta: { fontSize: 11, color: '#334155', marginTop: 2 },
  center: { paddingVertical: 28, alignItems: 'center' },
  empty: { fontSize: 13, color: '#334155', textAlign: 'center' },
});

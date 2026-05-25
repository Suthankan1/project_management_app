'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { getUserFromToken, User } from '@/lib/auth';
import api from '@/lib/axios';
import RecentProjectCard from '../dashboard/components/recentspaces/RecentProjectCard';

import Link from 'next/link';
import { LayoutGrid, List } from 'lucide-react';

interface SpaceProject {
    id: number;
    name: string;
    projectKey?: string;
    isFavorite?: boolean;
    favoriteMarkedAt?: string;
    type?: 'AGILE' | 'KANBAN' | string;
    updatedAt?: string;
    lastAccessedAt?: string;
    memberCount?: number;
}

export default function SpacesPage() {
    const [projects, setProjects] = useState<SpaceProject[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const searchParams = useSearchParams();
    const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'favorites-first'>('recent');
    const [filterBy, setFilterBy] = useState<'all' | 'starred'>('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [user, setUser] = useState<User | null>(null);

    const setAndPersistView = (nextView: 'grid' | 'list') => {
        setViewMode(nextView);
        localStorage.setItem('spaces-view', nextView);
    };

    const fetchProjects = async () => {
        try {
            const response = await api.get('/api/projects');
            setProjects(response.data);
        } catch (error) {
            console.error('Failed to fetch projects:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const filter = searchParams.get('filter');
        if (filter === 'favorites') {
            setFilterBy('starred');
            setSortBy('favorites-first');
        } else if (filter === 'recent') {
            setFilterBy('all');
            setSortBy('recent');
        }
    }, [searchParams]);

    useEffect(() => {
        const savedView = localStorage.getItem('spaces-view') ?? 'grid';
        if (savedView === 'list' || savedView === 'grid') setViewMode(savedView);
    }, []);

    useEffect(() => {
        const userData = getUserFromToken();
        setUser(userData);
        void fetchProjects();
    }, []);

    const filteredAndSortedProjects = [...projects]
        .filter((project) => {
            const matchesSearch =
                project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (project.projectKey && project.projectKey.toLowerCase().includes(searchQuery.toLowerCase()));
            if (filterBy === 'starred') return matchesSearch && Boolean(project.isFavorite);
            return matchesSearch;
        })
        .sort((a, b) => {
            if (filterBy === 'starred') {
                const aAt = a.favoriteMarkedAt ? new Date(a.favoriteMarkedAt).getTime() : 0;
                const bAt = b.favoriteMarkedAt ? new Date(b.favoriteMarkedAt).getTime() : 0;
                return aAt !== bAt ? bAt - aAt : a.name.localeCompare(b.name);
            }
            if (sortBy === 'favorites-first') {
                const aS = Boolean(a.isFavorite), bS = Boolean(b.isFavorite);
                return aS === bS ? a.name.localeCompare(b.name) : bS ? 1 : -1;
            }
            if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
            const aR = a.lastAccessedAt ? new Date(a.lastAccessedAt).getTime() : 0;
            const bR = b.lastAccessedAt ? new Date(b.lastAccessedAt).getTime() : 0;
            return bR - aR;
        });

    return (
        <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6 pt-2 sm:pt-6 pb-10">

            {/* ── Mobile top bar ──────────────────────────────────────────── */}
            <div className="flex items-center gap-2 py-3 md:hidden">
                <button
                    onClick={() => window.dispatchEvent(new CustomEvent('planora:sidebar:toggle'))}
                    className="p-2 -ml-1 rounded-xl text-[#6B6F7B] hover:bg-[#F0F0F5] transition-colors"
                    aria-label="Toggle Sidebar"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                </button>
                <div className="flex-1 font-outfit text-[17px] font-extrabold tracking-tight text-[#1A1A2E] flex items-center gap-2">
                    <span className="w-1.5 h-4 bg-[#155DFC] rounded-full" />
                    PLANORA
                </div>
                <Link
                    href="/createProject"
                    className="flex items-center justify-center w-8 h-8 rounded-xl text-white"
                    style={{ background: '#155DFC' }}
                    aria-label="Create project"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                </Link>
            </div>

            {/* ── Desktop header ──────────────────────────────────────────── */}
            <div className="hidden sm:flex items-center justify-between mb-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#1A1A2E] leading-tight">All Projects</h1>
                    <p className="text-[#6B6F7B] text-sm mt-0.5">
                        {projects.length > 0
                            ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
                            : 'Create and manage your projects'}
                    </p>
                </div>
            </div>

            {/* ── Mobile page title (compact) ─────────────────────────────── */}
            <div className="md:hidden mb-3">
                <h1 className="text-xl font-bold text-[#1A1A2E] leading-tight">All Projects</h1>
                <p className="text-[#6B6F7B] text-xs mt-0.5">
                    {projects.length > 0
                        ? `${projects.length} project${projects.length !== 1 ? 's' : ''}`
                        : 'Create and manage your projects'}
                </p>
            </div>

            {/* ── View tabs ───────────────────────────────────────────────── */}
            <div className="flex gap-1 mb-4 bg-[#F0F0F5] p-1 rounded-xl w-full sm:w-fit">
                <span className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-lg text-[13px] font-semibold bg-white text-[#155DFC] shadow-sm cursor-default">
                    All Projects
                </span>
                <Link
                    href="/portfolios"
                    className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 rounded-lg text-[13px] font-medium text-[#6B6F7B] hover:text-[#1A1A2E] transition-colors"
                >
                    Portfolios
                </Link>
            </div>

            {/* ── Search (both) ───────────────────────────────────────────── */}
            <div className="relative mb-3">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                </div>
                <input
                    type="text"
                    placeholder="Search projects"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-9 pr-3 py-2.5 border border-[#E8E8ED] rounded-xl bg-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#155DFC]/20 focus:border-[#155DFC] text-sm transition-all text-[#1A1A2E]"
                />
            </div>

            {/* ── Mobile filter strip (single scrollable row) ─────────────── */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-3 sm:hidden">
                {(['all', 'starred'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setFilterBy(tab)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            filterBy === tab
                                ? 'bg-[#155DFC] text-white'
                                : 'bg-[#F0F0F5] text-[#6B6F7B]'
                        }`}
                    >
                        {tab === 'all' ? 'All' : '⭐ Starred'}
                    </button>
                ))}
                <div className="w-px h-4 bg-[#E8E8ED] flex-shrink-0" />
                {([
                    { key: 'recent', label: 'Recent' },
                    { key: 'alphabetical', label: 'A–Z' },
                    { key: 'favorites-first', label: 'Favorites' },
                ] as const).map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setSortBy(tab.key)}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            sortBy === tab.key
                                ? 'bg-[#155DFC] text-white'
                                : 'bg-[#F0F0F5] text-[#6B6F7B]'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
                <div className="w-px h-4 bg-[#E8E8ED] flex-shrink-0" />
                <div className="flex-shrink-0 flex items-center bg-[#F0F0F5] p-0.5 rounded-lg">
                    <button
                        onClick={() => setAndPersistView('grid')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white text-[#155DFC] shadow-sm' : 'text-[#6B6F7B]'}`}
                        aria-label="Grid view"
                    >
                        <LayoutGrid size={14} />
                    </button>
                    <button
                        onClick={() => setAndPersistView('list')}
                        className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-[#155DFC] shadow-sm' : 'text-[#6B6F7B]'}`}
                        aria-label="List view"
                    >
                        <List size={14} />
                    </button>
                </div>
            </div>

            {/* ── Desktop filter bar ──────────────────────────────────────── */}
            <div className="hidden sm:flex justify-between items-center gap-3 pb-4 border-b border-[#E8E8ED] mb-6">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-[#F0F0F5] p-1 rounded-xl">
                        {(['all', 'starred'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setFilterBy(tab)}
                                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                                    filterBy === tab ? 'bg-white text-[#155DFC] shadow-sm' : 'text-[#6B6F7B] hover:text-[#1A1A2E]'
                                }`}
                            >
                                {tab === 'all' ? 'All' : 'Starred'}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1 bg-[#F0F0F5] p-1 rounded-xl">
                        {([
                            { key: 'recent', label: 'Recent' },
                            { key: 'alphabetical', label: 'A-Z' },
                            { key: 'favorites-first', label: 'Favorites first' },
                        ] as const).map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setSortBy(tab.key)}
                                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${
                                    sortBy === tab.key ? 'bg-white text-[#155DFC] shadow-sm' : 'text-[#6B6F7B] hover:text-[#1A1A2E]'
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-[#F0F0F5] p-1 rounded-xl">
                        <button
                            onClick={() => setAndPersistView('grid')}
                            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${viewMode === 'grid' ? 'bg-white text-[#155DFC] shadow-sm' : 'text-[#6B6F7B] hover:text-[#1A1A2E]'}`}
                            aria-label="Grid view"
                        >
                            <LayoutGrid size={16} />
                        </button>
                        <button
                            onClick={() => setAndPersistView('list')}
                            className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-all ${viewMode === 'list' ? 'bg-white text-[#155DFC] shadow-sm' : 'text-[#6B6F7B] hover:text-[#1A1A2E]'}`}
                            aria-label="List view"
                        >
                            <List size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Projects ────────────────────────────────────────────────── */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="skeleton h-[160px] rounded-2xl" />
                    ))}
                </div>
            ) : filteredAndSortedProjects.length > 0 ? (
                viewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                        {filteredAndSortedProjects.map((project) => (
                            <RecentProjectCard
                                key={project.id}
                                id={project.id.toString()}
                                name={project.name}
                                projectKey={project.projectKey}
                                isFavorite={project.isFavorite}
                                onFavoriteToggle={() => void fetchProjects()}
                                type={project.type === 'AGILE' ? 'Agile Scrum' : 'Kanban'}
                                boardCount={1}
                                width="w-full min-w-0 max-w-none"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl border border-[#E8E8ED] bg-white">
                        <table className="min-w-full text-sm">
                            <thead className="bg-[#F7F8FA] text-[#6B6F7B]">
                                <tr>
                                    <th className="text-left px-4 py-3 font-semibold">Project Name</th>
                                    <th className="text-left px-4 py-3 font-semibold">Type</th>
                                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Members</th>
                                    <th className="text-left px-4 py-3 font-semibold hidden md:table-cell">Last Updated</th>
                                    <th className="text-left px-4 py-3 font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredAndSortedProjects.map((project) => (
                                    <tr key={project.id} className="border-t border-[#F0F0F5] hover:bg-[#F7F8FA]">
                                        <td className="px-4 py-3 font-semibold text-[#1A1A2E]">
                                            <div>{project.name}</div>
                                            {project.projectKey && (
                                                <div className="text-xs text-[#9CA3AF] mt-0.5">{project.projectKey}</div>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold bg-[#EBF2FF] text-[#155DFC]">
                                                {project.type === 'AGILE' ? 'Agile' : 'Kanban'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-[#6B6F7B] hidden md:table-cell">{project.memberCount ?? '-'}</td>
                                        <td className="px-4 py-3 text-[#6B6F7B] hidden md:table-cell">
                                            {project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await api.post(`/api/projects/${project.id}/favorite`);
                                                            window.dispatchEvent(new CustomEvent('planora:favorite-toggled'));
                                                            void fetchProjects();
                                                        } catch (error) {
                                                            console.error('Failed to toggle favorite:', error);
                                                        }
                                                    }}
                                                    className={`p-2 rounded-md border transition-colors ${project.isFavorite ? 'text-[#F59E0B] border-[#FDE68A] bg-[#FFFBEB]' : 'text-[#9CA3AF] border-[#E8E8ED] hover:text-[#F59E0B]'}`}
                                                    aria-label={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                                                >
                                                    <svg width="15" height="15" viewBox="0 0 24 24" fill={project.isFavorite ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                                                    </svg>
                                                </button>
                                                <Link
                                                    href={`/summary/${project.id}`}
                                                    className="px-3 py-1.5 rounded-lg bg-[#155DFC] text-white text-xs font-semibold hover:bg-[#0E4FCC] transition-colors"
                                                >
                                                    Open
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-[#EBF2FF] flex items-center justify-center mb-4 text-3xl">
                        📋
                    </div>
                    <h3 className="text-base font-semibold text-[#1A1A2E]">No projects found</h3>
                    <p className="text-[#6B6F7B] text-sm mt-1 max-w-xs">
                        {searchQuery ? 'Try a different search term' : 'Create your first project to get started.'}
                    </p>
                    {!searchQuery && (
                        <Link
                            href="/createProject"
                            className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                            style={{ background: '#155DFC' }}
                        >
                            Create Project
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}

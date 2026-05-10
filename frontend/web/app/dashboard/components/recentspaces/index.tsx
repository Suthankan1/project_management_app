'use client';

import { useState } from 'react';
import Link from 'next/link';
import RecentSpacesCarousel from './RecentSpacesCarousel';
import type { ProjectSummary } from './types';

// Props for the entire recent spaces section
interface RecentSpacesSectionProps {
  projects: { recent: ProjectSummary[]; favorites: ProjectSummary[] };
  loading: boolean;
}

export default function RecentSpacesSection({ projects, loading }: RecentSpacesSectionProps) {
  const [recentSpacesSearch, setRecentSpacesSearch] = useState(''); // Search box text
  const [recentFilter, setRecentFilter] = useState<'recent' | 'favorites'>('recent'); // Tab selection (Recent vs Favorites)

  // Choose data based on active filter
  const sourceProjects = recentFilter === 'recent' ? projects.recent : projects.favorites;

  // Ensure no duplicate projects if they appear in both lists
  const uniqueSource = Array.from(new Map(sourceProjects.map((p) => [p.id, p])).values());

  // Filter projects by search text (checks name and project key)
  const filteredRecentProjects = uniqueSource.filter((project) =>
    project.name.toLowerCase().includes(recentSpacesSearch.toLowerCase()) ||
    (project.projectKey && project.projectKey.toLowerCase().includes(recentSpacesSearch.toLowerCase()))
  );

  return (
    <div className="flex flex-col gap-4 pb-[0.8px] bg-white relative mt-1">
      {/* Section Header: Contains Title, Search, and Tab Filters */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 w-full mt-1">
        {/* Title and View All (Mobile only) */}
        <div className="flex justify-between items-center w-full md:w-auto px-1 h-5">
          <h2 className="font-outfit text-[15px] font-bold text-[#101828] m-0 flex items-center h-full">
            Recent spaces
          </h2>
          <Link
            href="/spaces"
            className="md:hidden font-outfit text-[13px] font-bold text-[#0052CC] hover:text-[#0042a3] m-0 flex items-center h-full leading-none"
          >
            View all
          </Link>
        </div>

        {/* Controls Area: Search Input and Tab Toggles */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Search Box */}
            <div className="relative w-full sm:w-[220px]">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={recentSpacesSearch}
                onChange={(e) => setRecentSpacesSearch(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 border border-[#E5E7EB] rounded-[6px] leading-5 bg-white placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-[13px] font-outfit"
              />
            </div>

            {/* Recent / Favourites Tab Switcher */}
            <div className="flex items-center bg-gray-100/50 p-1 rounded-lg sm:bg-transparent sm:p-0 gap-1 w-full sm:w-auto mt-1 sm:mt-0">
              <button
                onClick={() => setRecentFilter('recent')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-[6px] font-outfit text-[11px] font-bold uppercase tracking-wider transition-all ${
                  recentFilter === 'recent'
                    ? 'bg-white text-[#0052CC] shadow-sm border border-gray-200/60'
                    : 'text-[#4B5563] hover:text-[#0052CC]'
                }`}
              >
                Recent
              </button>
              <button
                onClick={() => setRecentFilter('favorites')}
                className={`flex-1 sm:flex-none px-3 py-1.5 rounded-[6px] font-outfit text-[11px] font-bold uppercase tracking-wider transition-all ${
                  recentFilter === 'favorites'
                    ? 'bg-white text-[#0052CC] shadow-sm border border-gray-200/60'
                    : 'text-[#4B5563] hover:text-[#0052CC]'
                }`}
              >
                Favourites
              </button>
            </div>
          </div>

          {/* View All (Desktop only) */}
          <Link
            href="/spaces"
            className="hidden md:block font-outfit text-[13px] font-bold text-[#0052CC] hover:text-[#0042a3] ml-2 shrink-0"
          >
            View all
          </Link>
        </div>
      </div>

      {/* Horizontal scrolling list of project cards */}
      <RecentSpacesCarousel
        projects={filteredRecentProjects}
        loading={loading}
        searchQuery={recentSpacesSearch}
      />
    </div>
  );
}



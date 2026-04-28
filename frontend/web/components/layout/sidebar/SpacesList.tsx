// Renders the list of favorite and recent projects within the Sidebar.
import React from 'react';
import { NavRow } from '@/components/layout/sidebar/SidebarRows';
import { ClockIcon, StarIcon } from '@/components/layout/sidebar/SidebarIcons';

interface SpacesListProps {
  collapsed: boolean;
  favOpen: boolean;
  recentOpen: boolean;
  loading: boolean;
  favoriteCount: number;
  recentCount: number;
  favRef: React.RefObject<HTMLDivElement | null>;
  recentRef: React.RefObject<HTMLDivElement | null>;
  onOpenFav: () => void;
  onOpenRecent: () => void;
  isMobile?: boolean;
}

export default function SpacesList({
  collapsed,
  favOpen,
  recentOpen,
  loading,
  favoriteCount: _favoriteCount,
  recentCount: _recentCount,
  favRef,
  recentRef,
  onOpenFav,
  onOpenRecent,
  isMobile = false,
}: SpacesListProps) {
  return (
    <>
      <div ref={favRef} className="relative">
        <NavRow
          icon={<StarIcon className="text-amber-400" />}
          label="Favourites"
          collapsed={collapsed}
          active={favOpen}
          hasChevron={!isMobile}
          chevronOpen={favOpen}
          onClick={onOpenFav}
        />
      </div>

      <div ref={recentRef} className="relative">
        <NavRow
          icon={<ClockIcon />}
          label="Recent Spaces"
          collapsed={collapsed}
          active={recentOpen}
          hasChevron={!isMobile}
          chevronOpen={recentOpen}
          onClick={onOpenRecent}
        />
      </div>

      {loading && !collapsed && (
        <p className="px-2.5 py-1 text-[11px] text-cu-text-muted">Loading projects...</p>
      )}
    </>
  );
}

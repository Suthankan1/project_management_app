'use client';

import { useDashboardProjects } from './hooks/useDashboardProjects';
import { useDashboardProfile } from './hooks/useDashboardProfile';
import DashboardHeader from './components/DashboardHeader';
import RecentSpacesSection from './components/recentspaces';
import TabsSection from './components/table/TabsSection';

export default function DashboardPage() {
  const { user, projects, loading } = useDashboardProjects();
  const { resolvedProfilePicUrl } = useDashboardProfile(user);

  return (
    <div className="flex flex-col gap-4 w-full h-full max-w-[1200px] mx-auto pb-6 mt-0 px-4 sm:px-6 relative">
      {/* ── Header: greeting + notification bell + avatar ── */}
      <DashboardHeader user={user} resolvedProfilePicUrl={resolvedProfilePicUrl} />

      {/* ── Recent Spaces: search, filter, carousel ── */}
      <RecentSpacesSection projects={projects} loading={loading} />

      {/* ── Table: tabs (desktop) + mobile sections ── */}
      <TabsSection />
    </div>
  );
}


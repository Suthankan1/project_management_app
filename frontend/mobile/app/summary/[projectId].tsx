import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import ProjectTopNav, {
  ProjectTab,
  MoreTab,
} from '../../src/components/navigation/ProjectTopNav';
import SummaryScreen  from '../../src/components/summary/SummaryScreen';
import ReportScreen   from '../../src/components/report/ReportScreen';
import ProjectBoardScreen from '../../src/components/board/ProjectBoardScreen';
import ProjectSprintBoardScreen from '../../src/components/board/ProjectSprintBoardScreen';
import { useProjectSummary } from '../../src/hooks/useProjectSummary';

/** Height of the nav bar = padding top (8) + title row (56) + tab row (48) + padding bottom (12) */
const NAV_INNER_HEIGHT = 124; // matches ProjectTopNav.tsx exactly

// ─── Placeholder screens (connect later) ──────────────────────────────────────
function PlaceholderScreen({ label }: { label: string }) {
  return (
    <View style={ph.wrap}>
      <Text style={ph.emoji}>🚧</Text>
      <Text style={ph.title}>{label}</Text>
      <Text style={ph.sub}>Coming soon — this page will be connected next.</Text>
    </View>
  );
}

const ph = StyleSheet.create({
  wrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  emoji: { fontSize: 40 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 },
  sub:   { fontSize: 13, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 40 },
});

// ─── Route ────────────────────────────────────────────────────────────────────
export default function ProjectRoute() {
  const { projectId, projectName } = useLocalSearchParams<{
    projectId: string;
    projectName?: string;
  }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();

  const [activeTab,     setActiveTab]     = useState<ProjectTab | MoreTab>('summary');
  const [lastMainTab,   setLastMainTab]   = useState<ProjectTab>('summary');
  const [activeMoreTab, setActiveMoreTab] = useState<MoreTab | undefined>();

  /** Total nav bar height so content scrolls below it */
  const navHeight = insets.top + NAV_INNER_HEIGHT;

  const handleTabChange = useCallback((tab: ProjectTab | MoreTab) => {
    setActiveTab(tab);
    // Clear more-tab when switching to a main tab
    if (tab !== 'more' && !['timeline', 'calendar', 'burndown', 'milestone', 'members', 'pages', 'docs', 'list', 'report'].includes(tab as string)) {
      setLastMainTab(tab as ProjectTab);
      setActiveMoreTab(undefined);
    }
  }, []);

  const handleMoreTabChange = useCallback((tab: MoreTab) => {
    setActiveMoreTab(tab);
    setActiveTab(tab); // Make the new dynamic tab visually active
  }, []);

  const numericId = Number(projectId);
  const paramName = Array.isArray(projectName) ? projectName[0] : projectName;

  const { data } = useProjectSummary(numericId);
  const name = paramName || data?.projectDetails?.name;

  // ── Content area ────────────────────────────────────────────────────────────
  const renderContent = () => {
    // If a "More" sub-tab is active, render it
    if (activeMoreTab) {
      if (activeMoreTab === 'report') {
        return (
          <ReportScreen
            projectId={numericId}
            projectName={name}
            topOffset={navHeight + 16}
          />
        );
      }
      const labels: Record<MoreTab, string> = {
        timeline:  'Timeline',
        calendar:  'Calendar',
        burndown:  'Burndown Chart',
        milestone: 'Milestones',
        members:   'Members',
        pages:     'Pages',
        docs:      'Docs',
        list:      'List',
        report:    'Report',
      };
      return (
        <View style={{ flex: 1, paddingTop: navHeight }}>
          <PlaceholderScreen label={labels[activeMoreTab]} />
        </View>
      );
    }

    // Keep rendering the background tab if the 'More' dropdown is open
    const tabToRender = activeTab === 'more' ? lastMainTab : activeTab;

    switch (tabToRender) {
      case 'summary':
        return (
          <SummaryScreen
            projectId={numericId}
            projectName={name}
            hideHeader
            topOffset={navHeight + 16} // Provide 16px of visual gap below the top nav
            onBack={() => router.back()}
          />
        );
      case 'backlog':
        return (
          <View style={{ flex: 1, paddingTop: navHeight }}>
            <PlaceholderScreen label="Backlog" />
          </View>
        );
      case 'board':
        return data?.isAgile ? (
          <ProjectSprintBoardScreen
            projectId={numericId}
            projectName={name}
            topOffset={navHeight + 16}
          />
        ) : (
          <ProjectBoardScreen
            projectId={numericId}
            projectName={name}
            topOffset={navHeight + 16}
          />
        );
      case 'chat':
        return (
          <View style={{ flex: 1, paddingTop: navHeight }}>
            <PlaceholderScreen label="Chat" />
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#F7F8FA' }}>
      <StatusBar style="dark" />

      {/* Content renders behind / below the nav */}
      {renderContent()}

      {/* Nav bar floats on top — absolutely positioned */}
      <ProjectTopNav
        activeTab={activeTab}
        activeMoreTab={activeMoreTab}
        onTabChange={handleTabChange}
        onMoreTabChange={handleMoreTabChange}
        projectName={name}
      />
    </View>
  );
}

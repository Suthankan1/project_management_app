'use client';

import React, { useMemo } from 'react';
import { Task, Sprint, ProjectMetrics, PageItem, MilestoneResponse } from '@/types';
import api from '@/lib/axios';
import useSWR from 'swr';

// Legacy layer for React-Grid-Layout v1 compatibility
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { WidthProvider, Responsive } = require('react-grid-layout/legacy') as typeof import('react-grid-layout/legacy');
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

// Component and Hook imports
import { BentoCard } from './BentoCard';
import { SummaryIcons as Icons } from './SummaryIcons';
import { buildDefaultLayouts, Layouts } from './layoutConfig';
import { useBentoLayout } from '../hooks/useBentoLayout';

// Widget imports
import { OverallProgressWidget, StatMetricWidget } from './MetricsGrid';
import { BurndownChartWidget, TaskDistributionWidget, VelocityChartWidget, LeadTimeChartWidget } from './DashboardCharts';
import { CurrentSprint } from './ProjectTimeline';
import { ProjectChatWidget } from './ProjectChatWidget';
import { ProjectNoteWidget } from './ProjectNoteWidget';
import { WorkloadDistribution } from './WorkloadDistribution';
import { GenerateReportCard } from './recent-activity/GenerateReportCard';
import { RecentlyCompletedTasksCard } from './recent-activity/RecentlyCompletedTasksCard';
import { RecentActivityFeedCard } from './recent-activity/RecentActivityFeedCard';
import { DueTasksFiveDaysCard } from './recent-activity/DueTasksFiveDaysCard';
import { UpcomingMilestonesCard } from './recent-activity/UpcomingMilestonesCard';
import { ProjectDocsCard } from './recent-activity/ProjectDocsCard';

const ResponsiveGridLayout = WidthProvider(Responsive);
const fetcher = (url: string) => api.get(url).then((r) => r.data);

/**
 * Main Dashboard component that renders the interactive Bento grid.
 */
export default function BentoDashboard({
  projectId, tasks, sprints, metrics, projectDetails, isAgile,
}: {
  projectId: number; tasks: Task[]; sprints: Sprint[]; metrics: ProjectMetrics;
  projectDetails: { description?: string } | null; isAgile: boolean;
}) {
  // Fetch secondary project data (milestones and documentation pages)
  const { data: pages = [], isLoading: pagesLoading } = useSWR<PageItem[]>(projectId ? `/api/projects/${projectId}/pages` : null, fetcher);
  const { data: milestones = [], isLoading: milestonesLoading } = useSWR<MilestoneResponse[]>(projectId ? `/api/projects/${projectId}/milestones` : null, fetcher);

  // Initialize the responsive layout using our custom hook
  const defaultLayouts = useMemo(() => buildDefaultLayouts(isAgile), [isAgile]);
  const { layouts, onLayoutChange, resetLayouts, isHydrated } = useBentoLayout(projectId, defaultLayouts);

  // Determine which widgets are active based on the project type
  const activeIds = useMemo(() => {
    const base = ['metric-progress', 'metric-total', 'metric-completed', 'metric-due', 'task-dist', 'activity-feed', 'report', 'recently-completed', 'due-tasks', 'milestones', 'docs', 'chat', 'notes'];
    if (isAgile) base.push('sprint', 'burndown', 'velocity', 'lead-time');
    return new Set(base);
  }, [isAgile]);

  // Filter out any widgets that shouldn't be visible in the current mode
  const filteredLayouts = useMemo<Layouts>(() => {
    const filtered: any = {};
    Object.entries(layouts || {}).forEach(([bp, items]) => {
      filtered[bp] = (items as any[]).filter(item => activeIds.has(item.i));
    });
    return filtered;
  }, [layouts, activeIds]);

  // Prevent hydration mismatch by waiting for client-side mounting
  if (!isHydrated) return null;

  return (
    <div className="w-full pt-4">
      {/* The core interactive grid system */}
      <ResponsiveGridLayout
        className="bento-grid"
        layouts={filteredLayouts}
        breakpoints={{ lg: 1200, md: 768, sm: 0 }}
        cols={{ lg: 24, md: 12, sm: 4 }}
        rowHeight={64}
        margin={[16, 16]}
        draggableHandle=".bento-drag-handle"
        draggableCancel=".bento-no-drag"
        onLayoutChange={onLayoutChange}
        compactType="vertical"
        useCSSTransforms
        resizeHandles={['se']}
      >
        {/* Metric widgets for high-level project status */}
        <div key="metric-progress">
          <BentoCard title="Overall Progress" icon={Icons.progress}>
            <OverallProgressWidget completedTasks={metrics?.completedTasks || 0} totalTasks={metrics?.totalTasks || 0} />
          </BentoCard>
        </div>

        <div key="metric-total">
          <BentoCard title="Total Tasks" icon={Icons.tasks}>
            <StatMetricWidget iconBg="bg-[#EAF2FF]" iconColor="#0052CC" icon={Icons.tasks} value={metrics?.totalTasks || 0} label="Total Tasks" />
          </BentoCard>
        </div>

        <div key="metric-completed">
          <BentoCard title="Completed Tasks" icon={Icons.completed}>
            <StatMetricWidget iconBg="bg-[#E3FCEF]" iconColor="#00875A" icon={Icons.completed} value={metrics?.completedTasks || 0} label="Completed Tasks" />
          </BentoCard>
        </div>

        <div key="metric-due">
          <BentoCard title="Due Issues" icon={Icons.due}>
            <StatMetricWidget iconBg="bg-[#FFF4ED]" iconColor="#DE350B" icon={Icons.due} value={metrics?.overdueTasks || 0} label="Due Issues" />
          </BentoCard>
        </div>

        {/* Agile specific charts and sprint tracking */}
        {isAgile && (
          <div key="sprint">
            <BentoCard title="Current Sprint" icon={Icons.sprint} noPadding bodyClassName="p-4 overflow-auto custom-scrollbar flex flex-col">
              <CurrentSprint projectId={projectId} sprints={sprints} tasks={tasks} />
            </BentoCard>
          </div>
        )}

        {isAgile && (
          <div key="burndown">
            <BentoCard title="Sprint Burndown" icon={Icons.burndown} noPadding bodyClassName="p-4 flex flex-col">
              <BurndownChartWidget tasks={tasks} sprints={sprints} />
            </BentoCard>
          </div>
        )}

        <div key="task-dist">
          <BentoCard title="Task Priority" icon={Icons.chart} noPadding bodyClassName="p-4 flex flex-col">
            <TaskDistributionWidget tasks={tasks} />
          </BentoCard>
        </div>

        {isAgile && (
          <div key="velocity">
            <BentoCard title="Velocity" icon={Icons.velocity} noPadding bodyClassName="p-4 flex flex-col">
              <VelocityChartWidget tasks={tasks} sprints={sprints} />
            </BentoCard>
          </div>
        )}

        {isAgile && (
          <div key="lead-time">
            <BentoCard title="Lead Time" icon={Icons.clock} noPadding bodyClassName="p-4 flex flex-col">
              <LeadTimeChartWidget tasks={tasks} />
            </BentoCard>
          </div>
        )}

        {/* Activity feeds and lists */}
        <div key="activity-feed">
          <BentoCard title="Recent Activity" icon={Icons.activity} noPadding bodyClassName="p-4 overflow-y-auto custom-scrollbar">
            <RecentActivityFeedCard tasks={tasks} />
          </BentoCard>
        </div>

        <div key="report" className="bento-drag-handle h-full w-full cursor-grab active:cursor-grabbing rounded-xl overflow-hidden shadow-sm ring-1 ring-black/[0.03] border border-[#E3E8EF] group">
          <GenerateReportCard projectId={projectId} isAgile={isAgile} />
        </div>

        <div key="recently-completed">
          <BentoCard title="Recently Completed" icon={Icons.trophy} noPadding bodyClassName="p-4 overflow-y-auto custom-scrollbar">
            <RecentlyCompletedTasksCard tasks={tasks} />
          </BentoCard>
        </div>

        <div key="due-tasks">
          <BentoCard title="Due in 5 Days" icon={Icons.clock} noPadding bodyClassName="p-4 overflow-y-auto custom-scrollbar">
            <DueTasksFiveDaysCard tasks={tasks} />
          </BentoCard>
        </div>

        <div key="milestones">
          <BentoCard title="Upcoming Milestones" icon={Icons.milestone} noPadding bodyClassName="p-4 overflow-y-auto custom-scrollbar">
            <UpcomingMilestonesCard projectId={projectId} milestones={milestones} milestonesLoading={milestonesLoading} />
          </BentoCard>
        </div>

        <div key="docs">
          <BentoCard title="Project Docs" icon={Icons.docs} noPadding bodyClassName="p-4 overflow-y-auto custom-scrollbar">
            <ProjectDocsCard projectId={projectId} pages={pages} pagesLoading={pagesLoading} />
          </BentoCard>
        </div>

        {/* Collaborative tools */}
        <div key="chat">
          <BentoCard title="Project Chat" icon={Icons.chat} noPadding>
            <ProjectChatWidget projectId={projectId} />
          </BentoCard>
        </div>

        <div key="notes">
          <BentoCard title="Project Notes" icon={Icons.notes} noPadding>
            <ProjectNoteWidget projectId={projectId} defaultNote={projectDetails?.description} />
          </BentoCard>
        </div>
      </ResponsiveGridLayout>

      {/* Standalone section for team workload */}
      <div className="mt-6">
        <WorkloadDistribution projectId={projectId} tasks={tasks} />
      </div>

      {/* Button to reset the dashboard layout to defaults */}
      <button
        onClick={resetLayouts}
        title="Reset layout to default"
        className="hidden md:flex fixed bottom-6 right-6 z-50 h-[44px] px-5 flex-row items-center justify-center gap-2 bg-[#101828] shadow-lg ring-1 ring-black/[0.1] border border-transparent rounded-full font-semibold text-[13px] text-white hover:bg-[#1D2939] hover:-translate-y-0.5 transition-all cursor-pointer hover:shadow-xl"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" />
        </svg>
        <span className="whitespace-nowrap">Reset Layout</span>
      </button>
    </div>
  );
}

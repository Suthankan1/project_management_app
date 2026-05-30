'use client'; // Entry point: Loads all project data for the report page

import { useParams } from 'next/navigation';
import useSWR, { useSWRConfig } from 'swr';
import api from '@/lib/axios';
import { Task, Sprint, ProjectMetrics, MilestoneResponse, TeamMemberInfo } from '@/types';
import { isAgileProjectType } from '@/components/shared/ProjectTypeIcon';
import dynamic from 'next/dynamic';
import EmptyState from '@/components/shared/EmptyState';
import { RefreshCw } from 'lucide-react';

const ReportPageContent = dynamic(
  () => import('../components/ReportPageContent'),
  { ssr: false }
);

const fetcher = (url: string) => api.get(url).then(r => r.data);

export default function ReportPage() {
  const params    = useParams();
  const projectId = Number(params.projectId);
  const { mutate } = useSWRConfig();

  const { data: tasks = [], error: tasksError } = useSWR<Task[]>(projectId ? `/api/tasks/project/${projectId}` : null, fetcher);
  const { data: sprints = [], error: sprintsError } = useSWR<Sprint[]>(projectId ? `/api/sprints/project/${projectId}` : null, fetcher);
  const { data: metrics, isLoading: mL, error: metricsError } = useSWR<ProjectMetrics>(projectId ? `/api/projects/${projectId}/metrics` : null, fetcher);
  const { data: project, isLoading: pL, error: projectError } = useSWR(projectId ? `/api/projects/${projectId}` : null, fetcher);
  const { data: milestones = [], error: milestonesError } = useSWR<MilestoneResponse[]>(projectId ? `/api/projects/${projectId}/milestones` : null, fetcher);
  const { data: members = [], error: membersError } = useSWR<TeamMemberInfo[]>(projectId ? `/api/projects/${projectId}/members` : null, fetcher);

  const hasError = Boolean(tasksError || sprintsError || metricsError || projectError || milestonesError || membersError);
  const refreshReport = () => {
    void Promise.all([
      mutate(projectId ? `/api/tasks/project/${projectId}` : null),
      mutate(projectId ? `/api/sprints/project/${projectId}` : null),
      mutate(projectId ? `/api/projects/${projectId}/metrics` : null),
      mutate(projectId ? `/api/projects/${projectId}` : null),
      mutate(projectId ? `/api/projects/${projectId}/milestones` : null),
      mutate(projectId ? `/api/projects/${projectId}/members` : null),
    ]);
  };

  if (hasError) {
    return (
      <div className="w-full min-h-[calc(100vh-130px)] flex items-center justify-center px-4">
        <EmptyState
          title="Unable to load report"
          subtitle="One or more report requests failed. Retry to re-run the report fetches."
          action={
            <button
              type="button"
              onClick={refreshReport}
              className="inline-flex items-center gap-2 rounded-xl bg-cu-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-cu-primary-hover transition-colors"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          }
        />
      </div>
    );
  }

  if (mL || pL || !metrics || !project) {
    return (
      <div className="w-full min-h-[calc(100vh-130px)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 animate-pulse" />
          <span className="text-sm text-slate-400 font-medium">Loading project data…</span>
        </div>
      </div>
    );
  }

  return (
    <ReportPageContent
      projectId={projectId}
      tasks={tasks}
      sprints={sprints}
      metrics={metrics}
      project={project}
      milestones={milestones}
      members={members}
      isAgile={isAgileProjectType(project?.type)}
    />
  );
}

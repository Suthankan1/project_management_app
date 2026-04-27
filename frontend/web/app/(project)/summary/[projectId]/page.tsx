'use client';

import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import { Task, Sprint, ProjectMetrics } from '@/types';
import useSWR from 'swr';
import { isAgileProjectType } from '@/components/shared/ProjectTypeIcon';
import SummaryPageSkeleton from "../components/SummarySkeleton";
import dynamic from 'next/dynamic';

// Dynamically load the heavy BentoDashboard component for better initial performance
const BentoDashboard = dynamic(() => import('../components/BentoDashboard'), {
    ssr: false,
    loading: () => <SummaryPageSkeleton />
});

const fetcher = (url: string) => api.get(url).then(res => res.data);

/**
 * Main Summary Page component for a specific project.
 * Handles primary data fetching and passes it down to the dashboard grid.
 */
export default function SummaryPage() {
    const params = useParams();
    const projectId = Number(params.projectId);

    // Fetch primary data points using SWR for caching and performance
    const { data: tasks, isLoading: tasksLoading } = useSWR<Task[]>(projectId ? `/api/tasks/project/${projectId}` : null, fetcher);
    const { data: sprints, isLoading: sprintsLoading } = useSWR<Sprint[]>(projectId ? `/api/sprints/project/${projectId}` : null, fetcher);
    const { data: metrics, isLoading: metricsLoading } = useSWR<ProjectMetrics>(projectId ? `/api/projects/${projectId}/metrics` : null, fetcher);
    const { data: projectDetails, isLoading: projectLoading } = useSWR<{ type?: string, description?: string }>(projectId ? `/api/projects/${projectId}` : null, fetcher);

    // Determine project style based on its type metadata
    const isAgileProject = isAgileProjectType(projectDetails?.type);

    // Show skeleton loader while critical initial data is being fetched
    if (tasksLoading || sprintsLoading || metricsLoading || projectLoading || !tasks || !sprints || !metrics || !projectDetails) {
        return <SummaryPageSkeleton />;
    }

    return (
        <div className="w-full max-w-[1400px] mx-auto px-4 sm:px-6 pb-6">
            <BentoDashboard 
                projectId={projectId}
                tasks={tasks}
                sprints={sprints}
                metrics={metrics}
                projectDetails={projectDetails}
                isAgile={isAgileProject}
            />
        </div>
    );
}

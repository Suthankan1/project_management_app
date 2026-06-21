'use client';

import useSWR from 'swr';
import { projectsApi } from '@/services/api-contract';

export interface ProjectAssigneeOption {
  id: number;
  name: string;
  photoUrl?: string | null;
}

interface TeamMemberPayload {
  id?: number;
  userId?: number;
  name?: string;
  username?: string;
  fullName?: string;
  profilePicUrl?: string | null;
  user?: {
    userId?: number;
    fullName?: string | null;
    username?: string | null;
    profilePicUrl?: string | null;
  };
}

const getNestedTeamId = (team: unknown): number | undefined => {
  if (!team || typeof team !== 'object' || !('id' in team)) return undefined;
  const id = (team as { id?: unknown }).id;
  return typeof id === 'number' ? id : undefined;
};

const getMemberArray = (payload: unknown): TeamMemberPayload[] => {
  if (Array.isArray(payload)) return payload as TeamMemberPayload[];
  if (!payload || typeof payload !== 'object') return [];
  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.members)) return record.members as TeamMemberPayload[];
  if (Array.isArray(record.data)) return record.data as TeamMemberPayload[];
  if (Array.isArray(record.content)) return record.content as TeamMemberPayload[];
  return [];
};

const normalizeMembers = (payload: unknown): ProjectAssigneeOption[] => (
  getMemberArray(payload)
    .map((member) => {
      const id = Number(member.user?.userId ?? member.userId ?? member.id);
      const name = member.name
        ?? member.fullName
        ?? member.username
        ?? member.user?.fullName
        ?? member.user?.username
        ?? '';

      return {
        id,
        name: name || `Member ${id}`,
        photoUrl: member.user?.profilePicUrl ?? member.profilePicUrl ?? null,
      };
    })
    .filter((member) => Number.isFinite(member.id) && member.id > 0)
);

async function fetchProjectAssignees(projectId: number): Promise<ProjectAssigneeOption[]> {
  const project = await projectsApi.get(projectId);
  const teamId = project.teamId ?? getNestedTeamId(project.team);
  if (!teamId) return [];

  const payload = await projectsApi.getTeamMembers(teamId);
  return normalizeMembers(payload);
}

export function useProjectAssigneeOptions(projectId?: number | null) {
  const { data, error, isLoading, isValidating, mutate } = useSWR(
    projectId ? ['project-assignees', projectId] : null,
    ([, id]) => fetchProjectAssignees(Number(id)),
    {
      dedupingInterval: 60_000,
      keepPreviousData: true,
      revalidateOnFocus: false,
    }
  );

  return {
    members: data ?? [],
    loadingMembers: isLoading,
    refreshingMembers: isValidating && !!data,
    membersError: error ? 'Unable to load project members. Assignee options may be unavailable.' : null,
    retryMembers: () => mutate(),
  };
}

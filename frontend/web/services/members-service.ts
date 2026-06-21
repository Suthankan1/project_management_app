import { projectsApi } from './api-contract';
import type { Member, PendingInvite } from './api-contract';

export type { Member, PendingInvite };

export async function fetchMembers(projectId: string): Promise<Member[]> {
  return projectsApi.getMembers(projectId);
}

export async function fetchPendingInvites(projectId: string): Promise<PendingInvite[]> {
  return projectsApi.getPendingInvites(projectId);
}

export async function changeRole(
  projectId: string,
  userId: number,
  role: string,
): Promise<void> {
  return projectsApi.changeMemberRole(projectId, userId, role);
}

export async function removeMember(
  projectId: string,
  userId: number,
): Promise<void> {
  return projectsApi.removeMember(projectId, userId);
}

export async function sendInvite(
  projectId: string,
  email: string,
  role: string,
): Promise<void> {
  return projectsApi.sendInvite(projectId, email, role);
}

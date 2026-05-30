import { milestonesApi } from './api-contract';
import type { MilestoneResponse, MilestoneRequest } from '@/types';

export async function getMilestones(projectId: number): Promise<MilestoneResponse[]> {
  return milestonesApi.listByProject(projectId);
}

export async function getMilestone(milestoneId: number): Promise<MilestoneResponse> {
  return milestonesApi.get(milestoneId);
}

export async function createMilestone(
  projectId: number,
  data: MilestoneRequest,
): Promise<MilestoneResponse> {
  return milestonesApi.create(projectId, data);
}

export async function updateMilestone(
  milestoneId: number,
  data: MilestoneRequest,
): Promise<MilestoneResponse> {
  return milestonesApi.update(milestoneId, data);
}

export async function deleteMilestone(milestoneId: number): Promise<void> {
  return milestonesApi.delete(milestoneId);
}

export async function assignTaskToMilestone(
  taskId: number,
  milestoneId: number | null,
): Promise<void> {
  return milestonesApi.assignTask(taskId, milestoneId);
}

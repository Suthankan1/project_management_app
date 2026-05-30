import { labelsApi } from './api-contract';
import type { Label } from '@/types';

export async function getProjectLabels(projectId: number): Promise<Label[]> {
  return labelsApi.listByProject(projectId);
}

export async function createLabel(
  projectId: number,
  name: string,
  color: string,
): Promise<Label> {
  return labelsApi.create({ projectId, name, color });
}

export async function updateLabel(
  id: number,
  name: string,
  color: string,
): Promise<Label> {
  return labelsApi.update(id, { name, color });
}

export async function deleteLabel(id: number): Promise<void> {
  return labelsApi.delete(id);
}

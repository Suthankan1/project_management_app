import type { operations } from '../../types';
import { formatLocalDate } from '../utils/date';

export type LoginRequest = Omit<operations['login']['requestBody']['content']['application/json'], 'username'> & { username?: string };
export type RegisterRequest = operations['register']['requestBody']['content']['application/json'];
export type ForgotPasswordRequest = operations['forgotPassword']['requestBody']['content']['application/json'];
export type ResetPasswordRequest = operations['resetPassword']['requestBody']['content']['application/json'];
export type UpdateProfileRequest = operations['updateProfile']['requestBody']['content']['application/json'];
export type IngestTelemetryRequest = operations['ingestTelemetry']['requestBody']['content']['application/json'];
export type CreateRoomRequest = operations['createRoom']['requestBody']['content']['application/json'];
export type CreateProjectRequest = operations['createProject']['requestBody']['content']['application/json'];
export type UpdateStatusRequest = operations['updateStatus']['requestBody']['content']['application/json'];
export type CreateMessageRequest = operations['createMessage']['requestBody']['content']['application/json'];

export interface PatchTaskDatesRequest {
  startDate?: string | null;
  dueDate?: string | null;
}

export interface Requester {
  post<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }>;
  put<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }>;
  patch<T = any>(url: string, data?: any, config?: any): Promise<{ data: T }>;
  delete<T = any>(url: string, config?: any): Promise<{ data: T }>;
}

export const updateProfile = (api: Requester, payload: UpdateProfileRequest) => {
  return api.put('/api/user/profile/update', payload);
};

export const login = (api: Requester, credentials: LoginRequest) => {
  return api.post('/api/auth/login', credentials);
};

export const register = (api: Requester, payload: RegisterRequest) => {
  return api.post('/api/auth/register', payload);
};

export const forgotPassword = (api: Requester, payload: ForgotPasswordRequest) => {
  return api.post('/api/auth/forgot', payload);
};

export const resetPassword = (api: Requester, payload: ResetPasswordRequest) => {
  return api.post('/api/auth/reset', payload);
};

export const postTelemetry = (api: Requester, projectId: number | string, payload: { action: string; target: string; details?: string }) => {
  const body: IngestTelemetryRequest = {
    eventName: payload.action,
    scope: payload.target,
    metadata: payload.details,
  };
  return api.post(`/api/projects/${projectId}/chat/telemetry`, body);
};

export const createRoom = (api: Requester, projectId: number | string, payload: CreateRoomRequest) => {
  return api.post(`/api/projects/${projectId}/chat/rooms`, payload);
};

export const createProject = (api: Requester, payload: CreateProjectRequest) => {
  return api.post('/api/projects', payload);
};

export const updateTaskStatus = (api: Requester, taskId: number | string, payload: UpdateStatusRequest) => {
  return api.patch(`/api/tasks/${taskId}/status`, payload);
};

export const updateTaskDates = (api: Requester, taskId: number | string, payload: PatchTaskDatesRequest) => {
  const body = {
    ...(payload.startDate !== undefined && { startDate: payload.startDate == null ? null : formatLocalDate(payload.startDate) }),
    ...(payload.dueDate !== undefined && { dueDate: payload.dueDate == null ? null : formatLocalDate(payload.dueDate) }),
  };
  return api.patch(`/api/tasks/${taskId}/dates`, body);
};

export const createChatMessage = (api: Requester, projectId: number | string, payload: CreateMessageRequest) => {
  return api.post(`/api/projects/${projectId}/chat/messages`, payload);
};

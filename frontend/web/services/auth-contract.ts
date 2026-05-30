import api from '@/lib/axios';

export interface AuthUserSummary {
  email?: string;
  username?: string;
}

export const authApi = {
  login: async (credentials: Record<string, unknown>): Promise<{ accessToken: string; refreshToken: string }> => {
    const { data } = await api.post('/api/auth/login', credentials);
    return data;
  },
  register: async (payload: Record<string, unknown>): Promise<void> => {
    await api.post('/api/auth/register', payload);
  },
  forgotPassword: async (payload: { email: string }): Promise<{ message?: string }> => {
    const { data } = await api.post('/api/auth/forgot', payload);
    return data;
  },
  resetPassword: async (payload: Record<string, unknown>): Promise<void> => {
    await api.post('/api/auth/reset', payload);
  },
  verifyEmail: async (payload: { email: string; otp: string }): Promise<void> => {
    await api.post('/api/auth/reg/verify', payload);
  },
  resendOtp: async (payload: { email: string }): Promise<{ message?: string }> => {
    const { data } = await api.post('/api/auth/resend', payload);
    return data;
  },
  getCurrentUser: async (): Promise<{ username: string; email?: string; fullName?: string }> => {
    const { data } = await api.get('/api/user/me');
    return data;
  },
  getAllUsers: async (): Promise<AuthUserSummary[]> => {
    const { data } = await api.get('/api/auth/users');
    return data;
  },
};

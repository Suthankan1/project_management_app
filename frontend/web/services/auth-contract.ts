import api from '@/lib/axios';

export interface AuthUserSummary {
  userId?: number;
  email?: string;
  username?: string;
  profilePicUrl?: string | null;
  fullName?: string;
}

export interface UserProfileDto {
  userId: number;
  username: string;
  fullName: string | null;
  email: string;
  verified: boolean;
  profilePicUrl: string | null;
  lastActive: string | null;
  firstName: string | null;
  lastName: string | null;
  contactNumber: string | null;
  countryCode: string | null;
  jobTitle: string | null;
  company: string | null;
  position: string | null;
  bio: string | null;
}

export interface PhotoUploadResponse {
  success: boolean;
  message: string;
  fileUrl: string | null;
  errorCode: string | null;
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
  getCurrentUser: async (): Promise<{ userId?: number; username: string; email?: string; fullName?: string; profilePicUrl?: string | null }> => {
    const { data } = await api.get('/api/user/me');
    return data;
  },
  getProfile: async (): Promise<UserProfileDto> => {
    const { data } = await api.get('/api/user/profile');
    return data;
  },
  updateProfile: async (payload: Partial<UserProfileDto>): Promise<UserProfileDto> => {
    const { data } = await api.put('/api/user/profile/update', payload);
    return data;
  },
  uploadProfilePhoto: async (formData: FormData): Promise<PhotoUploadResponse> => {
    const { data } = await api.post('/api/user/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  getAllUsers: async (): Promise<AuthUserSummary[]> => {
    const { data } = await api.get('/api/auth/users');
    return data;
  },
};

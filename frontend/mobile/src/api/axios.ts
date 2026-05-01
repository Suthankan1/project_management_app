import axios from 'axios';
import { getToken, clearTokens, saveToken, saveRefreshToken } from '../auth/storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const req = error.config;
    const isAuthEndpoint = req?.url?.includes('/api/auth/');
    if (error.response?.status === 401 && !isAuthEndpoint && !req._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          req.headers.Authorization = `Bearer ${token}`;
          return api(req);
        });
      }
      req._retry = true;
      isRefreshing = true;
      try {
        const { data } = await api.post('/api/auth/refresh');
        await saveToken(data.token);
        if (data.refreshToken) await saveRefreshToken(data.refreshToken);
        failedQueue.forEach(({ resolve }) => resolve(data.token));
        failedQueue = [];
        req.headers.Authorization = `Bearer ${data.token}`;
        return api(req);
      } catch {
        failedQueue.forEach(({ reject }) => reject(error));
        failedQueue = [];
        await clearTokens();
        return Promise.reject(error);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;

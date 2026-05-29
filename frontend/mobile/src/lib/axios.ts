import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { clearTokens, getRefreshToken, getValidToken, getUserFromToken, refreshAccessToken } from './auth';
import { router } from 'expo-router';

function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || '';

  if (!configuredUrl || Platform.OS === 'web') {
    return configuredUrl;
  }

  const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(configuredUrl);

  if (!isLocalhostUrl) {
    return configuredUrl;
  }

  try {
    const hostUri = Constants.expoConfig?.hostUri || Constants.manifest2?.extra?.expoGo?.debuggerHost || Constants.manifest?.debuggerHost;
    const devHost = typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;

    if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
      return configuredUrl.replace(/:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, `://${devHost}:8080`);
    }

    if (Platform.OS === 'android') {
      return configuredUrl.replace(/:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, `://10.0.2.2:8080`);
    }
  } catch {
    // Fallback to configuredUrl
  }

  return configuredUrl;
}

const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token (exclude auth endpoints)
api.interceptors.request.use(
  async (config) => {
    const authEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot', '/api/auth/reset', '/api/auth/reg/verify', '/api/auth/resend', '/api/auth/refresh'];
    const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
    
    if (!isAuthEndpoint) {
      const token = await getValidToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Proactively refresh the access token if it expires within 60 seconds
api.interceptors.request.use(async (config) => {
  const authEndpoints = ['/api/auth/login', '/api/auth/register', '/api/auth/forgot', '/api/auth/reset', '/api/auth/reg/verify', '/api/auth/resend', '/api/auth/refresh'];
  const isAuthEndpoint = authEndpoints.some(endpoint => config.url?.includes(endpoint));
  if (!isAuthEndpoint) {
    try {
      const token = await getValidToken();
      const refreshToken = await getRefreshToken();
      if (!token && refreshToken) {
        const newToken = await refreshAccessToken();
        config.headers['Authorization'] = `Bearer ${newToken}`;
        return config;
      }

      const user = await getUserFromToken();
      if (user?.exp && (user.exp - Date.now() / 1000) < 60) {
        const newToken = await refreshAccessToken();
        config.headers['Authorization'] = `Bearer ${newToken}`;
        return config;
      }
    } catch { /* token expired or invalid — let the 401 handler deal with it */ }
  }
  return config;
});

// Track whether a token refresh is in progress to avoid infinite loop
let isRefreshing = false;
let failedQueue: { resolve: (value: unknown) => void; reject: (reason?: unknown) => void }[] = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't attempt refresh on auth endpoints
    const authEndpoints = ['/api/auth/login', '/api/auth/forgot', '/api/auth/reset', '/api/auth/register', '/api/auth/reg/verify', '/api/auth/refresh'];
    const isAuthEndpoint = authEndpoints.some(endpoint => originalRequest?.url?.includes(endpoint));

    if (error.response?.status === 401 && !isAuthEndpoint && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for the in-progress refresh to complete, then retry
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        isRefreshing = false;
        await clearTokens();
        // 500ms delay lets toast notifications render before navigation
        setTimeout(() => { router.replace('/(auth)/login'); }, 500);
        return Promise.reject(error);
      }

      try {
        const newAccessToken = await refreshAccessToken();
        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        // 500ms delay lets toast notifications render before navigation
        setTimeout(() => { router.replace('/(auth)/login'); }, 500);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;

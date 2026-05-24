import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../api/baseUrl';

const TOKEN_KEY   = 'planora_access_token';
const REFRESH_KEY = 'planora_refresh_token';
const REMEMBER_KEY = 'planora_remember_me';

type JwtPayload = {
  exp?: number;
  [key: string]: unknown;
};

const store = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async delete(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export async function saveToken(token: string): Promise<void> {
  await store.set(TOKEN_KEY, token);
}

export async function saveRefreshToken(token: string): Promise<void> {
  await store.set(REFRESH_KEY, token);
}

export async function clearRefreshToken(): Promise<void> {
  await store.delete(REFRESH_KEY);
}

export async function setRememberMe(remember: boolean): Promise<void> {
  if (remember) {
    await store.set(REMEMBER_KEY, 'true');
    return;
  }
  await store.delete(REMEMBER_KEY);
}

export async function getRememberMe(): Promise<boolean> {
  return (await store.get(REMEMBER_KEY)) === 'true';
}

export async function getToken(): Promise<string | null> {
  return store.get(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return store.get(REFRESH_KEY);
}

export async function clearTokens(): Promise<void> {
  await store.delete(TOKEN_KEY);
  await store.delete(REFRESH_KEY);
  await store.delete(REMEMBER_KEY);
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split('.');
    if (!payload) return null;

    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const decoded = globalThis.atob(padded);
    const json = decodeURIComponent(
      decoded
        .split('')
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join('')
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isExpired(payload: JwtPayload): boolean {
  return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
}

export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await store.get(REFRESH_KEY);
  if (!refreshToken) return null;

  try {
    const refreshUrl = API_BASE_URL ? `${API_BASE_URL}/api/auth/refresh` : '/api/auth/refresh';
    const response = await fetch(refreshUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      await clearTokens();
      return null;
    }

    const data = await response.json();
    if (!data?.token || typeof data.token !== 'string') {
      await clearTokens();
      return null;
    }

    await saveToken(data.token);
    if (typeof data.refreshToken === 'string') {
      await saveRefreshToken(data.refreshToken);
    }

    return data.token;
  } catch {
    return null;
  }
}

export async function getValidToken(): Promise<string | null> {
  const token = await store.get(TOKEN_KEY);
  if (!token) {
    return refreshAccessToken();
  }

  const payload = decodeJwtPayload(token);
  if (!payload) {
    await clearTokens();
    return null;
  }

  if (isExpired(payload)) {
    return refreshAccessToken();
  }

  return token;
}

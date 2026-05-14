import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY   = 'planora_access_token';
const REFRESH_KEY = 'planora_refresh_token';

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

export async function getToken(): Promise<string | null> {
  return store.get(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return store.get(REFRESH_KEY);
}

export async function clearTokens(): Promise<void> {
  await store.delete(TOKEN_KEY);
  await store.delete(REFRESH_KEY);
}

export async function getValidToken(): Promise<string | null> {
  const token = await store.get(TOKEN_KEY);
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 <= Date.now()) {
      await clearTokens();
      return null;
    }
    return token;
  } catch {
    return null;
  }
}

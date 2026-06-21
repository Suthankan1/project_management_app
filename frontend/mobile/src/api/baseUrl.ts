import Constants from 'expo-constants';
import { Platform } from 'react-native';

const API_PORT = '8080';

function getExpoDevHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost;

  return typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;
}

export function resolveApiBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE_URL || process.env.EXPO_PUBLIC_API_URL || '';

  if (!configuredUrl || Platform.OS === 'web') {
    return configuredUrl;
  }

  const isLocalhostUrl = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(configuredUrl);

  if (!isLocalhostUrl) {
    return configuredUrl;
  }

  const devHost = getExpoDevHost();

  if (devHost && devHost !== 'localhost' && devHost !== '127.0.0.1') {
    return configuredUrl.replace(/:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, `://${devHost}:${API_PORT}`);
  }

  if (Platform.OS === 'android') {
    return configuredUrl.replace(/:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, `://10.0.2.2:${API_PORT}`);
  }

  return configuredUrl;
}

export function buildApiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = resolveApiBaseUrl();

  if (!baseUrl) {
    return normalizedPath;
  }

  const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');

  return `${normalizedBaseUrl}${normalizedPath}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

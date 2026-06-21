import { getApiBaseUrl } from '@/lib/api-base-url';

const ABSOLUTE_URL_RE = /^(https?:|data:|blob:)/i;

export function resolveProfilePhotoUrl(
  value?: string | null,
  userId?: number | string | null,
): string | null {
  if (value && ABSOLUTE_URL_RE.test(value)) {
    return value;
  }

  const baseUrl = getApiBaseUrl().replace(/\/$/, '');

  if (value?.startsWith('/')) {
    return `${baseUrl}${value}`;
  }

  if (userId != null && String(userId).trim()) {
    return `${baseUrl}/api/auth/users/${encodeURIComponent(String(userId))}/photo`;
  }

  return null;
}

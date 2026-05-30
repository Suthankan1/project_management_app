const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

export function resolveSummaryAvatarUrl(profilePicUrl?: string | null): string | null {
  const value = typeof profilePicUrl === 'string' ? profilePicUrl.trim() : '';

  if (!value) return null;

  if (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('data:') ||
    value.startsWith('blob:')
  ) {
    return value;
  }

  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const path = value.startsWith('/') ? value : `/${value}`;

  return `${baseUrl}${path}`;
}

export function getInitials(name?: string | null): string {
  const cleanName = typeof name === 'string' ? name.trim() : '';
  if (!cleanName) return 'U';

  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function profileLookupKey(value?: string | number | null): string {
  if (value === null || value === undefined) return '';
  return String(value).trim().toLowerCase();
}

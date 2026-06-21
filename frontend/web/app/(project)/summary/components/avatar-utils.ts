import { resolveProfilePhotoUrl } from '@/lib/profile-photo';

export function resolveSummaryAvatarUrl(profilePicUrl?: string | null): string | null {
  return resolveProfilePhotoUrl(profilePicUrl);
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

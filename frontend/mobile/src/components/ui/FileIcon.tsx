export function getFileIcon(contentType?: string): { emoji: string; color: string } {
  if (!contentType) return { emoji: '📄', color: '#64748B' };
  if (contentType.includes('pdf')) return { emoji: '📕', color: '#EF4444' };
  if (contentType.includes('word') || contentType.includes('document')) return { emoji: '📘', color: '#3B82F6' };
  if (contentType.includes('sheet') || contentType.includes('excel')) return { emoji: '📗', color: '#10B981' };
  if (contentType.includes('image')) return { emoji: '🖼️', color: '#8B5CF6' };
  if (contentType.includes('video')) return { emoji: '🎬', color: '#F59E0B' };
  if (contentType.includes('audio')) return { emoji: '🎵', color: '#EC4899' };
  if (contentType.includes('zip') || contentType.includes('archive')) return { emoji: '🗜️', color: '#6366F1' };
  if (contentType.includes('text')) return { emoji: '📝', color: '#155DFC' };
  return { emoji: '📄', color: '#64748B' };
}

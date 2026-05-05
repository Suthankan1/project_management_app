export const AVATAR_COLORS = [
  '#3B82F6','#10B981','#0EA5E9','#6366F1',
  '#14B8A6','#06B6D4','#60A5FA','#94A3B8',
];

export function avatarColor(name: string): string {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

export function formatTime(timestamp?: string | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return 'now';
  if (diff < 3600000) return `${Math.floor(diff/60000)}m`;
  if (diff < 86400000) return date.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'});
  return date.toLocaleDateString([],{month:'short',day:'numeric'});
}

export function formatDateSeparator(timestamp?: string | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate()-1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([],{weekday:'long',month:'long',day:'numeric'});
}

export function shouldShowDateSeparator(cur: {timestamp?:string|null}, prev?: {timestamp?:string|null}): boolean {
  if (!prev) return true;
  if (!cur.timestamp || !prev.timestamp) return true;
  return new Date(cur.timestamp).toDateString() !== new Date(prev.timestamp).toDateString();
}

export function isGrouped(cur: {sender:string;timestamp?:string|null}, prev?: {sender:string;timestamp?:string|null}): boolean {
  if (!prev || cur.sender !== prev.sender) return false;
  if (!cur.timestamp || !prev.timestamp) return false;
  return new Date(cur.timestamp).getTime() - new Date(prev.timestamp).getTime() < 120000;
}

export function getMessagePreview(content?: string|null): string {
  if (!content) return '';
  if (isFileDocument(content)) return '📎 File attachment';
  return content.length > 40 ? content.slice(0,40)+'…' : content;
}

export function isFileDocument(content: string): boolean {
  try {
    // Basic check for S3/Amz signed URLs which are common for file uploads in this app
    return (content.includes('s3') && content.includes('amazonaws.com'))
      || (content.includes('X-Amz-Signature') && content.includes('X-Amz-Credential'));
  } catch { return false; }
}

export const QUICK_REACTIONS = ['👍','❤️','🔥','✅','😂','🎉'];

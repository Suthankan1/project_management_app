export const STATUS_COLOR: Record<string, string> = {
  TODO:        'bg-cu-bg-tertiary text-cu-text-secondary',
  IN_PROGRESS: 'bg-cu-primary/10 text-cu-primary',
  IN_REVIEW:   'bg-amber-400/15 text-amber-500',
  DONE:        'bg-emerald-500/15 text-emerald-500',
};

export const PRIORITY_CONFIG: Record<string, { color: string; dot: string; bg: string; label: string }> = {
  URGENT: { color: '#DC2626', dot: 'bg-red-500',    bg: 'bg-red-500/10',    label: 'Urgent' },
  HIGH:   { color: '#EA580C', dot: 'bg-orange-500', bg: 'bg-orange-500/10', label: 'High'   },
  MEDIUM: { color: '#D97706', dot: 'bg-amber-400',  bg: 'bg-amber-400/10',  label: 'Medium' },
  LOW:    { color: '#22C55E', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10', label: 'Low' },
};

export const STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'] as const;
export const PRIORITY_OPTIONS = [
  { value: 'LOW',    label: 'Low'    },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH',   label: 'High'   },
  { value: 'URGENT', label: 'Urgent' },
] as const;
export const DAY_COLUMN_WIDTH = 36; // pixels per day in timeline

export const DEFAULT_COLUMN_COLORS: Record<string, string> = {
  TODO:        '#F3F4F6',
  IN_PROGRESS: '#EFF6FF',
  IN_REVIEW:   '#FEF3C7',
  DONE:        '#DCFCE7',
};

export const COLUMN_SWATCH_COLORS = [
  { label: 'Gray',   value: '#F3F4F6' },
  { label: 'Blue',   value: '#EFF6FF' },
  { label: 'Amber',  value: '#FEF3C7' },
  { label: 'Pink',   value: '#FDF2F8' },
  { label: 'Green',  value: '#DCFCE7' },
  { label: 'Purple', value: '#F3E8FF' },
];

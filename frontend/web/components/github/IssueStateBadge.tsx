'use client';

import { CheckCircle2, Circle } from 'lucide-react';

export type IssueState = 'open' | 'closed';

export function getIssueStateColor(state: IssueState): { text: string; bg: string; border: string; dot: string } {
  if (state === 'open') {
    return {
      text: 'text-green-700',
      bg: 'bg-green-50',
      border: 'border-green-200',
      dot: 'text-green-500',
    };
  }

  return {
    text: 'text-purple-700',
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    dot: 'text-purple-500',
  };
}

interface IssueStateBadgeProps {
  state: IssueState;
  size?: 'sm' | 'md';
  showIcon?: boolean;
}

const sizeClasses = {
  sm: 'text-[11px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
} as const;

export function IssueStateBadge({ state, size = 'sm', showIcon = true }: IssueStateBadgeProps) {
  const colors = getIssueStateColor(state);
  const iconSize = size === 'sm' ? 11 : 12;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-outfit font-semibold ${sizeClasses[size]} ${colors.text} ${colors.bg} ${colors.border}`}
    >
      {showIcon && (
        <span className="inline-flex items-center justify-center shrink-0">
          {state === 'open' ? (
            <Circle size={iconSize} className={colors.dot} fill="currentColor" strokeWidth={2} />
          ) : (
            <CheckCircle2 size={iconSize} className={colors.dot} strokeWidth={2} />
          )}
        </span>
      )}
      {state === 'open' ? 'Open' : 'Closed'}
    </span>
  );
}

export default IssueStateBadge;
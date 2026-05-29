import React from 'react';

interface BentoCardProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  noPadding?: boolean;
  headerAction?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

/**
 * A reusable card component for the Bento grid.
 * Features a drag handle header and a customizable body.
 */
export function BentoCard({
  title,
  icon,
  children,
  noPadding = false,
  headerAction,
  className = '',
  bodyClassName = '',
}: BentoCardProps) {
  return (
    <div
      className={`h-full w-full flex flex-col bg-cu-bg rounded-xl border border-cu-border shadow-cu-sm ring-1 ring-cu-border-light/60 overflow-hidden transition-shadow duration-200 hover:shadow-cu-md group ${className}`}
    >
      {/* Drag handle header - used by react-grid-layout */}
      <div className="bento-drag-handle flex items-center justify-between px-4 py-3 border-b border-cu-border bg-cu-bg-secondary/70 shrink-0 cursor-grab active:cursor-grabbing select-none">
        <div className="flex items-center gap-2 min-w-0">
          {icon && <span className="shrink-0 flex items-center text-cu-primary">{icon}</span>}
          <h3 className="font-arimo text-[14px] font-semibold text-cu-text-primary truncate">{title}</h3>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          {headerAction && (
            <div className="bento-no-drag" onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}
          
          {/* Drag grip indicator (visible on hover) */}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-cu-text-muted"
          >
            <path d="M9 3h2v2H9zM13 3h2v2h-2zM9 7h2v2H9zM13 7h2v2h-2zM9 11h2v2H9zM13 11h2v2h-2z" />
          </svg>
        </div>
      </div>

      {/* Card Body - Content goes here */}
      <div
        className={`bento-no-drag flex-1 min-h-0 ${noPadding ? '' : 'p-4'} overflow-auto custom-scrollbar ${bodyClassName}`}
      >
        {children}
      </div>
    </div>
  );
}

'use client';

import type { ReactNode } from 'react';

interface EmptyStateProps {
    /** Lucide icon or any SVG/element */
    icon?: ReactNode;
    title: string;
    subtitle?: string;
    action?: ReactNode;
    /** Extra className on the root wrapper */
    className?: string;
}

export default function EmptyState({
    icon,
    title,
    subtitle,
    action,
    className = '',
}: EmptyStateProps) {
    return (
        <div
            className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}
        >
            {icon && (
                <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-cu-bg-tertiary text-cu-text-muted">
                    {icon}
                </div>
            )}
            <p className="text-[15px] font-semibold text-cu-text-primary mb-1">{title}</p>
            {subtitle && (
                <p className="text-[13px] text-cu-text-secondary max-w-[280px] leading-relaxed">
                    {subtitle}
                </p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}

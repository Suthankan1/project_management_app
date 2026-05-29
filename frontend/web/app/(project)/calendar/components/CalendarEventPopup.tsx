'use client';

import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import type { CalendarEventItem } from '../types';

interface CalendarEventPopupProps {
    event: CalendarEventItem;
    position: { x: number; y: number };
    onClose: () => void;
}

const STATUS_COLORS: Record<string, string> = {
    TODO:        'bg-cu-bg-tertiary text-cu-text-secondary',
    IN_PROGRESS: 'bg-cu-primary/10 text-cu-primary',
    IN_REVIEW:   'bg-amber-400/15 text-amber-500',
    DONE:        'bg-emerald-500/15 text-emerald-500',
    Planned:     'bg-cu-bg-tertiary text-cu-text-secondary',
    Active:      'bg-cu-primary/10 text-cu-primary',
    Completed:   'bg-emerald-500/15 text-emerald-500',
};

function formatDate(d?: string) {
    if (!d) return null;
    try {
        return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
        return d;
    }
}

export default function CalendarEventPopup({ event, position, onClose }: CalendarEventPopupProps) {
    const ref = useRef<HTMLDivElement>(null);

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) onClose();
        };
        // Small delay so the same click that opened the popup doesn't immediately close it
        const id = setTimeout(() => document.addEventListener('mousedown', handler), 50);
        return () => { clearTimeout(id); document.removeEventListener('mousedown', handler); };
    }, [onClose]);

    // Clamp popup to viewport
    const POPUP_W = 288;
    const POPUP_H = 240;
    const left = typeof window !== 'undefined'
        ? Math.min(position.x, window.innerWidth - POPUP_W - 8)
        : position.x;
    const top = typeof window !== 'undefined'
        ? Math.min(position.y + 8, window.innerHeight - POPUP_H - 8)
        : position.y + 8;

    return (
        <div
            ref={ref}
            style={{ position: 'fixed', left, top, zIndex: 200, width: POPUP_W }}
            className="bg-cu-bg rounded-xl border border-cu-border shadow-xl overflow-hidden"
        >
            {/* Header */}
            <div className={`px-4 py-3 flex items-start justify-between gap-2 ${event.kind === 'sprint' ? 'bg-cu-primary/10' : 'bg-cu-bg-secondary'}`}>
                <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-cu-text-primary truncate">{event.title}</p>
                    <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${event.kind === 'sprint' ? 'bg-cu-primary/20 text-cu-primary' : 'bg-cu-bg-tertiary text-cu-text-secondary'}`}>
                        {event.kind === 'sprint' ? 'Sprint' : (event.type ?? 'Task')}
                    </span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1 text-cu-text-muted hover:text-cu-text-primary rounded transition-colors shrink-0 mt-0.5"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Body */}
            <div className="px-4 py-3 space-y-2">
                {event.status && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-cu-text-muted w-16 shrink-0">Status</span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[event.status] ?? 'bg-cu-bg-tertiary text-cu-text-secondary'}`}>
                            {event.status.replace(/_/g, ' ')}
                        </span>
                    </div>
                )}
                {event.assignee && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-cu-text-muted w-16 shrink-0">Assignee</span>
                        <span className="text-[11px] text-cu-text-primary">{event.assignee}</span>
                    </div>
                )}
                {(event.startDate || event.dueDate) && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-cu-text-muted w-16 shrink-0">
                            {event.kind === 'sprint' ? 'Start' : 'Due'}
                        </span>
                        <span className="text-[11px] text-cu-text-primary">{formatDate(event.startDate || event.dueDate)}</span>
                    </div>
                )}
                {event.endDate && event.kind === 'sprint' && (
                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-cu-text-muted w-16 shrink-0">End</span>
                        <span className="text-[11px] text-cu-text-primary">{formatDate(event.endDate)}</span>
                    </div>
                )}
                {event.description && (
                    <p className="text-[12px] text-cu-text-secondary line-clamp-3 pt-2 border-t border-cu-border mt-1">
                        {event.description}
                    </p>
                )}
            </div>
        </div>
    );
}

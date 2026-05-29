'use client';
import React from 'react';

interface KbdKeyProps {
  children: React.ReactNode;
  className?: string;
}

const KbdKey: React.FC<KbdKeyProps> = ({ children, className = '' }) => (
  <kbd
    className={`inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 py-0.5 text-xs font-medium bg-cu-bg-secondary text-cu-text-secondary border border-cu-border rounded shadow-cu-sm font-mono ${className}`}
  >
    {children}
  </kbd>
);

export default KbdKey;

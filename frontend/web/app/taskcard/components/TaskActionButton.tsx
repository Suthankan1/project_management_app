'use client';
import React from 'react';

interface TaskActionButtonProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

const TaskActionButton: React.FC<TaskActionButtonProps> = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[38px] min-w-[44px] bg-cu-bg border border-cu-border hover:bg-cu-primary/5 hover:border-cu-primary/40 rounded-xl text-[12px] font-semibold text-cu-text-primary hover:text-cu-primary transition-all shadow-cu-sm"
  >
    {icon} {label}
  </button>
);

export default TaskActionButton;

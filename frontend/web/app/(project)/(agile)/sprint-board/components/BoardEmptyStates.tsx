'use client';

import { AlertCircle, CheckCircle2, Loader } from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface BoardEmptyStatesProps {
  type: 'missing-project' | 'loading-agile' | 'not-agile' | 'loading' | 'error' | 'no-sprint';
  error?: string | null;
  onRetry?: () => void;
  onGoToBacklog?: () => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export default function BoardEmptyStates({ type, error, onRetry, onGoToBacklog }: BoardEmptyStatesProps) {
  if (type === 'missing-project') {
    return (
      <div className="flex h-screen bg-cu-bg-secondary items-center justify-center">
        <div className="text-center p-8 bg-cu-bg rounded-2xl shadow-cu-xl border border-cu-border max-w-sm">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-cu-text-primary">Missing Project</h2>
          <p className="text-cu-text-secondary text-sm mt-2">Please select a project to view its sprint board.</p>
        </div>
      </div>
    );
  }

  if (type === 'loading-agile') {
    return <div className="flex-1 flex items-center justify-center bg-cu-bg-secondary"><Loader className="w-8 h-8 text-cu-primary animate-spin" /></div>;
  }

  if (type === 'not-agile') {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-cu-bg-secondary h-full">
        <div className="text-center p-10 bg-cu-bg rounded-3xl shadow-cu-sm border border-cu-border max-w-lg">
          <div className="w-16 h-16 bg-cu-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"><AlertCircle className="w-8 h-8 text-cu-primary" /></div>
          <h2 className="text-2xl font-bold text-cu-text-primary">Kanban Projects don&apos;t have Sprints</h2>
          <p className="text-cu-text-secondary mt-3">The Sprint Board is exclusive to <span className="font-bold text-cu-primary">Agile</span> projects.</p>
        </div>
      </div>
    );
  }

  if (type === 'loading') {
    return <div className="flex-1 flex items-center justify-center bg-cu-bg-secondary"><Loader className="w-8 h-8 text-cu-primary animate-spin" /></div>;
  }

  if (type === 'error') {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-cu-text-primary">Sprint Board not ready</h2>
          <p className="text-cu-text-secondary text-sm mt-2 mb-6">{error}</p>
          <button onClick={onRetry} className="px-4 py-2 bg-cu-bg border border-cu-border rounded-xl text-sm font-semibold text-cu-text-primary hover:bg-cu-hover shadow-cu-sm">Try Again</button>
        </div>
      </div>
    );
  }

  // no-sprint
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <div className="text-center max-w-sm">
        <div className="w-20 h-20 bg-cu-bg-tertiary rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-10 h-10 text-cu-text-muted" /></div>
        <h2 className="text-xl font-bold text-cu-text-primary">No active sprint</h2>
        <p className="text-cu-text-secondary text-sm mt-2">
          <button onClick={onGoToBacklog} className="text-cu-primary font-semibold hover:underline">Start a sprint</button> in the backlog.
        </p>
      </div>
    </div>
  );
}

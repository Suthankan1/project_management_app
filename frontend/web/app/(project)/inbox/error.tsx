'use client';

import { useEffect } from 'react';

export default function InboxError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Inbox route error:', error);
  }, [error]);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-6 md:py-8">
      <div className="bg-cu-bg border border-cu-danger/25 rounded-2xl p-6 text-center shadow-cu-sm">
        <h2 className="text-[16px] font-bold text-cu-danger">Unable to load inbox</h2>
        <p className="text-[13px] text-cu-text-secondary mt-1">Something went wrong while loading chat activity.</p>
        <button
          onClick={reset}
          className="mt-4 px-3 py-2 rounded-lg border border-cu-danger/20 bg-cu-danger/10 text-cu-danger text-[12px] font-semibold hover:bg-cu-danger/15"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

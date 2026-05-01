'use client';

import React, { useRef, useState, useEffect } from 'react';

/**
 * A wrapper component that ensures the chart only renders when its container has a valid size.
 * Prevents Recharts rendering errors in dynamic layouts like Bento grids.
 */
export function SafeChartFrame({ children, minHeight = '220px' }: { children: React.ReactNode, minHeight?: string }) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    const evaluateSize = () => {
      const rect = element.getBoundingClientRect();
      setReady(rect.width > 0 && rect.height > 0);
    };

    evaluateSize();
    const observer = new ResizeObserver(evaluateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={hostRef} className="h-full w-full" style={{ minHeight }}>
      {ready ? children : null}
    </div>
  );
}

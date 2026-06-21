'use client';

import React, { useRef, useState, useEffect } from 'react';

type ChartSize = {
  width: number;
  height: number;
};

type SafeChartFrameProps = {
  children: React.ReactNode | ((size: ChartSize) => React.ReactNode);
};

/**
 * A wrapper component that ensures the chart only renders when its container has a valid size.
 * Prevents Recharts rendering errors in dynamic layouts like Bento grids.
 */
export function SafeChartFrame({ children }: SafeChartFrameProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const [size, setSize] = useState<ChartSize | null>(null);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    const evaluateSize = () => {
      const rect = element.getBoundingClientRect();
      const nextWidth = Math.floor(rect.width);
      const nextHeight = Math.floor(rect.height);

      if (nextWidth <= 1 || nextHeight <= 1) {
        setSize(null);
        return;
      }

      setSize((current) => {
        if (current?.width === nextWidth && current?.height === nextHeight) {
          return current;
        }
        return { width: nextWidth, height: nextHeight };
      });
    };

    const scheduleSizeCheck = () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = requestAnimationFrame(evaluateSize);
    };

    scheduleSizeCheck();
    const observer = new ResizeObserver(scheduleSizeCheck);
    observer.observe(element);
    return () => {
      observer.disconnect();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return (
    <div ref={hostRef} className="h-full min-h-[220px] w-full">
      {size ? (typeof children === 'function' ? children(size) : children) : null}
    </div>
  );
}

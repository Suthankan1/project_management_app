'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface TouchDragGhost {
  x: number;
  y: number;
  width: number;
}

interface DragTask {
  id: number;
  title: string;
  priority?: string;
}

// Long-press anywhere on a task row to start dragging; ghost follows finger;
// drops at exact position where finger lifts.
export function useTouchDragSort({
  tasks,
  containerRef,
  onDrop,
}: {
  tasks: DragTask[];
  containerRef: React.RefObject<HTMLElement | null>;
  onDrop: (draggedId: number, targetIndex: number) => void;
}) {
  const [activeDragId, setActiveDragId] = useState<number | null>(null);
  const [touchDropIndex, setTouchDropIndex] = useState<number | null>(null);
  const [ghost, setGhost] = useState<TouchDragGhost | null>(null);

  // Refs so closures inside useEffect always see current values
  const activeDragIdRef = useRef<number | null>(null);
  const ghostYOffsetRef = useRef(0);
  // Row centers captured at drag-start so layout shifts (drop indicator) don't skew calculation
  const rowCentersRef = useRef<number[]>([]);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const onDropRef = useRef(onDrop);
  onDropRef.current = onDrop;

  // Per-element long-press tracking
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingIdRef = useRef<number | null>(null);
  const pendingRectRef = useRef<DOMRect | null>(null);
  const pendingStartRef = useRef({ x: 0, y: 0 });
  const movedRef = useRef(false);

  function calcDropIndex(touchY: number): number {
    const centers = rowCentersRef.current;
    for (let i = 0; i < centers.length; i++) {
      if (touchY < centers[i]) return i;
    }
    return centers.length;
  }

  // Document-level listeners active only while a drag is in progress
  useEffect(() => {
    if (activeDragId === null) return;

    function onMove(e: TouchEvent) {
      const y = e.touches[0].clientY;
      setGhost(prev => prev ? { ...prev, y: y - ghostYOffsetRef.current } : null);
      setTouchDropIndex(calcDropIndex(y));
    }

    function onEnd(e: TouchEvent) {
      if (activeDragIdRef.current === null) return;
      const y = e.changedTouches[0].clientY;
      const targetIdx = calcDropIndex(y);
      const draggedId = activeDragIdRef.current;
      const currentIdx = tasksRef.current.findIndex(t => t.id === draggedId);

      activeDragIdRef.current = null;
      setActiveDragId(null);
      setTouchDropIndex(null);
      setGhost(null);

      // Skip if dropped in the same logical position
      if (targetIdx !== currentIdx && targetIdx !== currentIdx + 1) {
        onDropRef.current(draggedId, targetIdx);
      }
    }

    document.addEventListener('touchmove', onMove, { passive: true });
    document.addEventListener('touchend', onEnd);
    return () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
  }, [activeDragId]);

  // Returns touch event props to spread on each task wrapper div
  function getTouchProps(taskId: number) {
    return {
      onTouchStart(e: React.TouchEvent) {
        const touch = e.touches[0];
        pendingIdRef.current = taskId;
        pendingRectRef.current = (e.currentTarget as HTMLElement).getBoundingClientRect();
        pendingStartRef.current = { x: touch.clientX, y: touch.clientY };
        movedRef.current = false;

        if (longPressRef.current) clearTimeout(longPressRef.current);
        longPressRef.current = setTimeout(() => {
          if (movedRef.current) return; // finger moved — user is scrolling, not pressing
          const rect = pendingRectRef.current!;
          ghostYOffsetRef.current = pendingStartRef.current.y - rect.top;

          // Snapshot row positions before drop-indicator alters layout
          if (containerRef.current) {
            const rows = Array.from(
              containerRef.current.querySelectorAll('[data-task-row]')
            ) as HTMLElement[];
            rowCentersRef.current = rows.map(el => {
              const r = el.getBoundingClientRect();
              return r.top + r.height / 2;
            });
          }

          activeDragIdRef.current = pendingIdRef.current;
          setGhost({
            x: rect.left,
            y: pendingStartRef.current.y - ghostYOffsetRef.current,
            width: rect.width,
          });
          setTouchDropIndex(tasksRef.current.findIndex(t => t.id === pendingIdRef.current));
          setActiveDragId(pendingIdRef.current);
        }, 300);
      },

      onTouchMove(e: React.TouchEvent) {
        // If drag already started, document listener handles movement
        if (activeDragIdRef.current !== null) return;
        const dx = Math.abs(e.touches[0].clientX - pendingStartRef.current.x);
        const dy = Math.abs(e.touches[0].clientY - pendingStartRef.current.y);
        if (dx > 8 || dy > 8) {
          movedRef.current = true;
          if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
        }
      },

      onTouchEnd() {
        if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
      },
    };
  }

  const draggingTask = activeDragId !== null
    ? (tasks.find(t => t.id === activeDragId) ?? null)
    : null;

  return { activeDragId, touchDropIndex, ghost, draggingTask, getTouchProps };
}

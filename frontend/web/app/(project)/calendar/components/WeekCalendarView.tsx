import { useState } from 'react';
import CalendarEventCard from './CalendarEventCard';
import type { CalendarEventItem } from '../types';
import { DAY_NAMES, addDays, isDateInRange, isSameDay, startOfWeek, toDate } from '../utils/date';

interface WeekCalendarViewProps {
  currentDate: Date;
  events: CalendarEventItem[];
  onDayClick?: (date: Date) => void;
  onEventDrop?: (eventId: string, newDate: Date) => void;
}

const eventsForDay = (events: CalendarEventItem[], day: Date) =>
  events.filter((event) => {
    const start = toDate(event.startDate || event.dueDate || event.endDate);
    const end = toDate(event.endDate || event.startDate || event.dueDate);

    if (start && end && !isSameDay(start, end)) {
      return isDateInRange(day, start.toISOString(), end.toISOString());
    }

    return start ? isSameDay(start, day) : false;
  });

export default function WeekCalendarView({ currentDate, events, onDayClick, onEventDrop }: WeekCalendarViewProps) {
  const start = startOfWeek(currentDate);
  const weekDays = Array.from({ length: 7 }, (_, idx) => addDays(start, idx));

  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetDate, setDropTargetDate] = useState<string | null>(null);

  const dateKey = (d: Date) => d.toISOString().slice(0, 10);

  return (
    <div className="rounded-xl border border-cu-primary/15 bg-cu-bg shadow-cu-sm overflow-hidden">
      <div className="grid grid-cols-7 border-b border-cu-primary/15 bg-gradient-to-r from-cu-primary/10 via-cyan-500/10 to-emerald-500/10">
        {weekDays.map((day, idx) => (
          <div key={day.toISOString()} className="px-3 py-2">
            <div className="text-xs uppercase tracking-wide text-cu-text-muted">{DAY_NAMES[idx]}</div>
            <div className="text-sm font-semibold text-cu-text-primary">{day.getDate()}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {weekDays.map((day) => {
          const dayEvents = eventsForDay(events, day);
          const key = dateKey(day);
          const isDropTarget = dropTargetDate === key;

          return (
            <div
              key={day.toISOString()}
              className={`min-h-[340px] border-r border-cu-border p-2 align-top transition-colors ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-violet-500/5' : 'bg-cu-bg'}${onDayClick ? ' cursor-pointer hover:bg-cu-primary/10' : ''}${isDropTarget ? ' bg-cu-primary/10' : ''}`}
              onClick={() => onDayClick?.(day)}
              onDragOver={(e) => { if (draggedId) { e.preventDefault(); setDropTargetDate(key); } }}
              onDragLeave={() => setDropTargetDate(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedId && onEventDrop) {
                  onEventDrop(draggedId, day);
                }
                setDraggedId(null);
                setDropTargetDate(null);
              }}
            >
              <div className="space-y-1.5">
                {dayEvents.map((event) => {
                const eventStart = toDate(event.startDate || event.dueDate || event.endDate);
                const eventEnd = toDate(event.endDate || event.startDate || event.dueDate);

                return (
                  <CalendarEventCard
                    key={`${event.id}-${day.toDateString()}`}
                    event={event}
                    compact={false}
                    isRangeSegmentStart={!eventStart || isSameDay(day, eventStart)}
                    isRangeSegmentEnd={!eventEnd || isSameDay(day, eventEnd)}
                    onDragStart={(id) => setDraggedId(id)}
                    isDragging={draggedId === event.id}
                  />
                );
              })}
                {dayEvents.length === 0 && (
                  <div className="rounded-md border border-dashed border-cu-border px-2 py-3 text-center text-xs text-cu-text-muted">
                    No items
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { MOOD_CONFIG } from '@/lib/utils';
import type { JournalEntry } from '@/lib/db';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';

interface MoodHeatmapProps {
  entries: JournalEntry[];
  month?: Date;
}

export default function MoodHeatmap({ entries, month = new Date() }: MoodHeatmapProps) {
  const days = useMemo(() => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    return eachDayOfInterval({ start, end });
  }, [month]);

  const entryMap = useMemo(() => {
    const map = new Map<string, number[]>();
    entries.forEach(e => {
      const key = format(new Date(e.createdAt), 'yyyy-MM-dd');
      const existing = map.get(key) || [];
      existing.push(e.mood);
      map.set(key, existing);
    });
    
    const avgMap = new Map<string, number>();
    map.forEach((moods, key) => {
      const avg = Math.round(moods.reduce((a, b) => a + b, 0) / moods.length);
      avgMap.set(key, avg);
    });
    return avgMap;
  }, [entries]);

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const firstDayOffset = (getDay(days[0]) + 6) % 7; // Monday-based

  return (
    <div>
      <h3 style={{
        fontSize: 14,
        fontWeight: 600,
        color: 'var(--neutral-600)',
        marginBottom: 16,
        textAlign: 'center',
      }}>
        {format(month, 'MMMM yyyy')}
      </h3>

      {/* Weekday headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
        marginBottom: 4,
      }}>
        {weekdays.map(d => (
          <div key={d} style={{
            textAlign: 'center',
            fontSize: 10,
            color: 'var(--neutral-400)',
            fontWeight: 500,
            padding: '4px 0',
          }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 4,
      }}>
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOffset }).map((_, i) => (
          <div key={`empty-${i}`} style={{ aspectRatio: '1' }} />
        ))}

        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const mood = entryMap.get(key);
          const isToday = format(new Date(), 'yyyy-MM-dd') === key;
          const moodColor = mood ? MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG]?.color : undefined;

          return (
            <div
              key={key}
              className="calendar-day"
              style={{
                aspectRatio: '1',
                background: moodColor ? `${moodColor}25` : 'transparent',
                border: isToday ? '2px solid var(--pink-300)' : '1px solid var(--neutral-100)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                color: mood ? moodColor : 'var(--neutral-400)',
                fontWeight: mood ? 600 : 400,
                position: 'relative',
              }}
              title={mood ? `${MOOD_CONFIG[mood as keyof typeof MOOD_CONFIG]?.label}` : undefined}
            >
              {format(day, 'd')}
              {mood && (
                <div style={{
                  position: 'absolute',
                  bottom: 2,
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: moodColor,
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: 16,
        marginTop: 16,
        flexWrap: 'wrap',
      }}>
        {([1, 2, 3, 4, 5] as const).map(mood => (
          <div key={mood} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{
              width: 10,
              height: 10,
              borderRadius: '50%',
              background: MOOD_CONFIG[mood].color,
            }} />
            <span style={{ fontSize: 10, color: 'var(--neutral-400)' }}>
              {MOOD_CONFIG[mood].label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

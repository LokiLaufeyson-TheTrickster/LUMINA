'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import type { JournalEntry } from '@/lib/db';
import AppShell from '@/components/AppShell';
import { MOOD_CONFIG } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isToday } from 'date-fns';

export default function CalendarPage() {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const entries = useLiveQuery(
    () => db.entries.orderBy('createdAt').reverse().toArray(),
    []
  );

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  const firstDayOffset = (getDay(days[0]) + 6) % 7;

  const entryMap = useMemo(() => {
    if (!entries) return new Map();
    const map = new Map<string, JournalEntry[]>();
    entries.forEach(e => {
      const key = format(new Date(e.createdAt), 'yyyy-MM-dd');
      const existing = map.get(key) || [];
      existing.push(e);
      map.set(key, existing);
    });
    return map;
  }, [entries]);

  const selectedDayEntries: JournalEntry[] = useMemo(() => {
    if (!selectedDate) return [] as JournalEntry[];
    const key = format(selectedDate, 'yyyy-MM-dd');
    return entryMap.get(key) || ([] as JournalEntry[]);
  }, [selectedDate, entryMap]);

  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <AppShell>
      <div className="page-enter">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CalendarIcon size={24} style={{ color: 'var(--pink-300)' }} />
            Calendar
          </h1>
          <p style={{ fontSize: 14, color: 'var(--neutral-400)', marginBottom: 28 }}>
            View your entries by date
          </p>
        </motion.div>

        <div className="glass-card-static" style={{ padding: 24, marginBottom: 24 }}>
          {/* Month navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <button className="btn-ghost" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}>
              <ChevronLeft size={20} />
            </button>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: 'var(--neutral-700)' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button className="btn-ghost" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}>
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {weekdays.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 12, color: 'var(--neutral-400)', fontWeight: 600, padding: '8px 0' }}>
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: firstDayOffset }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {days.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayEntries: JournalEntry[] = entryMap.get(key) || [];
              const haEntries = dayEntries.length > 0;
              const avgMood = haEntries
                ? Math.round(dayEntries.reduce((s, e) => s + e.mood, 0) / dayEntries.length)
                : 0;
              const moodColor = avgMood > 0 ? MOOD_CONFIG[avgMood as keyof typeof MOOD_CONFIG]?.color : undefined;
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const today = isToday(day);

              return (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedDate(day)}
                  style={{
                    aspectRatio: '1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    borderRadius: 'var(--radius-md)',
                    border: isSelected
                      ? '2px solid var(--pink-300)'
                      : today
                        ? '2px solid var(--lavender-300)'
                        : '1px solid transparent',
                    background: isSelected
                      ? 'var(--pink-100)'
                      : haEntries
                        ? `${moodColor}12`
                        : 'transparent',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: haEntries ? 600 : 400,
                    color: isSelected ? 'var(--pink-500)' : haEntries ? 'var(--neutral-700)' : 'var(--neutral-400)',
                    fontFamily: 'var(--font-body)',
                    position: 'relative',
                  }}
                >
                  <span>{format(day, 'd')}</span>
                  {haEntries && (
                    <div style={{
                      display: 'flex',
                      gap: 2,
                      position: 'absolute',
                      bottom: 4,
                    }}>
                      {dayEntries.slice(0, 3).map((e, i) => (
                        <div key={i} style={{
                          width: 4,
                          height: 4,
                          borderRadius: '50%',
                          background: MOOD_CONFIG[e.mood as keyof typeof MOOD_CONFIG]?.color || 'var(--neutral-300)',
                        }} />
                      ))}
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Selected day entries */}
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 12 }}>
              {format(selectedDate, 'EEEE, MMMM d')}
              <span style={{ color: 'var(--neutral-400)', fontWeight: 400, marginLeft: 8 }}>
                {selectedDayEntries.length} {selectedDayEntries.length === 1 ? 'entry' : 'entries'}
              </span>
            </h3>

            {selectedDayEntries.length === 0 ? (
              <div className="glass-card-static" style={{ padding: 32, textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: 'var(--neutral-400)' }}>No entries on this day.</p>
                <button
                  className="btn-primary"
                  onClick={() => router.push('/new')}
                  style={{ marginTop: 12, fontSize: 13, padding: '8px 20px' }}
                >
                  Write an entry
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {selectedDayEntries.map(entry => (
                  <motion.div
                    key={entry.id}
                    className="glass-card"
                    onClick={() => router.push(`/entry/${entry.id}`)}
                    whileHover={{ y: -2 }}
                    style={{ padding: 16, cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 18 }}>
                        {MOOD_CONFIG[entry.mood as keyof typeof MOOD_CONFIG]?.emoji}
                      </span>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--neutral-700)' }}>
                        {entry.title || 'Untitled'}
                      </h4>
                      <span style={{ fontSize: 11, color: 'var(--neutral-400)', marginLeft: 'auto' }}>
                        {format(new Date(entry.createdAt), 'h:mm a')}
                      </span>
                    </div>
                    <p style={{
                      fontSize: 13,
                      color: 'var(--neutral-500)',
                      fontFamily: 'var(--font-journal)',
                      lineHeight: 1.5,
                    }}>
                      {entry.content.slice(0, 120)}...
                    </p>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}

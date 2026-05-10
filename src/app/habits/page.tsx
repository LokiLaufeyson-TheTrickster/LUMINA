'use client';

import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import AppShell from '@/components/AppShell';
import { ListChecks, Droplets, Moon, Dumbbell, BookOpen, Brain, Plus, Check } from 'lucide-react';
import { format, isToday } from 'date-fns';

const HABIT_TYPES = [
  { type: 'sleep', label: 'Sleep', icon: Moon, unit: 'hrs', max: 12, color: 'var(--lavender-300)' },
  { type: 'water', label: 'Water', icon: Droplets, unit: 'glasses', max: 12, color: 'var(--sage-300)' },
  { type: 'workout', label: 'Workout', icon: Dumbbell, unit: 'min', max: 120, color: 'var(--pink-300)' },
  { type: 'reading', label: 'Reading', icon: BookOpen, unit: 'min', max: 120, color: 'var(--gold-300)' },
  { type: 'meditation', label: 'Meditation', icon: Brain, unit: 'min', max: 60, color: 'var(--lavender-400)' },
] as const;

export default function HabitsPage() {
  const [addingHabit, setAddingHabit] = useState<string | null>(null);
  const [habitValue, setHabitValue] = useState(0);

  const todayHabits = useLiveQuery(async () => {
    const all = await db.habits.orderBy('timestamp').reverse().toArray();
    return all.filter(h => isToday(new Date(h.timestamp)));
  }, []);

  const handleSaveHabit = async (type: string) => {
    if (habitValue <= 0) return;

    // Remove existing habit of same type for today
    const existing = todayHabits?.find(h => h.type === type);
    if (existing?.id) {
      await db.habits.delete(existing.id);
    }

    await db.habits.add({
      type: type as 'sleep' | 'water' | 'workout' | 'reading' | 'meditation' | 'custom',
      value: habitValue,
      timestamp: new Date(),
    });

    setAddingHabit(null);
    setHabitValue(0);
  };

  return (
    <AppShell>
      <div className="page-enter">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <ListChecks size={24} style={{ color: 'var(--pink-300)' }} />
            Self-Care Tracker
          </h1>
          <p style={{ fontSize: 14, color: 'var(--neutral-400)', marginBottom: 28 }}>
            Small steps, big changes
          </p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {HABIT_TYPES.map((habit, i) => {
            const Icon = habit.icon;
            const todayEntry = todayHabits?.find(h => h.type === habit.type);
            const isEditing = addingHabit === habit.type;
            const progress = todayEntry ? (todayEntry.value / habit.max) * 100 : 0;

            return (
              <motion.div
                key={habit.type}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card-static"
                style={{ padding: 20 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isEditing ? 16 : 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: '50%',
                      background: todayEntry ? `${habit.color}25` : 'var(--neutral-100)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.3s',
                    }}>
                      <Icon size={20} style={{ color: todayEntry ? habit.color : 'var(--neutral-400)' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--neutral-700)' }}>
                        {habit.label}
                      </h3>
                      {todayEntry ? (
                        <span style={{ fontSize: 12, color: habit.color, fontWeight: 500 }}>
                          {todayEntry.value} {habit.unit} today ✓
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--neutral-400)' }}>
                          Not tracked yet today
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isEditing) {
                        setAddingHabit(null);
                      } else {
                        setAddingHabit(habit.type);
                        setHabitValue(todayEntry?.value || 0);
                      }
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      border: todayEntry ? `2px solid ${habit.color}` : '2px solid var(--neutral-200)',
                      background: todayEntry ? `${habit.color}15` : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: todayEntry ? habit.color : 'var(--neutral-400)',
                    }}
                  >
                    {todayEntry ? <Check size={16} /> : <Plus size={16} />}
                  </button>
                </div>

                {/* Progress bar */}
                {todayEntry && !isEditing && (
                  <div style={{
                    marginTop: 12,
                    height: 4,
                    background: 'var(--neutral-100)',
                    borderRadius: 2,
                    overflow: 'hidden',
                  }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progress, 100)}%` }}
                      transition={{ delay: 0.3, duration: 0.6 }}
                      style={{
                        height: '100%',
                        background: habit.color,
                        borderRadius: 2,
                      }}
                    />
                  </div>
                )}

                {/* Edit slider */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: 'var(--neutral-500)' }}>
                        {habitValue} {habit.unit}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--neutral-400)' }}>
                        max: {habit.max}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max={habit.max}
                      value={habitValue}
                      onChange={e => setHabitValue(Number(e.target.value))}
                      style={{ width: '100%', marginBottom: 12 }}
                    />
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button className="btn-ghost" onClick={() => setAddingHabit(null)} style={{ fontSize: 13 }}>
                        Cancel
                      </button>
                      <button className="btn-primary" onClick={() => handleSaveHabit(habit.type)} style={{ fontSize: 13, padding: '8px 16px' }}>
                        Save
                      </button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

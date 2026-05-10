'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Calendar, MessageCircle, Sparkles } from 'lucide-react';
import { db } from '@/lib/db';
import type { Reminder } from '@/lib/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useRouter } from 'next/navigation';
import { runDailyNotificationCheck, requestNotificationPermission, markReminderSeen } from '@/lib/notifications';

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const reminders = useLiveQuery(
    () => db.reminders.where('seen').equals(0).reverse().sortBy('createdAt'),
    []
  );

  const unseenCount = reminders?.length || 0;

  useEffect(() => {
    requestNotificationPermission();
    runDailyNotificationCheck();
  }, []);

  const handleClick = (reminder: Reminder) => {
    if (reminder.id) markReminderSeen(reminder.id);
    if (reminder.entryId) {
      router.push(`/entry/${reminder.entryId}`);
    } else if (reminder.type === 'checkin') {
      router.push('/new');
    }
    setOpen(false);
  };

  const dismissAll = async () => {
    if (!reminders) return;
    for (const r of reminders) {
      if (r.id) await markReminderSeen(r.id);
    }
  };

  const ICON_MAP: Record<string, typeof Bell> = {
    checkin: MessageCircle,
    anniversary: Calendar,
    rewind: Sparkles,
  };

  return (
    <div style={{ position: 'relative' }}>
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 8,
          color: 'var(--neutral-500)',
        }}
      >
        <Bell size={20} />
        {unseenCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: 'var(--pink-400)',
              color: 'white',
              fontSize: 9,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unseenCount}
          </motion.div>
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                width: 320,
                maxHeight: 400,
                overflowY: 'auto',
                background: 'var(--cream-50)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                border: '1px solid var(--glass-border)',
                zIndex: 100,
              }}
            >
              {/* Header */}
              <div style={{ padding: '14px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--neutral-100)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--neutral-700)' }}>Notifications</h3>
                {unseenCount > 0 && (
                  <button onClick={dismissAll} style={{ fontSize: 11, color: 'var(--pink-400)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'Outfit', sans-serif" }}>
                    Mark all read
                  </button>
                )}
              </div>

              {/* Items */}
              {(!reminders || reminders.length === 0) ? (
                <div style={{ padding: 32, textAlign: 'center' }}>
                  <p style={{ fontSize: 24, marginBottom: 8 }}>🌙</p>
                  <p style={{ fontSize: 13, color: 'var(--neutral-400)' }}>All caught up!</p>
                </div>
              ) : (
                <div style={{ padding: 8 }}>
                  {reminders.map((r, i) => {
                    const Icon = ICON_MAP[r.type] || Bell;
                    return (
                      <motion.button
                        key={r.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleClick(r)}
                        style={{
                          width: '100%',
                          padding: '12px 12px',
                          borderRadius: 'var(--radius-md)',
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          textAlign: 'left',
                          display: 'flex',
                          gap: 10,
                          alignItems: 'flex-start',
                          transition: 'background 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--cream-100)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: r.type === 'anniversary' ? 'var(--gold-100)' : 'var(--pink-100)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <Icon size={14} style={{ color: r.type === 'anniversary' ? 'var(--gold-300)' : 'var(--pink-400)' }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--neutral-700)', marginBottom: 2 }}>{r.title}</p>
                          <p style={{ fontSize: 12, color: 'var(--neutral-400)', lineHeight: 1.4 }}>{r.body}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

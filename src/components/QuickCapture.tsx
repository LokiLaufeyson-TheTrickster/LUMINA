'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, PenLine, Mic, Camera, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function QuickCapture() {
  const [isOpen, setIsOpen] = useState(false);
  const [quickNote, setQuickNote] = useState('');
  const router = useRouter();
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleQuickSave = async () => {
    if (!quickNote.trim()) return;
    // Import db dynamically to avoid SSR issues
    const { db } = await import('@/lib/db');
    await db.entries.add({
      title: '',
      content: quickNote,
      mood: 3,
      energy: 3,
      anxiety: 2,
      customEmotions: [],
      tags: ['quick-note'],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    setQuickNote('');
    setIsOpen(false);
  };

  const actions = [
    { icon: PenLine, label: 'New Entry', action: () => { router.push('/new'); setIsOpen(false); } },
    { icon: Mic, label: 'Voice Note', action: () => { router.push('/new?mode=voice'); setIsOpen(false); } },
    { icon: Camera, label: 'Photo', action: () => { router.push('/new?mode=photo'); setIsOpen(false); } },
  ];

  return (
    <>
      {/* FAB Button */}
      <motion.button
        className="fab"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label="Quick capture"
      >
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isOpen ? <X size={24} /> : <Plus size={24} />}
        </motion.div>
      </motion.button>

      {/* Expanded Quick Capture */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'rgba(16, 14, 10, 0.3)',
                backdropFilter: 'blur(4px)',
                zIndex: 99,
              }}
              onClick={() => setIsOpen(false)}
            />

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: 'fixed',
                bottom: 160,
                right: 24,
                zIndex: 101,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                alignItems: 'flex-end',
              }}
            >
              {actions.map((action, i) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={action.action}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 16px',
                      background: 'var(--cream-50)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: 'var(--radius-full)',
                      cursor: 'pointer',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                      fontSize: 13,
                      fontWeight: 500,
                      color: 'var(--neutral-600)',
                      fontFamily: 'var(--font-body)',
                    }}
                  >
                    <span>{action.label}</span>
                    <Icon size={16} />
                  </motion.button>
                );
              })}
            </motion.div>

            {/* Quick Note Box */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              style={{
                position: 'fixed',
                bottom: 160,
                left: 24,
                right: 96,
                zIndex: 101,
                background: 'var(--cream-50)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
                padding: 16,
                border: '1px solid var(--glass-border)',
              }}
            >
              <textarea
                ref={inputRef}
                value={quickNote}
                onChange={e => setQuickNote(e.target.value)}
                placeholder="Capture a thought before it fades..."
                style={{
                  width: '100%',
                  minHeight: 80,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontFamily: 'var(--font-journal)',
                  fontSize: 16,
                  color: 'var(--neutral-700)',
                  lineHeight: 1.6,
                }}
              />
              {quickNote.trim() && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}
                >
                  <button className="btn-primary" onClick={handleQuickSave} style={{ padding: '8px 20px', fontSize: 13 }}>
                    Save Thought ✨
                  </button>
                </motion.div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

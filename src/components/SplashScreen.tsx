'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onFinish }: { onFinish: () => void }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 600);
    }, 2800);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'var(--background)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {/* Floating particles */}
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              initial={{
                opacity: 0,
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200,
                scale: 0,
              }}
              animate={{
                opacity: [0, 0.6, 0],
                scale: [0, 1, 0.5],
                y: [0, -100 - Math.random() * 200],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 1.5,
                repeat: 0,
              }}
              style={{
                position: 'absolute',
                width: 4 + Math.random() * 4,
                height: 4 + Math.random() * 4,
                borderRadius: '50%',
                background: ['#F4A0B5', '#C4B5E0', '#FFD580'][Math.floor(Math.random() * 3)],
              }}
            />
          ))}

          {/* Moon + Logo */}
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #F4A0B5, #C4B5E0)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 60px rgba(244, 160, 181, 0.4)',
              marginBottom: 24,
            }}
          >
            <span style={{ fontSize: 36 }}>🌙</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            style={{
              fontSize: 36,
              fontWeight: 300,
              letterSpacing: 8,
              background: 'linear-gradient(135deg, var(--pink-500), var(--lavender-500))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontFamily: "'Outfit', sans-serif",
              marginBottom: 8,
            }}
          >
            LUMINA
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0, duration: 0.6 }}
            style={{
              fontSize: 11,
              color: '#A09888',
              letterSpacing: 1.5,
              textAlign: 'center',
              maxWidth: 320,
              lineHeight: 1.6,
              fontFamily: "'Crimson Text', serif",
              fontStyle: 'italic',
            }}
          >
            Life Unfolding through Memory,
            <br />
            Introspection & Narrative Analysis
          </motion.p>

          {/* Loading dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            style={{
              display: 'flex',
              gap: 6,
              marginTop: 40,
            }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ y: [-3, 3, -3], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#C4B5E0',
                }}
              />
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

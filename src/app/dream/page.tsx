'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import { useRouter } from 'next/navigation';
import AmbientBackground from '@/components/AmbientBackground';
import { Moon, Save, ArrowLeft, Volume2, VolumeX } from 'lucide-react';

export default function DreamSpacePage() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (textRef.current) textRef.current.focus();
  }, []);

  // Rain ambience (using a simple oscillator for now)
  useEffect(() => {
    if (!audioEnabled) {
      audioRef.current?.pause();
      return;
    }

    // Create ambient noise using Web Audio API
    const audioCtx = new AudioContext();

    // Brown noise generator
    const bufferSize = 2 * audioCtx.sampleRate;
    const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoiseSource = audioCtx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    const gainNode = audioCtx.createGain();
    gainNode.gain.value = 0.08;

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 400;

    whiteNoiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    whiteNoiseSource.start();

    return () => {
      whiteNoiseSource.stop();
      audioCtx.close();
    };
  }, [audioEnabled]);

  const handleSave = async () => {
    if (!content.trim()) return;
    setSaving(true);

    await db.entries.add({
      title: title || 'Dream Space Entry',
      content,
      mood: 3,
      energy: 2,
      anxiety: 2,
      customEmotions: ['🌙'],
      tags: ['dream-space', 'late-night'],
      isDreamSpace: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.moods.add({
      score: 3,
      energy: 2,
      anxiety: 2,
      customEmotions: ['🌙'],
      timestamp: new Date(),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      router.push('/');
    }, 1500);
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="dream-space" data-theme="dream">
      <AmbientBackground dreamMode />

      {/* Ambient glow orbs */}
      <div className="dream-glow" style={{
        width: 400, height: 400,
        background: 'radial-gradient(circle, rgba(139,111,192,0.15) 0%, transparent 70%)',
        top: -100, right: -50,
      }} />
      <div className="dream-glow" style={{
        width: 300, height: 300,
        background: 'radial-gradient(circle, rgba(244,160,181,0.1) 0%, transparent 70%)',
        bottom: -50, left: -50,
      }} />

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          zIndex: 10,
        }}
      >
        <button
          onClick={() => router.push('/')}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'none', border: 'none', color: 'rgba(196,181,224,0.6)',
            cursor: 'pointer', fontSize: 14, fontFamily: 'var(--font-body)',
          }}
        >
          <ArrowLeft size={18} />
          Exit
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'rgba(196,181,224,0.4)' }}>
            {wordCount} words
          </span>
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: audioEnabled ? 'var(--lavender-300)' : 'rgba(196,181,224,0.3)',
              padding: 6,
            }}
            title={audioEnabled ? 'Mute rain ambience' : 'Play rain ambience'}
          >
            {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>
          <motion.button
            onClick={handleSave}
            disabled={saving || saved}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              background: 'linear-gradient(135deg, rgba(139,111,192,0.5), rgba(168,146,208,0.5))',
              border: '1px solid rgba(196,181,224,0.2)',
              color: '#DAD4F0',
              padding: '8px 20px',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'var(--font-body)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <Save size={14} />
            {saved ? 'Saved ✨' : saving ? 'Saving...' : 'Save'}
          </motion.button>
        </div>
      </motion.div>

      {/* Main writing area */}
      <div style={{
        maxWidth: 700,
        margin: '0 auto',
        padding: '100px 24px 60px',
        minHeight: '100vh',
        position: 'relative',
        zIndex: 1,
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ marginBottom: 40, textAlign: 'center' }}
        >
          <Moon size={32} style={{ color: 'var(--lavender-300)', marginBottom: 12, opacity: 0.7 }} />
          <h1 style={{
            fontSize: 24,
            fontWeight: 300,
            color: 'rgba(234,228,248,0.8)',
            letterSpacing: 4,
            marginBottom: 8,
          }}>
            DREAM SPACE
          </h1>
          <p style={{
            fontSize: 13,
            color: 'rgba(196,181,224,0.4)',
            fontStyle: 'italic',
            fontFamily: 'var(--font-journal)',
          }}>
            A safe place for your deepest thoughts
          </p>
        </motion.div>

        {/* Title input */}
        <motion.input
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="title (optional)"
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: 'rgba(234,228,248,0.6)',
            fontSize: 18,
            fontWeight: 300,
            letterSpacing: 2,
            marginBottom: 24,
            fontFamily: 'var(--font-body)',
          }}
        />

        {/* Content textarea */}
        <motion.textarea
          ref={textRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="let your thoughts flow into the night..."
          className="dream-input"
          style={{
            minHeight: '50vh',
          }}
        />
      </div>

      {/* Saved overlay */}
      {saved && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            background: 'rgba(13,11,20,0.8)',
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 15 }}
            style={{ textAlign: 'center' }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>🌙</div>
            <p style={{ fontSize: 18, color: 'var(--lavender-300)', fontWeight: 300, letterSpacing: 2 }}>
              Thought preserved
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

'use client';

import { motion } from 'framer-motion';
import type { EmotionScore } from '@/lib/db';

const EMOTION_COLORS: Record<string, string> = {
  joy: '#FFD580',
  sadness: '#9B8BB4',
  anger: '#E55050',
  fear: '#7B6B94',
  love: '#F4A0B5',
  hope: '#A8D4A0',
  anxiety: '#C4A0B5',
  nostalgia: '#D8C8EB',
  gratitude: '#FFE6AD',
  excitement: '#FFB347',
  loneliness: '#8B7DA8',
  peace: '#C8DCC0',
  pride: '#E8C8A0',
  shame: '#A48095',
  guilt: '#9A94B8',
  confusion: '#BAB4D8',
  determination: '#E88099',
  wonder: '#C4B5E0',
  grief: '#6A6488',
  contentment: '#A8D4A0',
};

const EMOTION_EMOJIS: Record<string, string> = {
  joy: '✨', sadness: '🌧️', anger: '🔥', fear: '😰', love: '💗',
  hope: '🌱', anxiety: '🌀', nostalgia: '🍂', gratitude: '🌸',
  excitement: '⚡', loneliness: '🌙', peace: '🕊️', pride: '👑',
  shame: '🫣', guilt: '💔', confusion: '🌫️', determination: '💪',
  wonder: '🦋', grief: '🥀', contentment: '☀️',
};

interface EmotionBadgeProps {
  scores: EmotionScore[];
  intensity?: number;
  compact?: boolean;
}

export default function EmotionBadge({ scores, intensity, compact = false }: EmotionBadgeProps) {
  if (!scores || scores.length === 0) return null;

  const sorted = [...scores].sort((a, b) => b.intensity - a.intensity);
  const isHigh = intensity ? intensity >= 7 : false;

  if (compact) {
    return (
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {sorted.slice(0, 3).map((s, i) => (
          <span
            key={i}
            title={`${s.emotion} (${s.intensity}/10)`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 2,
              padding: '2px 6px',
              borderRadius: 'var(--radius-full)',
              background: `${EMOTION_COLORS[s.emotion] || '#ccc'}20`,
              fontSize: 10,
              fontWeight: 500,
              color: EMOTION_COLORS[s.emotion] || '#888',
            }}
          >
            {EMOTION_EMOJIS[s.emotion] || '•'} {s.emotion}
          </span>
        ))}
        {isHigh && (
          <span style={{ fontSize: 10, color: 'var(--pink-400)', fontWeight: 600 }}>
            ⚡ MEMORY
          </span>
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Intensity bar */}
      {intensity !== undefined && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--neutral-500)' }}>
              Emotional Intensity
            </span>
            <span style={{
              fontSize: 12,
              fontWeight: 700,
              color: isHigh ? 'var(--pink-500)' : 'var(--neutral-500)',
            }}>
              {intensity.toFixed(1)}/10
              {isHigh && ' ✨ Memory'}
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--neutral-100)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(intensity / 10) * 100}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                height: '100%',
                borderRadius: 3,
                background: isHigh
                  ? 'linear-gradient(90deg, var(--pink-300), var(--lavender-400))'
                  : `linear-gradient(90deg, var(--neutral-300), ${EMOTION_COLORS[sorted[0]?.emotion] || 'var(--neutral-400)'})`,
              }}
            />
          </div>
        </div>
      )}

      {/* Emotion chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {sorted.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.05 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              background: `${EMOTION_COLORS[s.emotion] || '#ccc'}18`,
              border: `1px solid ${EMOTION_COLORS[s.emotion] || '#ccc'}30`,
            }}
          >
            <span style={{ fontSize: 12 }}>{EMOTION_EMOJIS[s.emotion] || '•'}</span>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: EMOTION_COLORS[s.emotion] || '#888',
            }}>
              {s.emotion}
            </span>
            <span style={{
              fontSize: 10,
              color: 'var(--neutral-400)',
              marginLeft: 2,
            }}>
              {s.intensity}/10
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export { EMOTION_COLORS, EMOTION_EMOJIS };

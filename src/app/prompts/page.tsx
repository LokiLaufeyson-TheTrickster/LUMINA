'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import type { Prompt } from '@/lib/db';
import AppShell from '@/components/AppShell';
import { useRouter } from 'next/navigation';
import { Sparkles, Heart, Shuffle, PenLine } from 'lucide-react';

const CATEGORY_CONFIG: Record<string, { label: string; emoji: string; color: string }> = {
  'healing': { label: 'Healing', emoji: '💜', color: 'var(--lavender-300)' },
  'relationships': { label: 'Relationships', emoji: '💗', color: 'var(--pink-300)' },
  'self-discovery': { label: 'Self Discovery', emoji: '🦋', color: 'var(--lavender-400)' },
  'creativity': { label: 'Creativity', emoji: '🎨', color: 'var(--gold-300)' },
  'shadow-work': { label: 'Shadow Work', emoji: '🌑', color: 'var(--neutral-500)' },
  'productivity': { label: 'Productivity', emoji: '🎯', color: 'var(--sage-300)' },
  'gratitude': { label: 'Gratitude', emoji: '🌸', color: 'var(--pink-400)' },
  'late-night': { label: 'Late Night', emoji: '🌙', color: 'var(--indigo-300)' },
  'future-self': { label: 'Future Self', emoji: '🕰️', color: 'var(--gold-300)' },
  'intimacy': { label: 'Intimacy', emoji: '❤️‍🔥', color: 'var(--rose-400)' }
};

import { callLLM } from '@/lib/ai';

export default function PromptsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);

  const prompts = useLiveQuery(
    () => db.prompts.toArray(),
    []
  );

  const filtered = prompts?.filter(p =>
    !selectedCategory || p.category === selectedCategory
  ) || [];

  const getRandomPrompt = () => {
    if (!prompts || prompts.length === 0) return;
    const random = prompts[Math.floor(Math.random() * prompts.length)];
    router.push(`/new?prompt=${encodeURIComponent(random.text)}`);
  };

  const handleAIGenerate = async () => {
    if (generatingAI) return;
    setGeneratingAI(true);
    try {
      const existingPromptsText = filtered.map(p => p.text).join('\\n');
      const categoryName = selectedCategory ? CATEGORY_CONFIG[selectedCategory]?.label : 'Deep Introspection';
      const messages: any[] = [
        {
          role: 'system',
          content: `You are an expert prompt crafter. The user wants a deeply introspective journal prompt about '${categoryName}'.
Do not repeat any of the following existing prompts:
${existingPromptsText}
Output ONLY the new prompt, nothing else. Make it thought-provoking and unique.`
        }
      ];
      const newPrompt = await callLLM(messages);
      if (newPrompt) {
        router.push(`/new?prompt=${encodeURIComponent(newPrompt.replace(/["']/g, ''))}`);
      }
    } catch (e) {
      console.error('AI generation failed', e);
      alert('AI Generation failed. Please check your API key in Settings.');
    } finally {
      setGeneratingAI(false);
    }
  };

  return (
    <AppShell>
      <div className="page-enter">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={24} style={{ color: 'var(--pink-300)' }} />
            Prompt Library
          </h1>
          <p style={{ fontSize: 14, color: 'var(--neutral-400)', marginBottom: 20 }}>
            Inspiration for your reflections
          </p>
        </motion.div>

        {/* Random / AI buttons */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="btn-primary"
            onClick={getRandomPrompt}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
            }}
          >
            <Shuffle size={18} />
            Surprise Me
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="btn-primary"
            onClick={handleAIGenerate}
            disabled={generatingAI}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            style={{
              flex: 1,
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 14,
              background: 'linear-gradient(135deg, var(--lavender-400), var(--pink-400))',
              border: 'none',
              color: 'white',
              opacity: generatingAI ? 0.7 : 1
            }}
          >
            <Sparkles size={18} />
            {generatingAI ? 'Crafting...' : 'AI Generate'}
          </motion.button>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={() => setSelectedCategory(null)}
            className={selectedCategory === null ? 'tag tag-pink' : 'tag'}
            style={{ cursor: 'pointer', border: 'none' }}
          >
            All
          </button>
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={selectedCategory === key ? 'tag tag-pink' : 'tag'}
              style={{ cursor: 'pointer', border: 'none' }}
            >
              {config.emoji} {config.label}
            </button>
          ))}
        </div>

        {/* Prompts Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map((prompt, i) => {
            const cat = CATEGORY_CONFIG[prompt.category] || { label: prompt.category, emoji: '✨', color: 'var(--neutral-400)' };
            return (
              <motion.div
                key={prompt.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="glass-card"
                style={{
                  padding: 20,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: 140,
                }}
                onClick={() => router.push(`/new?prompt=${encodeURIComponent(prompt.text)}`)}
              >
                <div>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    background: `${cat.color}15`,
                    borderRadius: 'var(--radius-full)',
                    fontSize: 10,
                    fontWeight: 500,
                    color: cat.color,
                    marginBottom: 10,
                  }}>
                    {cat.emoji} {cat.label}
                  </span>
                  <p style={{
                    fontSize: 14,
                    color: 'var(--neutral-600)',
                    fontFamily: 'var(--font-journal)',
                    lineHeight: 1.6,
                    fontStyle: 'italic',
                  }}>
                    &ldquo;{prompt.text}&rdquo;
                  </p>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                  <PenLine size={14} style={{ color: 'var(--neutral-300)' }} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}

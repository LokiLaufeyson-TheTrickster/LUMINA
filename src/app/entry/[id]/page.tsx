'use client';

import { use } from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import type { JournalEntry, MediaItem } from '@/lib/db';
import AppShell from '@/components/AppShell';
import { MOOD_CONFIG, ENERGY_LEVELS, ANXIETY_LEVELS, formatRelativeDate } from '@/lib/utils';
import { ArrowLeft, Edit, Trash2, MapPin, Tag, Calendar, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function EntryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [photos, setPhotos] = useState<MediaItem[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const entryData = await db.entries.get(Number(id));
      if (entryData) {
        setEntry(entryData);
        const media = await db.media.where('entryId').equals(entryData.id!).toArray();
        setPhotos(media.filter(m => m.type === 'photo'));
      }
    }
    load();
  }, [id]);

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = async () => {
    if (!entry?.id) return;
    setDeleting(true);
    await db.entries.delete(entry.id);
    await db.media.where('entryId').equals(entry.id).delete();
    await db.moods.where('entryId').equals(entry.id).delete();
    router.push('/');
  };

  if (!entry) {
    return (
      <AppShell>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="shimmer-bg" style={{ width: 200, height: 24, borderRadius: 'var(--radius-md)', margin: '0 auto' }} />
        </div>
      </AppShell>
    );
  }

  const moodConfig = MOOD_CONFIG[entry.mood as keyof typeof MOOD_CONFIG] || MOOD_CONFIG[3];

  return (
    <AppShell>
      <div className="page-enter">
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <button className="btn-ghost" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={18} /> Back
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn-ghost" onClick={handleDeleteClick} disabled={deleting} style={{ color: 'var(--pink-400)' }}>
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {/* Mood Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 20,
            padding: '12px 20px',
            background: `${moodConfig.color}15`,
            borderRadius: 'var(--radius-full)',
            width: 'fit-content',
          }}
        >
          <span style={{ fontSize: 28 }}>{moodConfig.emoji}</span>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: moodConfig.color }}>
              Feeling {moodConfig.label}
            </p>
            <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--neutral-400)', marginTop: 2 }}>
              <span>Energy: {ENERGY_LEVELS[entry.energy - 1]}</span>
              <span>Stress: {ANXIETY_LEVELS[entry.anxiety - 1]}</span>
            </div>
          </div>
        </motion.div>

        {/* Title */}
        <h1 style={{
          fontSize: 26,
          fontWeight: 700,
          color: 'var(--neutral-700)',
          marginBottom: 8,
          lineHeight: 1.3,
        }}>
          {entry.title || 'Untitled Entry'}
        </h1>

        {/* Meta */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--neutral-400)' }}>
            <Calendar size={12} />
            {format(new Date(entry.createdAt), 'EEEE, MMMM d, yyyy')}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--neutral-400)' }}>
            <Clock size={12} />
            {format(new Date(entry.createdAt), 'h:mm a')}
          </span>
          {entry.location && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--neutral-400)' }}>
              <MapPin size={12} />
              {entry.location}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="glass-card-static" style={{ padding: 28, marginBottom: 24 }}>
          <div style={{
            fontFamily: 'var(--font-journal)',
            fontSize: 18,
            lineHeight: 2,
            color: 'var(--neutral-700)',
            whiteSpace: 'pre-wrap',
          }}>
            {entry.content}
          </div>
        </div>

        {/* Photos */}
        {photos.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: 'var(--neutral-600)', marginBottom: 12 }}>Photos</h3>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {photos.map(photo => {
                const url = URL.createObjectURL(photo.blob);
                return (
                  <img
                    key={photo.id}
                    src={url}
                    alt="Entry photo"
                    onClick={() => setFullscreenImage(url)}
                    style={{
                      width: 200,
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--glass-shadow)',
                      cursor: 'zoom-in',
                    }}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Tags */}
        {entry.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Tag size={14} style={{ color: 'var(--neutral-400)' }} />
            {entry.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {/* Emotion Stickers */}
        {entry.customEmotions.length > 0 && (
          <div style={{ marginTop: 16, display: 'flex', gap: 6 }}>
            {entry.customEmotions.map((e, i) => (
              <span key={i} style={{ fontSize: 24 }}>{e}</span>
            ))}
          </div>
        )}
        {/* Custom Delete Confirm Modal */}
        {showConfirmDelete && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(4px)',
            padding: 24,
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                background: 'var(--background)',
                borderRadius: 'var(--radius-lg)',
                padding: 24,
                width: '100%',
                maxWidth: 400,
                boxShadow: 'var(--glass-shadow)',
              }}
            >
              <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--neutral-700)', marginBottom: 12 }}>
                Delete this entry?
              </h3>
              <p style={{ fontSize: 14, color: 'var(--neutral-500)', marginBottom: 24, lineHeight: 1.5 }}>
                Are you sure you want to delete this entry? This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button
                  className="btn-ghost"
                  onClick={() => setShowConfirmDelete(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  className="btn-primary"
                  onClick={handleConfirmDelete}
                  disabled={deleting}
                  style={{ background: 'var(--pink-500)', color: 'white', border: 'none' }}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
        <div style={{ height: 60 }} />

        {/* Fullscreen Image Overlay */}
        {fullscreenImage && (
          <div 
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(0,0,0,0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'zoom-out'
            }}
            onClick={() => setFullscreenImage(null)}
          >
            <img 
              src={fullscreenImage} 
              style={{ maxWidth: '95%', maxHeight: '95%', objectFit: 'contain', borderRadius: 'var(--radius-sm)' }} 
              alt="Fullscreen view" 
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

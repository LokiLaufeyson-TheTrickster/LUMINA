'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { motion } from 'framer-motion';
import { db } from '@/lib/db';
import AppShell from '@/components/AppShell';
import EntryCard from '@/components/EntryCard';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, X, Tag, Smile } from 'lucide-react';
import { MOOD_CONFIG } from '@/lib/utils';

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [moodFilter, setMoodFilter] = useState<number | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const entries = useLiveQuery(() => db.entries.orderBy('createdAt').reverse().toArray(), []);

  const results = entries?.filter(entry => {
    let matches = true;
    if (query) {
      const q = query.toLowerCase();
      matches = entry.title.toLowerCase().includes(q) || entry.content.toLowerCase().includes(q) || entry.tags.some(t => t.toLowerCase().includes(q));
    }
    if (moodFilter) matches = matches && entry.mood === moodFilter;
    if (tagFilter) matches = matches && entry.tags.includes(tagFilter);
    return matches;
  }) || [];

  const allTags = [...new Set(entries?.flatMap(e => e.tags) || [])];

  return (
    <AppShell>
      <div className="page-enter">
        <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--neutral-700)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <SearchIcon size={24} style={{ color: 'var(--pink-300)' }} /> Search Memories
        </h1>

        <div style={{ position: 'relative', marginBottom: 20 }}>
          <SearchIcon size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--neutral-400)' }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by emotion, keyword..." className="input" style={{ paddingLeft: 42 }} autoFocus />
          {query && <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--neutral-400)' }}><X size={16} /></button>}
        </div>

        <div className="glass-card-static" style={{ padding: 16, marginBottom: 20 }}>
          <div style={{ marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--neutral-500)' }}>Mood</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              <button onClick={() => setMoodFilter(null)} className={moodFilter === null ? 'tag tag-pink' : 'tag'} style={{ cursor: 'pointer', border: 'none' }}>Any</button>
              {([1,2,3,4,5] as const).map(m => <button key={m} onClick={() => setMoodFilter(m)} className={moodFilter === m ? 'tag tag-pink' : 'tag'} style={{ cursor: 'pointer', border: 'none' }}>{MOOD_CONFIG[m].emoji} {MOOD_CONFIG[m].label}</button>)}
            </div>
          </div>
          {allTags.length > 0 && <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--neutral-500)' }}>Tags</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              <button onClick={() => setTagFilter(null)} className={tagFilter === null ? 'tag tag-pink' : 'tag'} style={{ cursor: 'pointer', border: 'none' }}>Any</button>
              {allTags.slice(0,15).map(t => <button key={t} onClick={() => setTagFilter(t)} className={tagFilter === t ? 'tag tag-pink' : 'tag'} style={{ cursor: 'pointer', border: 'none' }}>{t}</button>)}
            </div>
          </div>}
        </div>

        <span style={{ fontSize: 13, color: 'var(--neutral-400)', display: 'block', marginBottom: 12 }}>{results.length} results{query && ` for "${query}"`}</span>

        {results.length === 0 ? (
          <div className="glass-card-static" style={{ padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 13, color: 'var(--neutral-400)' }}>No entries match your search.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {results.map((entry, i) => <EntryCard key={entry.id} entry={entry} index={i} onClick={() => router.push(`/entry/${entry.id}`)} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

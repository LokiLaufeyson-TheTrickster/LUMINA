import Dexie, { type Table } from 'dexie';

// ── Types ──────────────────────────────────────────────────────

export interface EmotionScore {
  emotion: string;       // e.g. "joy", "sadness", "anger", "hope", "anxiety", "love"
  intensity: number;     // 1-10 scale
}

export interface JournalEntry {
  id?: number;
  title: string;
  content: string;
  mood: number;           // 1-5 scale
  energy: number;         // 1-5 scale
  anxiety: number;        // 1-5 scale
  customEmotions: string[];
  tags: string[];
  location?: string;
  isDreamSpace?: boolean;
  isLocked?: boolean;
  isVoiceEntry?: boolean;
  // ── Emotion Scoring ──
  emotionScores?: EmotionScore[];    // AI-scored emotions
  overallIntensity?: number;          // 1-10, computed from emotion scores
  isHighIntensity?: boolean;          // true if intensity >= 7 (becomes a Memory)
  aiSummary?: string;                 // AI-generated one-line summary
  // ── Dates ──
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaItem {
  id?: number;
  entryId: number;
  type: 'photo' | 'audio' | 'video';
  blob: Blob;
  caption?: string;
  transcript?: string;
  duration?: number;     // audio/video duration in seconds
  createdAt: Date;
}

export interface MoodRecord {
  id?: number;
  score: number;
  energy: number;
  anxiety: number;
  customEmotions: string[];
  timestamp: Date;
  entryId?: number;
}

export interface Prompt {
  id?: number;
  category: 'healing' | 'relationships' | 'self-discovery' | 'creativity' | 'shadow-work' | 'goals' | 'gratitude';
  text: string;
  isFavorite?: boolean;
}

export interface Habit {
  id?: number;
  type: 'sleep' | 'water' | 'workout' | 'reading' | 'meditation' | 'custom';
  label?: string;
  value: number;
  unit?: string;
  timestamp: Date;
}

export interface GratitudeEntry {
  id?: number;
  text: string;
  promptText?: string;
  createdAt: Date;
}

export interface AIMemory {
  id?: number;
  entryId: number;
  summary: string;
  emotionalTone: string;
  themes: string[];
  embedding?: number[];
  createdAt: Date;
}

export interface AppSettings {
  id?: number;
  key: string;
  value: string;
}

export interface ChatMessage {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

// ── NEW: Emotional Trend Report ──
export interface EmotionalReport {
  id?: number;
  period: 'weekly' | 'monthly';
  startDate: Date;
  endDate: Date;
  summary: string;
  dominantEmotions: EmotionScore[];
  moodAverage: number;
  entryCount: number;
  themes: string[];
  growthObservation: string;
  createdAt: Date;
}

// ── NEW: Notification/Reminder ──
export interface Reminder {
  id?: number;
  type: 'checkin' | 'anniversary' | 'rewind';
  title: string;
  body: string;
  scheduledFor: Date;
  seen: boolean;
  entryId?: number;       // linked entry for anniversaries
  createdAt: Date;
}

// ── NEW: Theme/Customization Preferences ──
export interface ThemePreference {
  id?: number;
  key: string;
  value: string;
}

// ── Database ───────────────────────────────────────────────────

class LuminaDB extends Dexie {
  entries!: Table<JournalEntry>;
  media!: Table<MediaItem>;
  moods!: Table<MoodRecord>;
  prompts!: Table<Prompt>;
  habits!: Table<Habit>;
  gratitude!: Table<GratitudeEntry>;
  aiMemories!: Table<AIMemory>;
  settings!: Table<AppSettings>;
  chatMessages!: Table<ChatMessage>;
  emotionalReports!: Table<EmotionalReport>;
  reminders!: Table<Reminder>;
  themePrefs!: Table<ThemePreference>;

  constructor() {
    super('lumina');

    this.version(1).stores({
      entries: '++id, title, mood, energy, anxiety, createdAt, updatedAt, *tags, isDreamSpace, isLocked',
      media: '++id, entryId, type, createdAt',
      moods: '++id, score, energy, anxiety, timestamp, entryId',
      prompts: '++id, category, isFavorite',
      habits: '++id, type, timestamp',
      gratitude: '++id, createdAt',
      aiMemories: '++id, entryId, emotionalTone, createdAt',
      settings: '++id, &key',
      chatMessages: '++id, role, createdAt',
    });

    this.version(2).stores({
      entries: '++id, title, mood, energy, anxiety, createdAt, updatedAt, *tags, isDreamSpace, isLocked, isHighIntensity, overallIntensity, isVoiceEntry',
      media: '++id, entryId, type, createdAt',
      moods: '++id, score, energy, anxiety, timestamp, entryId',
      prompts: '++id, category, isFavorite',
      habits: '++id, type, timestamp',
      gratitude: '++id, createdAt',
      aiMemories: '++id, entryId, emotionalTone, createdAt',
      settings: '++id, &key',
      chatMessages: '++id, role, createdAt',
      emotionalReports: '++id, period, startDate, endDate, createdAt',
      reminders: '++id, type, scheduledFor, seen, entryId, createdAt',
      themePrefs: '++id, &key',
    });
  }
}

export const db = new LuminaDB();

// ── Helper: Get/Set app setting ────────────────────────────────

export async function getSetting(key: string): Promise<string | null> {
  const row = await db.settings.where('key').equals(key).first();
  return row?.value ?? null;
}

export async function setSetting(key: string, value: string): Promise<void> {
  const existing = await db.settings.where('key').equals(key).first();
  if (existing) {
    await db.settings.update(existing.id!, { value });
  } else {
    await db.settings.add({ key, value });
  }
}

// ── Helper: Get/Set theme pref ─────────────────────────────────

export async function getThemePref(key: string): Promise<string | null> {
  const row = await db.themePrefs.where('key').equals(key).first();
  return row?.value ?? null;
}

export async function setThemePref(key: string, value: string): Promise<void> {
  const existing = await db.themePrefs.where('key').equals(key).first();
  if (existing) {
    await db.themePrefs.update(existing.id!, { value });
  } else {
    await db.themePrefs.add({ key, value });
  }
}

// ── Helper: Compute intensity ──────────────────────────────────

export function computeIntensity(scores: EmotionScore[]): number {
  if (!scores || scores.length === 0) return 0;
  const avg = scores.reduce((sum, s) => sum + s.intensity, 0) / scores.length;
  return Math.round(avg * 10) / 10;
}

export function isHighIntensityEntry(intensity: number): boolean {
  return intensity >= 7;
}

// ── Seed Data ──────────────────────────────────────────────────

export async function seedPrompts() {
  const count = await db.prompts.count();
  if (count > 0) return;

  const prompts: Omit<Prompt, 'id'>[] = [
    // Healing
    { category: 'healing', text: 'What wound are you still carrying? How would it feel to set it down?' },
    { category: 'healing', text: 'Write a letter of forgiveness — to yourself or someone else.' },
    { category: 'healing', text: 'What part of your past self needs the most compassion right now?' },
    { category: 'healing', text: 'Describe a moment when you felt truly safe. What made it feel that way?' },
    // Relationships
    { category: 'relationships', text: 'Who made you feel seen this week? What did they do?' },
    { category: 'relationships', text: 'What boundary do you need to set but haven\'t yet?' },
    { category: 'relationships', text: 'Write about someone who changed your perspective on love.' },
    { category: 'relationships', text: 'What does healthy love look like to you?' },
    // Self-discovery
    { category: 'self-discovery', text: 'If fear wasn\'t a factor, what would you do tomorrow?' },
    { category: 'self-discovery', text: 'What three words would your best friend use to describe you?' },
    { category: 'self-discovery', text: 'When do you feel most like yourself?' },
    { category: 'self-discovery', text: 'What childhood dream have you quietly let go of? Does it still call to you?' },
    // Creativity
    { category: 'creativity', text: 'Describe a color that matches your current mood. Why?' },
    { category: 'creativity', text: 'Write a tiny story where you are the hero.' },
    { category: 'creativity', text: 'If your emotions were a landscape, what would it look like today?' },
    { category: 'creativity', text: 'What song captures exactly how you feel right now?' },
    // Shadow work
    { category: 'shadow-work', text: 'What emotion do you avoid feeling the most? Why?' },
    { category: 'shadow-work', text: 'What lie do you tell yourself most often?' },
    { category: 'shadow-work', text: 'What part of yourself do you hide from others?' },
    { category: 'shadow-work', text: 'When did you last feel truly angry? What was underneath the anger?' },
    // Goals
    { category: 'goals', text: 'What small step can you take today toward your biggest dream?' },
    { category: 'goals', text: 'Where do you want to be in one year? Describe it in detail.' },
    { category: 'goals', text: 'What habit would change your life if you did it daily?' },
    { category: 'goals', text: 'What are you procrastinating on? What\'s really holding you back?' },
    // Gratitude
    { category: 'gratitude', text: 'What made you smile today — even just a little?' },
    { category: 'gratitude', text: 'Name three things you\'re proud of yourself for.' },
    { category: 'gratitude', text: 'What simple pleasure did you enjoy recently?' },
    { category: 'gratitude', text: 'Who or what are you most thankful for right now?' },
  ];

  await db.prompts.bulkAdd(prompts);
}

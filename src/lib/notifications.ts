// Notification engine for gentle check-in reminders, anniversaries, and rewind alerts
// Works with browser Notification API + internal reminder system

import { db } from './db';
import type { JournalEntry, Reminder } from './db';
import { format, differenceInDays, isToday, subYears, subMonths } from 'date-fns';

// ── Request permission ─────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// ── Send browser notification ──────────────────────────────────

export function sendNotification(title: string, body: string, icon?: string) {
  if (Notification.permission !== 'granted') return;
  new Notification(title, {
    body,
    icon: icon || '/favicon.png',
    badge: '/icon-192.png',
    tag: 'lumina-' + Date.now(),
  });
}

// ── Generate check-in reminder ─────────────────────────────────

const CHECK_IN_MESSAGES = [
  { title: '🌸 How are you feeling?', body: 'Take a moment to check in with yourself. Your garden is waiting.' },
  { title: '🌙 Evening reflection', body: 'The day is winding down. Want to capture what you\'re feeling?' },
  { title: '✨ A thought for you', body: 'Sometimes the smallest entries bloom into the most meaningful memories.' },
  { title: '💭 Gentle nudge', body: 'Your future self will thank you for writing today.' },
  { title: '🌿 Self-care check', body: 'Have you tracked your habits today? Every small step counts.' },
  { title: '🦋 Just breathe', body: 'Open your journal and let the words flow. No pressure, just presence.' },
];

export function getRandomCheckIn() {
  return CHECK_IN_MESSAGES[Math.floor(Math.random() * CHECK_IN_MESSAGES.length)];
}

// ── Anniversary check ──────────────────────────────────────────

export async function checkAnniversaries(): Promise<Reminder[]> {
  const entries = await db.entries.toArray();
  const today = new Date();
  const reminders: Reminder[] = [];

  for (const entry of entries) {
    const entryDate = new Date(entry.createdAt);
    
    // Skip same year entries
    if (entryDate.getFullYear() === today.getFullYear()) continue;

    // Yearly anniversary
    if (entryDate.getMonth() === today.getMonth() && entryDate.getDate() === today.getDate()) {
      const yearsAgo = today.getFullYear() - entryDate.getFullYear();
      const isHighIntensity = entry.isHighIntensity || (entry.overallIntensity && entry.overallIntensity >= 7);
      
      reminders.push({
        type: 'anniversary',
        title: `🕰️ ${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago today`,
        body: isHighIntensity
          ? `You wrote a powerful memory: "${entry.title || entry.content.slice(0, 50)}..."`
          : `You wrote: "${entry.title || entry.content.slice(0, 50)}..."`,
        scheduledFor: today,
        seen: false,
        entryId: entry.id,
        createdAt: new Date(),
      });
    }

    // Monthly anniversary (only for high intensity entries)
    if (entry.isHighIntensity && entryDate.getDate() === today.getDate()) {
      const monthsAgo = (today.getFullYear() - entryDate.getFullYear()) * 12 + (today.getMonth() - entryDate.getMonth());
      if (monthsAgo > 0 && monthsAgo % 1 === 0 && monthsAgo <= 12) {
        reminders.push({
          type: 'anniversary',
          title: `📅 ${monthsAgo} month${monthsAgo > 1 ? 's' : ''} ago`,
          body: `A memory echoes: "${entry.title || entry.content.slice(0, 60)}..."`,
          scheduledFor: today,
          seen: false,
          entryId: entry.id,
          createdAt: new Date(),
        });
      }
    }
  }

  return reminders;
}

// ── Schedule daily check ───────────────────────────────────────

export async function runDailyNotificationCheck() {
  // Check if we already ran today
  const lastCheck = localStorage.getItem('lumina_last_notification_check');
  const today = format(new Date(), 'yyyy-MM-dd');
  if (lastCheck === today) return;

  localStorage.setItem('lumina_last_notification_check', today);

  // Find and store anniversary reminders
  const anniversaryReminders = await checkAnniversaries();
  
  // Check if any already exist for today
  const existing = await db.reminders
    .where('scheduledFor')
    .between(new Date(today), new Date(today + 'T23:59:59'))
    .toArray();

  if (existing.length === 0 && anniversaryReminders.length > 0) {
    await db.reminders.bulkAdd(anniversaryReminders);
    
    // Send browser notification for first anniversary
    const first = anniversaryReminders[0];
    sendNotification(first.title, first.body);
  }

  // Check-in reminder if no entries today
  const todayEntries = await db.entries
    .where('createdAt')
    .between(new Date(today), new Date(today + 'T23:59:59'))
    .toArray();

  if (todayEntries.length === 0) {
    const checkin = getRandomCheckIn();
    await db.reminders.add({
      type: 'checkin',
      title: checkin.title,
      body: checkin.body,
      scheduledFor: new Date(),
      seen: false,
      createdAt: new Date(),
    });
  }
}

// ── Get unseen notifications ───────────────────────────────────

export async function getUnseenReminders(): Promise<Reminder[]> {
  return db.reminders.where('seen').equals(0).toArray();
}

export async function markReminderSeen(id: number) {
  await db.reminders.update(id, { seen: true });
}

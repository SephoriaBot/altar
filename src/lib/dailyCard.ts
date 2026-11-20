import type { Slot } from '../types';

// Pure and dependency-free on purpose: the browser shows the card with this,
// and the server will use the exact same function to pick it for notifications.
// Same person + same date always gives the same card.

const DECK_SIZE = 78;

/** Local calendar date as YYYY-MM-DD (the person's own day, not UTC). */
export function localDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// FNV-1a: turns any string into a 32-bit number.
function hash(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

// mulberry32: small seeded random number generator, returns values in [0, 1).
function seeded(seed: number): () => number {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** The card (and orientation) for this person on this date, e.g. dateKey "2026-11-21". */
export function dailyCard(userId: string, dateKey: string): Slot {
  const rand = seeded(hash(`${userId}|${dateKey}`));
  return {
    id: Math.floor(rand() * DECK_SIZE),
    rev: rand() < 0.5,
  };
}

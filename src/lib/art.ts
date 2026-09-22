import type { Arc, Card } from '../types';

// Filenames in public/cards/ use the printed suit name (pentacles), not the
// app's internal arc key (pents). Only the ten numbered minors per suit exist
// as artwork today — no court cards (Page/Knight/Queen/King) — and the same
// 40 files serve every tradition, since a suit-and-number card looks the
// same physical card regardless of which tradition names or reads it.
const SUIT_SLUG: Record<Exclude<Arc, 'major'>, string> = {
  wands: 'wands',
  cups: 'cups',
  swords: 'swords',
  pents: 'pentacles',
};

// Major arcana filenames are zero-padded two-digit position (1-indexed) plus
// a slug of the card's name, e.g. Fool (num 0) -> 01_fool.png, World
// (num 21) -> 22_world.png.
const MAJOR_SLUG: string[] = [
  'fool',
  'magician',
  'high_priestess',
  'empress',
  'emperor',
  'hierophant',
  'lovers',
  'chariot',
  'strength',
  'hermit',
  'wheel_of_fortune',
  'justice',
  'hanged_man',
  'death',
  'temperance',
  'devil',
  'tower',
  'star',
  'moon',
  'sun',
  'judgement',
  'world',
];

/** Path under public/ for this card's artwork, or null when none exists yet. */
export function cardArt(c: Pick<Card, 'arc' | 'num' | 'court'>): string | null {
  if (c.arc === 'major') {
    if (c.num === null || c.num === undefined || c.num < 0 || c.num > 21) return null;
    const n = String(c.num + 1).padStart(2, '0');
    return `/cards/${n}_${MAJOR_SLUG[c.num]}.png`;
  }
  if (c.court || !c.num || c.num < 1 || c.num > 10) return null;
  return `/cards/${SUIT_SLUG[c.arc]}${c.num}.png`;
}

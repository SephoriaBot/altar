import type { Arc, Card } from '../types';

// Filenames in public/cards/ use the printed suit name (pentacles), not the
// app's internal arc key (pents). Only the ten numbered minors per suit exist
// as artwork today — no majors, no court cards (Page/Knight/Queen/King) — and
// the same 40 files serve every tradition, since a suit-and-number card looks
// the same physical card regardless of which tradition names or reads it.
const SUIT_SLUG: Record<Exclude<Arc, 'major'>, string> = {
  wands: 'wands',
  cups: 'cups',
  swords: 'swords',
  pents: 'pentacles',
};

/** Path under public/ for this card's artwork, or null when none exists yet. */
export function cardArt(c: Pick<Card, 'arc' | 'num' | 'court'>): string | null {
  if (c.arc === 'major' || c.court || !c.num || c.num < 1 || c.num > 10) return null;
  return `/cards/${SUIT_SLUG[c.arc]}${c.num}.png`;
}

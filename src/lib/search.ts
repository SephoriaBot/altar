import { CARDS } from '../data/cards';
import type { Card } from '../types';

export type DeckFilter = 'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pents';

export function searchCards(q: string, filter: DeckFilter): Card[] {
  const toks = q
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && t !== 'of' && t !== 'the');

  const scored: { c: Card; score: number }[] = [];
  for (const c of CARDS) {
    if (filter !== 'all' && c.arc !== filter) continue;
    let score = 0;
    let ok = true;
    for (const t of toks) {
      let best = 0;
      for (const w of c.words) {
        if (w === t) {
          best = 3;
          break;
        }
        if (w.startsWith(t)) best = Math.max(best, 1);
      }
      if (!best) {
        ok = false;
        break;
      }
      score += best;
    }
    if (ok) scored.push({ c, score });
  }
  return scored.sort((a, b) => b.score - a.score || a.c.id - b.c.id).map((x) => x.c);
}

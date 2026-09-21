import type { Card } from '../types';
import type { Tradition } from '../data/traditions';

export type DeckFilter = 'all' | 'major' | 'wands' | 'cups' | 'swords' | 'pents';

const SKIP = new Set(['of', 'the', 'le', 'la', 'l', 'de', 'du', 'des']);

export const filtersFor = (T: Tradition): [DeckFilter, string][] => [
  ['all', 'All'],
  ['major', 'Major'],
  ['wands', T.suits.wands.name],
  ['cups', T.suits.cups.name],
  ['swords', T.suits.swords.name],
  ['pents', T.suits.pents.name],
];

export function searchCards(q: string, filter: DeckFilter, T: Tradition): Card[] {
  const toks = q
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((t) => t && !SKIP.has(t));

  const scored: { c: Card; score: number }[] = [];
  for (const c of T.cards) {
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
  return scored.sort((a, b) => b.score - a.score || a.c.ord - b.c.ord).map((x) => x.c);
}

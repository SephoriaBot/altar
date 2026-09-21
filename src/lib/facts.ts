import type { Card } from '../types';
import type { Tradition } from '../data/traditions';

/** Number, court and suit sentences for a card, in the given tradition. Majors have none. */
export function cardFacts(c: Card, T: Tradition): string[] {
  if (c.arc === 'major') return [];
  const suit = T.suits[c.arc];
  const out: string[] = [];
  if (c.court && c.rank) out.push(`${c.rank}: ${T.court[c.rank]}.`);
  else if (c.num && c.rank) {
    out.push(`${c.rank}: ${T.numt[c.num]}.`);
    if (T.numerology) {
      const m = T.cards.find((x) => x.arc === 'major' && x.num === c.num);
      if (m) out.push(`It echoes ${m.name} (${m.rk}).`);
    }
  }
  out.push(`${suit.name} govern ${suit.domain}.`);
  return out;
}

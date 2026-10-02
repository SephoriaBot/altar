import type { Card, Slot } from '../types';

// Unbiased random integer in [0, max) using the browser's crypto source.
// Rejection sampling avoids the modulo bias you'd get from `% max`.
function randInt(max: number): number {
  const lim = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  do {
    crypto.getRandomValues(buf);
  } while (buf[0] >= lim);
  return buf[0] % max;
}

/** Fisher-Yates shuffle. Returns a new array. */
export function shuffle<T>(items: readonly T[]): T[] {
  const a = items.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Draw `count` distinct cards from the deck, skipping any id in `exclude`.
 * Ids are shared across traditions, so a draw reads correctly in any of them.
 * Each card is reversed with 50% odds when `reversals` is on.
 */
export function drawCards(deck: readonly Card[], count: number, exclude: ReadonlySet<number>, reversals: boolean): Slot[] {
  const pool = shuffle(deck.filter((c) => !exclude.has(c.id)));
  return pool.slice(0, count).map((c) => ({ id: c.id, rev: reversals && randInt(2) === 1 }));
}

// Interpretation traditions. Each one is a full reading of the same 78 cards (same ids),
// so a saved reading opens in any of them. To add another tradition, build a Card[] with
// the same ids, describe it here, and add its id to TraditionId in types.ts.

import type { Arc, Card, SuitDef, TraditionId } from '../types';
import { CARDS } from './cards';
import { BASICS, COURT, NUMT, PAIRS, SUITS } from './lore';
import { M_BASICS, M_CARDS, M_COURT, M_NUMT, M_PAIRS, M_SUITS } from './marseille';

export interface Tradition {
  id: TraditionId;
  /** Toggle label. */
  label: string;
  /** One line under the toggle. */
  tagline: string;
  /** Intro sentence on the Cards tab. */
  cardsIntro: string;
  cards: Card[];
  /** Look up a card by its shared key (the Rider-Waite short name). */
  byKey: Map<string, Card>;
  suits: Record<Exclude<Arc, 'major'>, SuitDef>;
  numt: Record<number, string>;
  court: Record<string, string>;
  pairs: [string, string, string][];
  pairMap: Map<string, string>;
  basics: string[];
  /** Show elements, astrology and elemental dignities. */
  elements: boolean;
  /** Read reversed cards. When false every card is read upright. */
  reversals: boolean;
  /** Read number cards against the major of the same number, and add up major pairs. */
  numerology: boolean;
  reversalsNote: string;
}

const pairKey = (a: string, b: string) => [a, b].sort().join('+');
const pairMapOf = (pairs: [string, string, string][]) => new Map(pairs.map(([a, b, t]) => [pairKey(a, b), t]));
const byKeyOf = (cards: Card[]) => new Map(cards.map((c) => [c.key, c]));

export const TRADITIONS: Record<TraditionId, Tradition> = {
  rws: {
    id: 'rws',
    label: 'Rider-Waite',
    tagline: 'Rider-Waite-Smith meanings with Golden Dawn elements and astrology. Reversals are optional.',
    cardsIntro: 'All 78 cards with upright and reversed meanings. Search by name, number or suit.',
    cards: CARDS,
    byKey: byKeyOf(CARDS),
    suits: SUITS,
    numt: NUMT,
    court: COURT,
    pairs: PAIRS,
    pairMap: pairMapOf(PAIRS),
    basics: BASICS,
    elements: true,
    reversals: true,
    numerology: false,
    reversalsNote: '',
  },
  marseille: {
    id: 'marseille',
    label: 'Marseille',
    tagline: 'Marseille: numbers, suits and the pictures on the cards. Every card is read upright, with no elements or astrology.',
    cardsIntro: 'All 78 cards in the Marseille tradition, by number and suit. Search in French or English, by name, number or suit.',
    cards: M_CARDS,
    byKey: byKeyOf(M_CARDS),
    suits: M_SUITS,
    numt: M_NUMT,
    court: M_COURT,
    pairs: M_PAIRS,
    pairMap: pairMapOf(M_PAIRS),
    basics: M_BASICS,
    elements: false,
    reversals: false,
    numerology: true,
    reversalsNote: 'Marseille reads every card upright.',
  },
};

export const TRADITION_IDS: TraditionId[] = ['rws', 'marseille'];

/** The tradition the app opens in the first time. */
export const DEFAULT_TRADITION: TraditionId = 'rws';

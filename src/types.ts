export type Arc = 'major' | 'wands' | 'cups' | 'swords' | 'pents';
export type Element = 'Fire' | 'Water' | 'Air' | 'Earth';
export type TraditionId = 'rws' | 'marseille';

export interface SuitDef {
  name: string;
  el: Element;
  domain: string;
  absent: string;
  syn: string;
  /** How the suit is drawn, for traditions that read the pictures. */
  look?: string;
}

export interface Card {
  id: number;
  name: string;
  short: string;
  arc: Arc;
  num: number | null;
  rank: string | null;
  court: boolean;
  rk: string;
  el: Element;
  corr: string | null;
  kwU: string[];
  kwR: string[];
  up: string;
  rev: string;
  themes: string[];
  tu: number;
  tr: number;
  words: string[];
  /** Stable name shared by every tradition (the Rider-Waite short name). Pairings are looked up by this. */
  key: string;
  /** Sort order within the deck. */
  ord: number;
  /** The same card's name in the other tradition, when it differs. */
  alt: string | null;
  /** What to notice in the picture (Marseille). */
  look: string | null;
}

export interface Pos {
  l: string;
  m: string;
  x: number;
  y: number;
  rot: number;
  ntop?: boolean;
}

export interface Spread {
  id: string;
  name: string;
  tags: string[];
  blurb: string;
  best: string;
  steps: string[];
  tip: string;
  pos: Pos[];
  seq?: boolean;
  out?: number;
  story?: number[];
  links?: [number, number, string?][];
  bookend?: boolean;
  n: number;
  maxX: number;
  maxY: number;
}

export interface Slot {
  id: number;
  rev: boolean;
}

export interface Entry {
  i: number;
  pos: Pos;
  card: Card;
  rev: boolean;
}

export interface ReadState {
  spread: string;
  cards: Record<string, (Slot | null)[]>;
  rev: boolean;
  focus: string;
  free: number;
  view: 'cards' | 'together';
  tradition: TraditionId;
}

export interface SavedReading {
  id: string;
  createdAt: number;
  spreadId: string;
  spreadName: string;
  question: string;
  notes: string;
  cards: (Slot | null)[];
}

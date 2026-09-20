export type Arc = 'major' | 'wands' | 'cups' | 'swords' | 'pents';
export type Element = 'Fire' | 'Water' | 'Air' | 'Earth';

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

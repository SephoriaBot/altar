// traditions/types.ts
// A "tradition" is a full card set with its own names, order, and meanings.
// A "lens" is an optional overlay that adds interpretation on top of any tradition.

export type CardId = string; // stable, tradition-neutral key, e.g. "major-00", "cups-03"

export interface CardMeaning {
  name: string;              // tradition's own name, e.g. "Le Bateleur" / "The Magician"
  number?: string;           // tradition's own numbering, e.g. "VIII" (majors differ by tradition)
  upright: string;
  reversed?: string;         // omit for traditions that don't read reversals (most Marseille)
  keywords: string[];
  notes?: string;            // structural/numerological or historical remarks
}

export interface Tradition {
  id: string;                // "rws" | "marseille" | "thoth" | "etteilla" | ...
  label: string;
  origin: string;            // short blurb shown in the UI
  usesReversals: boolean;
  pipsIllustrated: boolean;  // false for Marseille-style decks
  cards: Record<CardId, CardMeaning>;
  // Cards that don't map 1:1 to the shared CardId set (renamed, reordered, extra)
  aliases?: Record<CardId, string>;
}

export interface LensEntry {
  text: string;
  tags?: string[];
}

export interface Lens {
  id: string;                // "golden-dawn" | "jungian" | "astrology"
  label: string;
  description: string;
  // Keyed by CardId so it works over every tradition
  entries: Record<CardId, LensEntry>;
}

export interface InterpretationRequest {
  traditionId: string;
  lensIds: string[];         // zero or more
  cards: { id: CardId; reversed?: boolean }[];
}

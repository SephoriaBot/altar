// traditions/cards.ts
// The shared 78-card ID set every tradition and lens maps onto.
// IDs identify the card itself, not its position or name in any one deck.
import type { CardId, Tradition } from "./types";

// Majors use slugs, not numbers, because numbering differs by tradition:
// RWS has Strength 8 / Justice 11; Marseille and Thoth have Justice 8 / Strength 11.
// (In Thoth these are "Adjustment" and "Lust".) Put each tradition's own
// number in CardMeaning.number.
export const MAJOR_IDS = [
  "fool", "magician", "high-priestess", "empress", "emperor", "hierophant",
  "lovers", "chariot", "strength", "hermit", "wheel-of-fortune", "justice",
  "hanged-man", "death", "temperance", "devil", "tower", "star", "moon",
  "sun", "judgement", "world",
].map((s) => `major-${s}`);

export const SUITS = ["wands", "cups", "swords", "pentacles"] as const;
export type Suit = (typeof SUITS)[number];

// Canonical court ranks follow RWS naming. Other traditions map onto these
// via CardMeaning.name. Common equivalents (verify against your sources):
//   Thoth:    Princess = page, Prince = knight, Queen = queen, Knight = king
//   Marseille: Valet = page, Cavalier = knight, Reine = queen, Roi = king
// Suit equivalents: Marseille batons = wands, coins = pentacles; Thoth disks = pentacles.
export const RANKS = [
  "ace", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "page", "knight", "queen", "king",
] as const;

export const MINOR_IDS: CardId[] = SUITS.flatMap((suit) =>
  RANKS.map((rank) => `${suit}-${rank}`)
);

export const ALL_CARD_IDS: CardId[] = [...MAJOR_IDS, ...MINOR_IDS]; // 22 + 56 = 78

// Use while building a tradition or lens to see what's left to fill in.
export function coverage(cards: Record<CardId, unknown>) {
  const missing = ALL_CARD_IDS.filter((id) => !(id in cards));
  const unknown = Object.keys(cards).filter((id) => !ALL_CARD_IDS.includes(id));
  return { have: ALL_CARD_IDS.length - missing.length, missing, unknown };
}

export const traditionCoverage = (t: Tradition) => coverage(t.cards);

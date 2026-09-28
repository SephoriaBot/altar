// traditions/registry.ts
import type {
  CardId, CardMeaning, InterpretationRequest, Lens, LensEntry, Tradition,
} from "./types";

// Import each tradition/lens from its own file so they can be added independently.
// import { rws } from "./data/rws";
// import { marseille } from "./data/marseille";
// import { goldenDawn } from "./lenses/goldenDawn";

const traditions: Record<string, Tradition> = {
  // [rws.id]: rws,
  // [marseille.id]: marseille,
};

const lenses: Record<string, Lens> = {
  // [goldenDawn.id]: goldenDawn,
};

export const listTraditions = () => Object.values(traditions);
export const listLenses = () => Object.values(lenses);

export interface ResolvedCard {
  id: CardId;
  reversed: boolean;
  meaning: CardMeaning | null;      // null if the tradition lacks this card
  lensEntries: { lens: string; entry: LensEntry }[];
}

export function resolveReading(req: InterpretationRequest): ResolvedCard[] {
  const tradition = traditions[req.traditionId];
  if (!tradition) throw new Error(`Unknown tradition: ${req.traditionId}`);

  const activeLenses = req.lensIds
    .map((id) => lenses[id])
    .filter((l): l is Lens => Boolean(l));

  return req.cards.map(({ id, reversed = false }) => ({
    id,
    // Ignore reversals for traditions that don't use them
    reversed: tradition.usesReversals ? reversed : false,
    meaning: tradition.cards[id] ?? null,
    lensEntries: activeLenses
      .filter((l) => l.entries[id])
      .map((l) => ({ lens: l.label, entry: l.entries[id] })),
  }));
}

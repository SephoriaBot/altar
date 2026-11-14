import type { Arc, Card } from '../types';

// Filenames in public/cards/ use the printed suit name (pentacles), not the
// app's internal arc key (pents). Every minor has artwork: the ten numbered
// cards (wands1.png ... pentacles10.png) and the four courts
// (pagewands.png, knightcups.png, queenswords.png, kingpentacles.png).
// The same 56 files serve every tradition, since a suit-and-number card looks
// the same physical card regardless of which tradition names or reads it.
const SUIT_SLUG: Record<Exclude<Arc, 'major'>, string> = {
  wands: 'wands',
  cups: 'cups',
  swords: 'swords',
  pents: 'pentacles',
};

// Court filenames are keyed off the card's stable RWS name (card.key, e.g.
// "Page of Wands"), so Thoth's Princess/Prince/Knight and Etteilla's
// Valet/Cavalier/Dame/Roi all land on the same four images.
const COURT_SLUG: Record<string, string> = {
  Page: 'page',
  Knight: 'knight',
  Queen: 'queen',
  King: 'king',
};

// One uploaded file has a stray space and letter in its name; map it here so
// it works as-is. If you rename it to pagewands.png on GitHub, delete this.
const FILE_OVERRIDES: Record<string, string> = {
  '/cards/pagewands.png': '/cards/pagewands%20l.png',
};

// Major arcana filenames are zero-padded two-digit position (1-indexed) plus
// a slug of the card's name, e.g. Fool (num 0) -> 01_fool.png, World
// (num 21) -> 22_world.png.
const MAJOR_SLUG: string[] = [
  'fool',
  'magician',
  'high_priestess',
  'empress',
  'emperor',
  'hierophant',
  'lovers',
  'chariot',
  'strength',
  'hermit',
  'wheel_of_fortune',
  'justice',
  'hanged_man',
  'death',
  'temperance',
  'devil',
  'tower',
  'star',
  'moon',
  'sun',
  'judgement',
  'world',
];

/** Path under public/ for this card's artwork, or null when none exists yet. */
export function cardArt(c: Pick<Card, 'arc' | 'num' | 'court' | 'key'>): string | null {
  if (c.arc === 'major') {
    if (c.num === null || c.num === undefined || c.num < 0 || c.num > 21) return null;
    const n = String(c.num + 1).padStart(2, '0');
    return `/cards/${n}_${MAJOR_SLUG[c.num]}.png`;
  }
  let path: string;
  if (c.court) {
    const rank = COURT_SLUG[c.key.split(' ')[0]];
    if (!rank) return null;
    path = `/cards/${rank}${SUIT_SLUG[c.arc]}.png`;
  } else {
    if (!c.num || c.num < 1 || c.num > 10) return null;
    path = `/cards/${SUIT_SLUG[c.arc]}${c.num}.png`;
  }
  return FILE_OVERRIDES[path] ?? path;
}

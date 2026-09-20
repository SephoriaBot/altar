import type { Element, Entry, Slot, Spread } from '../types';
import { CARDS, BY_SHORT } from '../data/cards';
import { COURT, EL_TXT, FOCUS, NUMT, PAIRS, PLUR, RANKS, SUITS, TH } from '../data/lore';

export const tn = (e: Entry) => (e.rev ? e.card.tr : e.card.tu);
export const kwe = (e: Entry, n = 0) => (e.rev ? e.card.kwR : e.card.kwU)[n];
export const kwsOf = (e: Entry) => (e.rev ? e.card.kwR : e.card.kwU);
export const nm = (e: Entry) => e.card.name + (e.rev ? ' (reversed)' : '');
export const meaning = (e: Entry) => (e.rev ? e.card.rev : e.card.up);
export const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const list = (a: string[]) => (a.length <= 1 ? a[0] || '' : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
export const toneWord = (t: number) => (t > 0 ? 'supportive' : t < 0 ? 'challenging' : 'mixed');

export function normSlots(slots: (Slot | null)[] | undefined, n: number): (Slot | null)[] {
  const old = slots ?? [];
  return Array.from({ length: n }, (_, i) => old[i] ?? null);
}

export function toEntries(sp: Spread, slots: (Slot | null)[], reversals: boolean): Entry[] {
  const out: Entry[] = [];
  sp.pos.forEach((pos, i) => {
    const s = slots[i];
    if (s && CARDS[s.id]) out.push({ i, pos, card: CARDS[s.id], rev: reversals && s.rev });
  });
  return out;
}

const CUR = new Map<string, string>();
PAIRS.forEach(([a, b, t]) => CUR.set([a, b].sort().join('+'), t));
export const pairKey = (a: string, b: string) => [a, b].sort().join('+');
export const pairsFor = (short: string) =>
  PAIRS.filter(([a, b]) => a === short || b === short).map(([a, b, t]) => ({ other: a === short ? b : a, text: t }));
export const cardByShort = (s: string) => BY_SHORT.get(s);

type Rel = 'same' | 'friendly' | 'opposed' | 'neutral';
function dignity(a: Element, b: Element): Rel {
  if (a === b) return 'same';
  const s = [a, b].sort().join('+');
  if (s === 'Air+Fire' || s === 'Earth+Water') return 'friendly';
  if (s === 'Fire+Water' || s === 'Air+Earth') return 'opposed';
  return 'neutral';
}

export interface PairOut {
  a: Entry;
  b: Entry;
  label?: string;
  text: string;
  curated: boolean;
  rel: Rel;
  score: number;
}

function pairInfo(a: Entry, b: Entry): Omit<PairOut, 'a' | 'b' | 'label'> {
  const ca = a.card;
  const cb = b.card;
  const cur = CUR.get(pairKey(ca.short, cb.short));
  const rel = dignity(ca.el, cb.el);
  const ka = kwe(a);
  const kb = kwe(b);
  const ta = tn(a);
  const tb = tn(b);
  const parts: string[] = [];
  let score = 0;

  if (cur) {
    parts.push(cur);
    const revs = [a, b].filter((e) => e.rev).map((e) => e.card.name);
    if (revs.length) parts.push(`With ${list(revs)} reversed, expect this to play out more internally, or with delays.`);
    score += 3;
  } else {
    if (rel === 'same') parts.push(`Both carry ${ca.el} energy, so ${ka} and ${kb} reinforce each other.`);
    else if (rel === 'friendly') parts.push(`${ca.el} and ${cb.el} support one another here: ${ka} feeds ${kb}.`);
    else if (rel === 'opposed') parts.push(`${ca.el} meets ${cb.el}. ${cap(ka)} and ${kb} pull in different directions, so this pairing asks you to hold both.`);
    else parts.push(`${cap(ka)} and ${kb} sit side by side without clashing, showing two facets of one situation.`);

    const bothMinorNum = ca.arc !== 'major' && cb.arc !== 'major' && ca.num != null && cb.num != null;
    if (bothMinorNum && ca.num === cb.num && ca.arc !== cb.arc) {
      const suitA = ca.arc as Exclude<typeof ca.arc, 'major'>;
      const suitB = cb.arc as Exclude<typeof cb.arc, 'major'>;
      parts.push(`Both are ${PLUR[ca.num! - 1]}, so the theme of ${NUMT[ca.num!]} appears in two areas of life: ${SUITS[suitA].name} and ${SUITS[suitB].name}.`);
      score += 2;
    } else if (ca.arc !== 'major' && ca.arc === cb.arc) {
      const s = ca.arc as Exclude<typeof ca.arc, 'major'>;
      parts.push(`Both are ${SUITS[s].name}, so the story stays in the realm of ${SUITS[s].domain}.`);
      score += 1;
    }

    if (ta > 0 && tb < 0) {
      parts.push(`${ca.name} offers support for the difficulty of ${cb.name}.`);
      score += 1.5;
    } else if (ta < 0 && tb > 0) {
      parts.push(`${cb.name} offers support for the difficulty of ${ca.name}.`);
      score += 1.5;
    } else if (ta < 0 && tb < 0) parts.push('Both cards carry tension, so go gently and look for what they ask you to release.');
    else if (ta > 0 && tb > 0) parts.push('Both cards are supportive, a good sign for momentum here.');

    if (rel === 'opposed') score += 2;
    if (rel === 'same') score += 0.5;
  }
  return { text: parts.join(' '), curated: !!cur, rel, score };
}

export interface Analysis {
  chips: string[];
  paras: string[];
  themes: { t: string; label: string; line: string; q: string; cards: string[] }[];
  pairs: PairOut[];
  story: string;
  lean: string;
  watch: string;
  note: string;
  questions: string[];
}

export function analyze(entries: Entry[], sp: Spread, reversals: boolean): Analysis {
  const n = entries.length;
  const arc = (e: Entry) => e.card.arc;
  const majors = entries.filter((e) => arc(e) === 'major');
  const minors = entries.filter((e) => arc(e) !== 'major');
  const sc: Record<string, number> = { wands: 0, cups: 0, swords: 0, pents: 0 };
  minors.forEach((e) => sc[arc(e)]++);
  const ec: Record<string, number> = { Fire: 0, Water: 0, Air: 0, Earth: 0 };
  entries.forEach((e) => ec[e.card.el]++);
  const revs = entries.filter((e) => e.rev);
  const courts = entries.filter((e) => e.card.court);
  const paras: string[] = [];

  if (n >= 3) {
    if (!majors.length) paras.push('No Major Arcana appear, so this reads as everyday matters and choices you can influence directly.');
    else if (majors.length / n >= 0.5) paras.push(`${majors.length} of ${n} cards are Major Arcana. That points to a weighty reading, with themes bigger than everyday logistics.`);
    else if (majors.length === 1) paras.push(`${majors[0].card.name} is the only Major Arcana card, so it likely carries the central lesson.`);
    else paras.push(`${majors.length} Major Arcana cards (${list(majors.map((e) => e.card.name))}) mark the most significant threads.`);
  } else if (majors.length) {
    paras.push(`${list(majors.map((e) => e.card.name))} ${majors.length > 1 ? 'are Major Arcana cards, which add' : 'is a Major Arcana card, which adds'} weight to the reading.`);
  }

  const mx = Math.max(0, ...Object.values(sc));
  const dom = Object.keys(sc).filter((k) => sc[k] === mx && mx >= 2) as (keyof typeof SUITS)[];
  if (dom.length && minors.length >= 3) {
    if (dom.length === 1) paras.push(`${SUITS[dom[0]].name} lead with ${mx} of ${minors.length} minor cards, so the main arena is ${SUITS[dom[0]].domain}.`);
    else paras.push(`${list(dom.map((k) => SUITS[k].name))} tie with ${mx} cards each, so ${list(dom.map((k) => SUITS[k].domain))} all compete for attention.`);
  }
  if (minors.length >= 5) {
    (Object.keys(sc) as (keyof typeof SUITS)[])
      .filter((k) => !sc[k])
      .slice(0, 2)
      .forEach((k) => paras.push(`No ${SUITS[k].name} appear, which can mean ${SUITS[k].absent}.`));
  }
  if (n >= 4) {
    const me = (Object.keys(ec) as Element[]).sort((a, b) => ec[b] - ec[a])[0];
    const dupOfSuit = dom.length === 1 && SUITS[dom[0]].el === me;
    if (ec[me] >= 3 && ec[me] / n >= 0.4 && !dupOfSuit) paras.push(`${me} energy runs strong (${ec[me]} of ${n} cards): ${EL_TXT[me]}.`);
  }
  if (reversals && n >= 2) {
    if (!revs.length) paras.push('Every card is upright, so the energy is moving outward and is easy to act on.');
    else if (revs.length / n >= 0.5) paras.push(`${revs.length} of ${n} cards are reversed. Much of this is happening internally, meeting resistance, or shifting.`);
    else paras.push(`Reversed: ${list(revs.map((e) => e.card.name))}. Those areas are delayed, internal, or asking for reflection.`);
  }
  if (courts.length >= 2) paras.push(`${courts.length} court cards (${list(courts.map((e) => e.card.name))}) put people, or roles you're stepping into, at the center.`);
  else if (courts.length === 1) paras.push(`${courts[0].card.name} is a court card. It may be a person in your life, or a way of showing up.`);

  const byNum: Record<number, Entry[]> = {};
  minors
    .filter((e) => !e.card.court && e.card.num)
    .forEach((e) => {
      (byNum[e.card.num!] ||= []).push(e);
    });
  Object.keys(byNum)
    .map(Number)
    .filter((k) => byNum[k].length >= 2)
    .slice(0, 2)
    .forEach((k) => {
      const g = byNum[k];
      paras.push(`${g.length} ${PLUR[k - 1]} (${list(g.map((e) => e.card.name))}) repeat the theme of ${NUMT[k]} across ${list(g.map((e) => SUITS[e.card.arc as keyof typeof SUITS].name))}.`);
    });

  const plus = entries.filter((e) => tn(e) > 0).length;
  const minus = entries.filter((e) => tn(e) < 0).length;
  if (n >= 3) {
    if (plus >= minus + 2) paras.push('Supportive cards outnumber challenging ones, so the overall current is helpful even where there is friction.');
    else if (minus >= plus + 2) paras.push('Challenging cards outnumber supportive ones. Read that as a call for care and honesty, not a prediction of failure.');
    else paras.push('Supportive and challenging cards are fairly balanced, so the outcome depends heavily on the choices you make.');
  }
  if (sp.out != null) {
    const o = entries.find((e) => e.i === sp.out);
    if (o) {
      const t = tn(o);
      const who = `The ${lc(o.pos.l)} card, ${nm(o)},`;
      paras.push(
        t > 0
          ? `${who} is encouraging, so this is where things tend to lead if you keep going.`
          : t < 0
            ? `${who} is a caution. Treat it as an early warning you can respond to, not a fixed verdict.`
            : `${who} is open-ended, so where this lands is shaped by your choices.`,
      );
    }
  }

  const chips: string[] = [];
  if (majors.length) chips.push(`${majors.length} Major Arcana`);
  (Object.keys(sc) as (keyof typeof SUITS)[]).forEach((k) => sc[k] && chips.push(`${sc[k]} ${SUITS[k].name}`));
  if (courts.length) chips.push(`${courts.length} court`);
  if (reversals && revs.length) chips.push(`${revs.length} reversed`);

  const th: Record<string, Entry[]> = {};
  entries.forEach((e) => e.card.themes.forEach((t) => (th[t] ||= []).push(e)));
  let tl = Object.keys(th).sort((a, b) => th[b].length - th[a].length);
  tl = n >= 4 ? tl.filter((t) => th[t].length >= 2) : tl.slice(0, 2);
  tl = tl.slice(0, 3);
  const themes = tl.map((t) => ({ t, label: TH[t].label, line: TH[t].line, q: TH[t].q, cards: th[t].map((e) => e.card.name) }));

  const idx: Record<number, Entry> = {};
  entries.forEach((e) => (idx[e.i] = e));
  let raw: [number, number, string?][];
  if (sp.links) raw = sp.links;
  else {
    raw = [];
    for (let k = 0; k < entries.length - 1; k++) raw.push([entries[k].i, entries[k + 1].i]);
    if (entries.length >= 3 && sp.bookend !== false) raw.push([entries[0].i, entries[entries.length - 1].i]);
  }
  let pairs: PairOut[] = raw
    .filter(([x, y]) => idx[x] && idx[y])
    .map(([x, y, label]) => ({ a: idx[x], b: idx[y], label, ...pairInfo(idx[x], idx[y]) }));
  if (pairs.length > 6) {
    const keep = new Set(
      pairs
        .map((_, k) => k)
        .sort((x, y) => pairs[y].score - pairs[x].score || x - y)
        .slice(0, 6),
    );
    pairs = pairs.filter((_, k) => keep.has(k));
  }

  let story = '';
  const sidx = sp.story ?? (sp.seq ? sp.pos.map((_, i) => i) : null);
  if (sidx) {
    const seq = sidx.map((i) => idx[i]).filter(Boolean);
    if (seq.length >= 2) {
      const f = seq[0];
      const l = seq[seq.length - 1];
      let mid = seq.slice(1, -1);
      if (mid.length > 4) mid = [mid[Math.floor(mid.length / 2)]];
      story = `It opens with ${kwe(f)} (${lc(f.pos.l)})` + (mid.length ? `, moves through ${list(mid.map((e) => kwe(e)))}` : '') + `, and arrives at ${kwe(l)} (${lc(l.pos.l)}).`;
      const d = tn(l) - tn(f);
      story += d > 0 ? ' The trend is upward: things ease as the story unfolds.' : d < 0 ? ' The trend dips toward the end, which is worth noticing while there is still time to adjust.' : ' The energy stays fairly level from start to finish.';
    }
  }

  const sup = entries.filter((e) => tn(e) > 0);
  const chal = entries.filter((e) => tn(e) < 0);
  const at = (e: Entry) => `${nm(e)} in ${lc(e.pos.l)}`;
  const lean = sup.length ? `${list(sup.map(at))}. These bring ${list(sup.slice(0, 3).map((e) => kwe(e)))}.` : '';
  const watch = chal.length ? `${list(chal.map(at))}. These point to ${list(chal.slice(0, 3).map((e) => kwe(e)))}.` : '';
  const note =
    sup.length && chal.length
      ? `The sticking point is ${chal[0].card.name} (${lc(chal[0].pos.l)}). ${sup[0].card.name} (${lc(sup[0].pos.l)}) shows what can help.`
      : !sup.length && !chal.length
        ? 'Every card is mixed, so this reading is more about nuance and choice than clear help or clear warning.'
        : '';

  const questions: string[] = themes.slice(0, 2).map((t) => t.q);
  if (sup.length && chal.length) questions.push(`What would it look like to meet ${kwe(chal[0])} with more ${kwe(sup[0])}?`);
  const cp = pairs.find((p) => p.curated || p.rel === 'opposed');
  if (cp) questions.push(`How could ${kwe(cp.a)} and ${kwe(cp.b)} both be true at once?`);
  questions.push('Which card surprised you most, and what does that reaction tell you?');

  return { chips, paras, themes, pairs, story, lean, watch, note, questions: questions.slice(0, 4) };
}

export interface FocusResult {
  intro: string;
  direct: Entry[];
  rest: string;
}

export function focusLens(entries: Entry[], key: string): FocusResult | null {
  const F = FOCUS[key];
  if (!F || key === 'general') return null;
  const scored = entries
    .map((e) => ({
      e,
      s: e.card.themes.filter((t) => F.themes.includes(t)).length + (F.suits?.includes(e.card.arc) ? 1 : 0) + (F.major && e.card.arc === 'major' ? 0.5 : 0),
    }))
    .sort((a, b) => b.s - a.s);
  const dir = scored.filter((x) => x.s >= 1).slice(0, 3);
  const rest = scored.filter((x) => !dir.includes(x));
  return {
    intro: F.intro,
    direct: dir.map((x) => x.e),
    rest: dir.length && rest.length ? `The rest sets the context: ${list(rest.map((x) => `${x.e.card.name} (${kwe(x.e)})`))}.` : '',
  };
}

export function courtNote(rank: string) {
  return COURT[rank];
}
export { RANKS };

export function readingText(sp: Spread, entries: Entry[], reversals: boolean, question = ''): string {
  const L: string[] = [`${sp.name} reading`];
  if (question) L.push(`Question: ${question}`);
  L.push('');
  entries.forEach((e) => {
    L.push(`${e.i + 1}. ${e.pos.l}: ${nm(e)}`, `   ${kwsOf(e).join(', ')}`, `   ${meaning(e)}`, '');
  });
  if (entries.length >= 2) {
    const A = analyze(entries, sp, reversals);
    L.push('Together', '');
    A.paras.forEach((p) => L.push(p));
    if (A.pairs.length) {
      L.push('', 'Connections');
      A.pairs.forEach((p) => L.push(`${p.a.pos.l} and ${p.b.pos.l}: ${p.text}`));
    }
    if (A.story) L.push('', `Story: ${A.story}`);
    L.push('', 'Questions to sit with');
    A.questions.forEach((q) => L.push(`- ${q}`));
  }
  return L.join('\n');
}

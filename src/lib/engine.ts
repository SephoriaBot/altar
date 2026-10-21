import type { Card, Element, Entry, Slot, Spread } from '../types';
import type { Tradition } from '../data/traditions';
import { EL_TXT, FOCUS, PLUR, TH } from '../data/lore';

export const tn = (e: Entry) => (e.rev ? e.card.tr : e.card.tu);
export const kwe = (e: Entry, n = 0) => (e.rev ? e.card.kwR : e.card.kwU)[n];
export const kwsOf = (e: Entry) => (e.rev ? e.card.kwR : e.card.kwU);
export const nm = (e: Entry) => e.card.name + (e.rev ? ' (reversed)' : '');
export const meaning = (e: Entry) => (e.rev ? e.card.rev : e.card.up);
export const lc = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const list = (a: string[]) =>
  a.length <= 1 ? a[0] || '' : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1];
export const toneWord = (t: number) => (t > 0 ? 'supportive' : t < 0 ? 'challenging' : 'mixed');

export function normSlots(slots: (Slot | null)[] | undefined, n: number): (Slot | null)[] {
  const old = slots ?? [];
  return Array.from({ length: n }, (_, i) => old[i] ?? null);
}

export function toEntries(sp: Spread, slots: (Slot | null)[], reversals: boolean, T: Tradition): Entry[] {
  const out: Entry[] = [];
  sp.pos.forEach((pos, i) => {
    const s = slots[i];
    if (s && T.cards[s.id]) out.push({ i, pos, card: T.cards[s.id], rev: reversals && s.rev });
  });
  return out;
}

export const pairKey = (a: string, b: string) => [a, b].sort().join('+');

export const pairsFor = (key: string, T: Tradition) =>
  T.pairs.filter(([a, b]) => a === key || b === key).map(([a, b, t]) => ({ other: a === key ? b : a, text: t }));

export const cardByKey = (key: string, T: Tradition) => T.byKey.get(key);

const numOf = (c: Card): number | null =>
  c.court ? null : c.arc === 'major' && c.num === 0 ? null : c.num;

const reduceTo21 = (n: number) => {
  while (n > 21) n = String(n).split('').reduce((t, d) => t + Number(d), 0);
  return n;
};

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

function pairInfo(a: Entry, b: Entry, T: Tradition): Omit<PairOut, 'a' | 'b' | 'label'> {
  const ca = a.card;
  const cb = b.card;
  const SUITS = T.suits;
  const cur = T.pairMap.get(pairKey(ca.key, cb.key));
  const rel: Rel = T.elements ? dignity(ca.el, cb.el) : 'neutral';
  const ka = kwe(a);
  const kb = kwe(b);
  const ta = tn(a);
  const tb = tn(b);
  const parts: string[] = [];
  let score = 0;

  if (cur) {
    parts.push(cur);
    const revs = [a, b].filter((e) => e.rev).map((e) => e.card.name);
    if (revs.length) {
      parts.push(
        `With ${list(revs)} reversed, consider whether this connection is harder to express, delayed, or turning inward.`,
      );
    }
    score += 3;
  } else {
    if (!T.elements) {
      parts.push(
        `${cap(ka)} and ${kb} sit side by side, so read them as two voices in one conversation. Ask which one speaks first.`,
      );
    } else if (rel === 'same') {
      parts.push(`Both carry ${ca.el} energy, so ${ka} and ${kb} reinforce each other.`);
    } else if (rel === 'friendly') {
      parts.push(`${ca.el} and ${cb.el} support one another here: ${ka} feeds ${kb}.`);
    } else if (rel === 'opposed') {
      parts.push(
        `${ca.el} meets ${cb.el}. ${cap(ka)} and ${kb} pull in different directions, so this pairing asks you to hold both.`,
      );
    } else {
      parts.push(
        `${cap(ka)} and ${kb} sit side by side without an obvious elemental clash, showing two facets of one situation.`,
      );
    }

    const bothMinorNum =
      ca.arc !== 'major' && cb.arc !== 'major' && ca.num != null && cb.num != null;

    if (bothMinorNum && ca.num === cb.num && ca.arc !== cb.arc) {
      const suitA = ca.arc as Exclude<typeof ca.arc, 'major'>;
      const suitB = cb.arc as Exclude<typeof cb.arc, 'major'>;
      parts.push(
        `Both are ${PLUR[ca.num! - 1]}, so the theme of ${T.numt[ca.num!]} appears in two areas of life: ${SUITS[suitA].name} and ${SUITS[suitB].name}.`,
      );
      score += 2;
    } else if (ca.arc !== 'major' && ca.arc === cb.arc) {
      const s = ca.arc as Exclude<typeof ca.arc, 'major'>;
      parts.push(`Both are ${SUITS[s].name}, so the story stays in the realm of ${SUITS[s].domain}.`);
      score += 1;
    }

    if (T.numerology) {
      const na = numOf(ca);
      const nb = numOf(cb);

      if (ca.arc === 'major' && cb.arc === 'major' && na != null && nb != null) {
        const sum = na + nb;
        const r = reduceTo21(sum);
        const M = T.cards.find((c) => c.arc === 'major' && c.num === r);

        if (M) {
          parts.push(
            `Numerology: ${ca.rk} + ${cb.rk} = ${sum}${sum > 21 ? `, which reduces to ${r}` : ''}, so ${M.name} (${M.rk}) colors the pair.`,
          );
        }

        if (Math.abs(na - nb) === 1) {
          parts.push('They follow each other in the count, so the second can be read as a development of the first.');
          score += 1;
        }
      } else if (
        ca.arc !== 'major' &&
        ca.arc === cb.arc &&
        na != null &&
        nb != null &&
        Math.abs(na - nb) === 1
      ) {
        parts.push('They follow each other in the count, so the second can be read as a development of the first.');
        score += 1;
      }
    }

    if (ta > 0 && tb < 0) {
      parts.push(`${ca.name} offers a possible resource for working with the difficulty represented by ${cb.name}.`);
      score += 1.5;
    } else if (ta < 0 && tb > 0) {
      parts.push(`${cb.name} offers a possible resource for working with the difficulty represented by ${ca.name}.`);
      score += 1.5;
    } else if (ta < 0 && tb < 0) {
      parts.push(
        'Both cards carry tension. Rather than assuming failure, look at the shared pattern they invite you to acknowledge or change.',
      );
    } else if (ta > 0 && tb > 0) {
      parts.push(
        'Both cards are supportive, suggesting resources or conditions that may help the situation.',
      );
    }

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

type QuestionLens = {
  label: string;
  terms: string[];
  prompt: string;
};

const QUESTION_LENSES: QuestionLens[] = [
  {
    label: 'relationships and connection',
    terms: [
      'relationship', 'relationships', 'love', 'romance', 'romantic', 'partner',
      'boyfriend', 'girlfriend', 'spouse', 'marriage', 'dating', 'crush',
      'breakup', 'break up', 'friendship', 'friend', 'family', 'connection', 'soulmate',
    ],
    prompt:
      'Consider reciprocity, communication, emotional needs, boundaries, and what each person can actually choose.',
  },
  {
    label: 'work and purpose',
    terms: [
      'career', 'job', 'work', 'boss', 'coworker', 'colleague', 'promotion',
      'interview', 'business', 'school', 'study', 'studying', 'education',
      'purpose', 'calling', 'creative', 'project',
    ],
    prompt:
      'Consider practical constraints, collaboration, motivation, skill-building, and the difference between an aspiration and an actionable next step.',
  },
  {
    label: 'money and resources',
    terms: [
      'money', 'finance', 'financial', 'budget', 'debt', 'income', 'salary',
      'wealth', 'purchase', 'afford', 'rent', 'savings', 'investment',
    ],
    prompt:
      'Consider stability, trade-offs, available resources, uncertainty, and practical decisions rather than guaranteed financial outcomes.',
  },
  {
    label: 'personal growth',
    terms: [
      'growth', 'healing', 'heal', 'confidence', 'self-worth', 'self worth',
      'identity', 'habit', 'habitual', 'change', 'changing', 'letting go',
      'moving on', 'purpose', 'myself', 'personal',
    ],
    prompt:
      'Consider patterns, agency, self-understanding, and one manageable action that could support change.',
  },
  {
    label: 'a decision or choice',
    terms: [
      'should i', 'should we', 'whether', 'decide', 'decision', 'choice',
      'choose', 'option', 'options', 'which', 'worth it', 'take the risk',
      'move', 'quit', 'leave', 'stay',
    ],
    prompt:
      'Consider what each option asks of you, what information is missing, and which choice best fits your values and constraints.',
  },
  {
    label: 'timing and change',
    terms: [
      'when', 'timing', 'soon', 'future', 'next', 'eventually', 'will i',
      'will we', 'will they', 'happen', 'coming', 'move house', 'moving', 'transition',
    ],
    prompt:
      'Treat the cards as reflection on readiness, conditions, and possible next steps, not as a reliable prediction of dates or fixed outcomes.',
  },
];

function detectQuestionLens(question: string): QuestionLens | null {
  const q = ` ${question.toLowerCase().replace(/[’']/g, '')} `;
  const matches = QUESTION_LENSES.map((lens) => ({
    lens,
    score: lens.terms.reduce((sum, term) => sum + (q.includes(term) ? 1 : 0), 0),
  }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  return matches[0]?.lens ?? null;
}

function positionContext(e: Entry, questionLens: QuestionLens | null): string {
  const p = e.pos.l.toLowerCase();

  const role = /obstacle|challenge|block|difficulty|problem|shadow|fear|avoid|resist/.test(p)
    ? 'This position asks what needs to be faced, understood, or worked through.'
    : /advice|guidance|action|next step|what to do|solution|help/.test(p)
      ? 'Read this as a possible approach or resource, rather than a guaranteed solution.'
      : /outcome|result|future|likely|where .*lead|potential/.test(p)
        ? 'Treat this as one possible direction if current patterns continue, not a fixed prediction.'
        : /past|root|foundation|underlying|cause|beneath/.test(p)
          ? 'Look here for a background influence or underlying pattern, not necessarily the whole explanation.'
          : /you|self|querent|your role|your energy/.test(p)
            ? 'Focus on the questioner’s perspective, needs, and agency.'
            : /other person|their|partner|external|environment|around you/.test(p)
              ? 'Consider the outside perspective or circumstances, while remembering the cards cannot establish another person’s private thoughts.'
              : /hope|fear|wish|desire/.test(p)
                ? 'Distinguish what is hoped for or feared from what the other cards suggest about the situation.'
                : /present|current|now|situation/.test(p)
                  ? 'Read this as a snapshot of the current situation, not a permanent state.'
                  : '';

  const focus = questionLens
    ? ` For a question about ${questionLens.label}, ${questionLens.prompt}`
    : '';

  return `${role}${focus}`.trim();
}

export function analyze(
  entries: Entry[],
  sp: Spread,
  reversals: boolean,
  T: Tradition,
  question = '',
): Analysis {
  const SUITS = T.suits;
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
  const cleanQuestion = question.trim();
  const lens = detectQuestionLens(cleanQuestion);

  if (cleanQuestion) {
    paras.push(`Your question is: “${cleanQuestion}”`);

    if (lens) {
      paras.push(`Interpretive lens — ${lens.label}: ${lens.prompt}`);
    } else {
      paras.push(
        'Read the cards in relation to the exact situation you asked about. Use the position, card symbolism, and connections together rather than treating any single card as a standalone verdict.',
      );
    }
  }

  if (n >= 3) {
    if (!majors.length) {
      paras.push('No Major Arcana appear, so this reads as everyday matters and choices you can influence directly.');
    } else if (majors.length / n >= 0.5) {
      paras.push(`${majors.length} of ${n} cards are Major Arcana. That points to a weighty reading, with themes bigger than everyday logistics.`);
    } else if (majors.length === 1) {
      paras.push(`${majors[0].card.name} is the only Major Arcana card, so it likely carries the central lesson.`);
    } else {
      paras.push(`${majors.length} Major Arcana cards (${list(majors.map((e) => e.card.name))}) mark the most significant threads.`);
    }
  } else if (majors.length) {
    paras.push(
      `${list(majors.map((e) => e.card.name))} ${majors.length > 1 ? 'are Major Arcana cards, which add' : 'is a Major Arcana card, which adds'} weight to the reading.`,
    );
  }

  const mx = Math.max(0, ...Object.values(sc));
  const dom = Object.keys(sc).filter((k) => sc[k] === mx && mx >= 2) as (keyof typeof SUITS)[];

  if (dom.length && minors.length >= 3) {
    if (dom.length === 1) {
      paras.push(`${SUITS[dom[0]].name} lead with ${mx} of ${minors.length} minor cards, so the main arena is ${SUITS[dom[0]].domain}.`);
    } else {
      paras.push(`${list(dom.map((k) => SUITS[k].name))} tie with ${mx} cards each, so ${list(dom.map((k) => SUITS[k].domain))} all compete for attention.`);
    }
  }

  if (minors.length >= 5) {
    (Object.keys(sc) as (keyof typeof SUITS)[])
      .filter((k) => !sc[k])
      .slice(0, 2)
      .forEach((k) => paras.push(`No ${SUITS[k].name} appear, which can mean ${SUITS[k].absent}.`));
  }

  if (T.elements && n >= 4) {
    const me = (Object.keys(ec) as Element[]).sort((a, b) => ec[b] - ec[a])[0];
    const dupOfSuit = dom.length === 1 && SUITS[dom[0]].el === me;

    if (ec[me] >= 3 && ec[me] / n >= 0.4 && !dupOfSuit) {
      paras.push(`${me} energy runs strong (${ec[me]} of ${n} cards): ${EL_TXT[me]}.`);
    }
  }

  if (reversals && n >= 2) {
    if (!revs.length) {
      paras.push('Every card is upright, so the energy may be easier to express outwardly or act on directly.');
    } else if (revs.length / n >= 0.5) {
      paras.push(`${revs.length} of ${n} cards are reversed. Consider whether several themes are internalized, resisted, delayed, or being reconsidered.`);
    } else {
      paras.push(`Reversed: ${list(revs.map((e) => e.card.name))}. These positions may call for reflection, a different approach, or attention to less visible aspects of the situation.`);
    }
  }

  if (courts.length >= 2) {
    paras.push(`${courts.length} court cards (${list(courts.map((e) => e.card.name))}) put people, or roles you're stepping into, at the center.`);
  } else if (courts.length === 1) {
    paras.push(`${courts[0].card.name} is a court card. It may describe a person, a social dynamic, or a way of showing up.`);
  }

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
      paras.push(
        `${g.length} ${PLUR[k - 1]} (${list(g.map((e) => e.card.name))}) repeat the theme of ${T.numt[k]} across ${list(g.map((e) => SUITS[e.card.arc as keyof typeof SUITS].name))}.`,
      );
    });

  if (T.numerology) {
    const echoes: string[] = [];

    minors
      .filter((e) => !e.card.court && e.card.num)
      .forEach((e) => {
        const m = majors.find((x) => x.card.num === e.card.num);

        if (m) {
          echoes.push(
            `${e.card.name} and ${m.card.name} share the number ${e.card.num}, so ${T.numt[e.card.num!]} shows up both as an everyday matter and as a larger archetype.`,
          );
        }
      });

    echoes.slice(0, 2).forEach((t) => paras.push(t));
  }

  const plus = entries.filter((e) => tn(e) > 0).length;
  const minus = entries.filter((e) => tn(e) < 0).length;

  if (n >= 3) {
    if (plus >= minus + 2) {
      paras.push('Supportive cards outnumber challenging ones. This can point to resources or favorable conditions, even where some friction remains.');
    } else if (minus >= plus + 2) {
      paras.push('Challenging cards outnumber supportive ones. Read that as an invitation to care and honesty, not a prediction of failure.');
    } else {
      paras.push('Supportive and challenging cards are fairly balanced, suggesting that the situation has several sides and that your choices matter.');
    }
  }

  if (sp.out != null) {
    const o = entries.find((e) => e.i === sp.out);

    if (o) {
      const t = tn(o);
      const who = `The ${lc(o.pos.l)} card, ${nm(o)},`;

      paras.push(
        t > 0
          ? `${who} offers a potentially constructive direction if the current pattern continues.`
          : t < 0
            ? `${who} highlights something to handle with care. Treat it as a possibility to respond to, not a fixed verdict.`
            : `${who} leaves the direction open, emphasizing the role of context and choice.`,
      );
    }
  }

  const chips: string[] = [];

  if (majors.length) chips.push(`${majors.length} Major Arcana`);

  (Object.keys(sc) as (keyof typeof SUITS)[]).forEach((k) => {
    if (sc[k]) chips.push(`${sc[k]} ${SUITS[k].name}`);
  });

  if (courts.length) chips.push(`${courts.length} court`);
  if (reversals && revs.length) chips.push(`${revs.length} reversed`);

  const th: Record<string, Entry[]> = {};

  entries.forEach((e) => e.card.themes.forEach((t) => (th[t] ||= []).push(e)));

  let tl = Object.keys(th).sort((a, b) => th[b].length - th[a].length);
  tl = n >= 4 ? tl.filter((t) => th[t].length >= 2) : tl.slice(0, 2);
  tl = tl.slice(0, 3);

  const themes = tl.map((t) => ({
    t,
    label: TH[t].label,
    line: TH[t].line,
    q: TH[t].q,
    cards: th[t].map((e) => e.card.name),
  }));

  const idx: Record<number, Entry> = {};
  entries.forEach((e) => (idx[e.i] = e));

  let raw: [number, number, string?][];

  if (sp.links) {
    raw = sp.links;
  } else {
    raw = [];

    for (let k = 0; k < entries.length - 1; k++) {
      raw.push([entries[k].i, entries[k + 1].i]);
    }

    if (entries.length >= 3 && sp.bookend !== false) {
      raw.push([entries[0].i, entries[entries.length - 1].i]);
    }
  }

  let pairs: PairOut[] = raw
    .filter(([x, y]) => idx[x] && idx[y])
    .map(([x, y, label]) => {
      const a = idx[x];
      const b = idx[y];
      const info = pairInfo(a, b, T);
      const positionNote = `${a.pos.l} represents ${kwe(a)}, while ${b.pos.l} represents ${kwe(b)}.`;
      const contextual = cleanQuestion
        ? ` In relation to your question, consider how ${lc(kwe(a))} interacts with ${lc(kwe(b))} in the specific roles these positions represent.`
        : '';

      return {
        a,
        b,
        label,
        ...info,
        text: `${info.text} ${positionNote}${contextual}`,
      };
    });

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

      story = `The story opens with ${kwe(f)} in ${lc(f.pos.l)}`;

      if (mid.length) {
        story += `, develops through ${list(mid.map((e) => `${kwe(e)} in ${lc(e.pos.l)}`))}`;
      }

      story += `, and arrives at ${kwe(l)} in ${lc(l.pos.l)}.`;

      const firstTone = tn(f);
      const lastTone = tn(l);

      if (firstTone < 0 && lastTone > 0) {
        story += ' The movement is from challenge toward a more supportive possibility, though the middle cards show what may need to change for that shift to be available.';
      } else if (firstTone > 0 && lastTone < 0) {
        story += ' The movement becomes more challenging toward the end. Consider which early assumptions or conditions might need attention before they create further friction.';
      } else if (firstTone === lastTone) {
        story += ' The tone remains similar at both ends, so the middle cards may be especially important in explaining how the situation develops.';
      } else {
        story += ' The tone shifts along the way. Read that shift through the positions and connections rather than assuming it guarantees a particular outcome.';
      }

      if (cleanQuestion) {
        story += ` In the context of your question${lens ? ` about ${lens.label}` : ''}, focus on what the sequence reveals about the situation and where your choices could make a difference.`;
      }
    }
  }

  const sup = entries.filter((e) => tn(e) > 0);
  const chal = entries.filter((e) => tn(e) < 0);
  const at = (e: Entry) => `${nm(e)} in ${lc(e.pos.l)}`;

  const lean = sup.length
    ? `${list(sup.map(at))}. These may offer resources through ${list(sup.slice(0, 3).map((e) => kwe(e)))}.`
    : '';

  const watch = chal.length
    ? `${list(chal.map(at))}. These highlight possible friction around ${list(chal.slice(0, 3).map((e) => kwe(e)))}.`
    : '';

  const note =
    sup.length && chal.length
      ? `The main tension appears in ${chal[0].card.name} (${lc(chal[0].pos.l)}). ${sup[0].card.name} (${lc(sup[0].pos.l)}) may offer a resource for responding to it.`
      : !sup.length && !chal.length
        ? 'Every card is mixed, so this reading is more about nuance and choice than a clear yes or no.'
        : '';

  const questions: string[] = themes.slice(0, 2).map((t) => t.q);

  if (sup.length && chal.length) {
    questions.push(`What would it look like to meet ${kwe(chal[0])} with more ${kwe(sup[0])}?`);
  }

  const cp = pairs.find((p) => p.curated || p.rel === 'opposed');

  if (cp) {
    questions.push(`How could ${kwe(cp.a)} and ${kwe(cp.b)} both be true at once?`);
  }

  if (lens?.label.includes('relationships')) {
    questions.push('What do you know from direct communication and consistent actions, rather than assumptions?');
  } else if (lens?.label.includes('work')) {
    questions.push('Which part of this situation is within your control, and what practical step would help?');
  } else if (lens?.label.includes('money')) {
    questions.push('What concrete information would help you make this decision with more confidence?');
  } else if (lens?.label.includes('decision')) {
    questions.push('What value matters most to you here, and what trade-off are you willing to accept?');
  } else if (lens?.label.includes('timing')) {
    questions.push('What signs of readiness or changed circumstances would matter more than a specific date?');
  }

  questions.push('Which card surprised you most, and what does that reaction tell you?');

  return {
    chips,
    paras,
    themes,
    pairs,
    story,
    lean,
    watch,
    note,
    questions: [...new Set(questions)].slice(0, 4),
  };
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
      s:
        e.card.themes.filter((t) => F.themes.includes(t)).length +
        (F.suits?.includes(e.card.arc) ? 1 : 0) +
        (F.major && e.card.arc === 'major' ? 0.5 : 0),
    }))
    .sort((a, b) => b.s - a.s);

  const dir = scored.filter((x) => x.s >= 1).slice(0, 3);
  const rest = scored.filter((x) => !dir.includes(x));

  return {
    intro: F.intro,
    direct: dir.map((x) => x.e),
    rest:
      dir.length && rest.length
        ? `The rest sets the context: ${list(rest.map((x) => `${x.e.card.name} (${kwe(x.e)})`))}.`
        : '',
  };
}

export function readingText(
  sp: Spread,
  entries: Entry[],
  reversals: boolean,
  T: Tradition,
  question = '',
): string {
  const L: string[] = [`${sp.name} reading (${T.label})`];

  if (question) L.push(`Question: ${question}`);

  L.push('');

  entries.forEach((e) => {
    L.push(
      `${e.i + 1}. ${e.pos.l}: ${nm(e)}`,
      `   ${kwsOf(e).join(', ')}`,
      `   ${meaning(e)}`,
      '',
    );
  });

  if (entries.length >= 2) {
    const A = analyze(entries, sp, reversals, T, question);

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
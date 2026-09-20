import type { Pos, Spread } from '../types';

const P = (l: string, m: string, x: number, y: number, rot = 0, ntop = false): Pos => ({ l, m, x, y, rot, ntop });
const r2 = (n: number) => Math.round(n * 100) / 100;

export function prep(sp: Omit<Spread, 'n' | 'maxX' | 'maxY'>): Spread {
  return {
    ...sp,
    n: sp.pos.length,
    maxX: Math.max(...sp.pos.map((p) => p.x)),
    maxY: Math.max(...sp.pos.map((p) => p.y)),
  };
}

// Seven positions along an arch, opening downward.
function arch(n: number): { x: number; y: number }[] {
  const R = 2.75;
  const Ry = 2.1;
  return Array.from({ length: n }, (_, i) => {
    const th = Math.PI - (i * Math.PI) / (n - 1);
    return { x: r2(R + R * Math.cos(th)), y: r2(Ry * (1 - Math.sin(th))) };
  });
}

// Twelve positions like a clock face, starting at 12 and going clockwise.
function clock(n: number): { x: number; y: number }[] {
  return Array.from({ length: n }, (_, k) => {
    const th = (k * 2 * Math.PI) / n;
    return { x: r2(2.3 + 2.3 * Math.sin(th)), y: r2(3 - 3 * Math.cos(th)) };
  });
}

const ar = arch(7);
const ck = clock(12);
const months = [
  'Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6',
  'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12',
];

export const SPREADS: Spread[] = [
  prep({
    id: 'single',
    name: 'Single card',
    tags: ['Self'],
    blurb: 'One card for a quick answer or a theme to carry through the day.',
    best: 'Daily check-ins and simple questions.',
    steps: [
      'Settle on a question or intention, such as "What do I most need to know today?"',
      'Shuffle until it feels finished, then cut the deck once.',
      'Turn over the top card and set it in front of you.',
      'Read the card on its own, then ask how its message applies to your question.',
    ],
    tip: 'In a one-card draw, a reversed card often points to what is blocking the message rather than the message itself.',
    pos: [P('The card', 'Your answer, theme or advice for the question.', 0, 0)],
  }),
  prep({
    id: 'ppf',
    name: 'Past, present, future',
    tags: ['Big picture'],
    seq: true,
    out: 2,
    blurb: 'A classic timeline showing how you got here and where you are headed.',
    best: 'Understanding how a situation developed.',
    steps: [
      'Name the situation you want to understand.',
      'Shuffle and cut, then deal three cards face up from left to right.',
      'Read them in order: past, present, future.',
      'Look at the three together. What thread connects them?',
    ],
    tip: 'The future card shows a direction, not a fixed fate. Ask what would change it.',
    pos: [
      P('Past', 'What has shaped this situation.', 0, 0),
      P('Present', 'Where things stand right now.', 1, 0),
      P('Future', 'Where things are heading if nothing changes.', 2, 0),
    ],
  }),
  prep({
    id: 'sao',
    name: 'Situation, action, outcome',
    tags: ['Decisions', 'Work'],
    seq: true,
    out: 2,
    blurb: 'A practical read: what is happening, what to do, and where that leads.',
    best: 'Everyday decisions and problem-solving.',
    steps: [
      'Describe the situation in one sentence.',
      'Shuffle, cut, and deal three cards left to right.',
      'Read the situation first, then the action card as advice, then the outcome as where that advice tends to lead.',
    ],
    tip: 'If the action card feels hard, look at the outcome card before deciding whether it is worth it.',
    pos: [
      P('Situation', "What's happening.", 0, 0),
      P('Action', 'What you can do or need to do.', 1, 0),
      P('Outcome', 'Where that action tends to lead.', 2, 0),
    ],
  }),
  prep({
    id: 'mbs',
    name: 'Mind, body, spirit',
    tags: ['Self'],
    blurb: 'A whole-self check-in across thought, physical energy and inner life.',
    best: 'Self-reflection and finding what is out of balance.',
    steps: [
      'Take a moment to check in with your thoughts, your body and your inner sense.',
      'Shuffle, cut, and deal three cards left to right.',
      'Read each card for its area, then compare. Which one is out of step with the others?',
    ],
    tip: 'This is for reflection, not diagnosis. It cannot replace medical or mental health advice.',
    pos: [
      P('Mind', 'Thoughts, beliefs and mental state.', 0, 0),
      P('Body', 'Physical energy, health habits and daily life.', 1, 0),
      P('Spirit', 'Inner life, meaning and intuition.', 2, 0),
    ],
  }),
  prep({
    id: 'twopaths',
    name: 'Two paths',
    tags: ['Decisions'],
    links: [[0, 1, 'where you stand and path A'], [0, 2, 'where you stand and path B'], [1, 2, 'the two paths side by side'], [3, 4, 'the unseen factor and the guidance']],
    blurb: 'Compare two options side by side, plus what you might be missing.',
    best: 'Either-or decisions.',
    steps: [
      'Write down both options as clearly as you can. Call them A and B.',
      'Shuffle and cut. Place the first card at the top center for where you stand.',
      'Deal Path A to the left and Path B to the right.',
      'Place the unseen factor between them and the guidance card below.',
      'Compare A and B side by side before reading the guidance.',
    ],
    tip: 'Neither path is right or wrong. Look at what each asks of you and which challenge you are more willing to take on.',
    pos: [
      P('Where you stand', 'The energy you bring to this decision.', 1.5, 0),
      P('Path A', 'What choosing option A tends to bring.', 0, 1.15),
      P('Path B', 'What choosing option B tends to bring.', 3, 1.15),
      P("What's unseen", 'A factor you may be missing or underestimating.', 1.5, 1.15),
      P('Guidance', 'The stance that serves you best, whichever you pick.', 1.5, 2.3),
    ],
  }),
  prep({
    id: 'relationship',
    name: 'Relationship',
    tags: ['Love'],
    out: 4,
    links: [[0, 1, 'you and them'], [0, 2, 'you and the connection'], [1, 2, 'them and the connection'], [3, 4, 'the challenge and the potential']],
    blurb: 'Look at both sides of a bond and what is between them.',
    best: 'Romantic, family, friend or work relationships.',
    steps: [
      "Decide which relationship you're looking at. It can be romantic, family, friendship or work.",
      'Shuffle and cut. Deal the You card on the left, the Them card on the right, and the Connection card between them, slightly lower.',
      'Deal Challenge and Potential in a row beneath.',
      'Read You and Them first, then the Connection, then the last two as guidance.',
    ],
    tip: 'The Them card shows how their energy appears in the dynamic, not what they are thinking.',
    pos: [
      P('You', "How you're showing up.", 0, 0),
      P('Them', 'How they are showing up, or the other side of the dynamic.', 2, 0),
      P('Connection', "The nature of what's between you.", 1, 0.6),
      P('Challenge', 'What needs care or honesty.', 0.5, 1.75),
      P('Potential', 'Where this can go with attention.', 1.5, 1.75),
    ],
  }),
  prep({
    id: 'career',
    name: 'Career path',
    tags: ['Work', 'Decisions'],
    seq: true,
    blurb: 'A five-step path from where you stand to your next move.',
    best: 'Job changes, projects and professional direction.',
    steps: [
      'Pick the specific job or decision, not "my whole career".',
      'Shuffle, cut, and deal five cards in a row.',
      'Read left to right as a path from where you are to the next step.',
    ],
    tip: 'If the obstacle card is heavy, read the opportunity card next to it for a way around.',
    pos: [
      P('Where you are', 'Your current work energy.', 0, 0),
      P('What you bring', 'Strengths and resources.', 1, 0),
      P("What's in the way", 'An obstacle or blind spot.', 2, 0),
      P('Opportunity', "What's available or emerging.", 3, 0),
      P('Next step', 'The most useful move now.', 4, 0),
    ],
  }),
  prep({
    id: 'horseshoe',
    name: 'Horseshoe',
    tags: ['Big picture', 'Decisions'],
    seq: true,
    out: 6,
    blurb: 'A seven-card arch that adds hidden influences and outside factors.',
    best: 'Situations that need more detail than three cards.',
    steps: [
      'State the question or situation.',
      'Shuffle, cut, and deal seven cards left to right in an arch, opening downward.',
      'Read the cards in order along the arch, from past on the left to outcome on the right.',
      'Give extra attention to the top of the arch, where the obstacles sit.',
    ],
    tip: 'The card at the top of the arch, Obstacles, often holds the key to the whole reading.',
    pos: [
      P('Past', 'What has led up to this.', ar[0].x, ar[0].y),
      P('Present', 'Where things stand now.', ar[1].x, ar[1].y),
      P('Hidden influences', 'What is working beneath the surface.', ar[2].x, ar[2].y),
      P('Obstacles', 'What stands in the way.', ar[3].x, ar[3].y),
      P('Other people', 'How others and the environment affect this.', ar[4].x, ar[4].y),
      P('Advice', 'The approach that helps most.', ar[5].x, ar[5].y),
      P('Likely outcome', 'Where this heads if you follow the advice.', ar[6].x, ar[6].y),
    ],
  }),
  prep({
    id: 'celtic',
    name: 'Celtic Cross',
    tags: ['Big picture'],
    out: 9,
    story: [3, 0, 5, 9],
    links: [
      [0, 1, 'the heart and what crosses it'],
      [2, 4, 'foundation and crown: root and aim'],
      [3, 5, 'recent past and near future'],
      [6, 7, 'you and your surroundings'],
      [8, 9, 'hopes, fears and outcome'],
      [6, 9, 'your stance and where it leads'],
    ],
    blurb: 'The classic ten-card deep dive into a complex situation.',
    best: 'Big questions, with layers of past, present and future.',
    steps: [
      'Take a minute to frame your question. The Celtic Cross works best for situations with real depth.',
      'Shuffle and cut. Place card 1 in the center.',
      'Lay card 2 sideways across card 1. It crosses; it does not necessarily block.',
      'Deal cards 3 to 6 around them: below, left, above, right.',
      'Deal cards 7 to 10 in a column to the right, from bottom to top.',
      'Read the cross first (cards 1 to 6), then the staff (7 to 10) as the wider context and where it leads.',
    ],
    tip: 'Pair cards as you read: 3 with 5 (root and aim), 4 with 6 (past and near future), and 9 with 10 (hopes, fears and outcome).',
    pos: [
      P('The heart', 'The core of the situation right now.', 1, 1, 0, true),
      P('The crossing', 'What challenges, complicates or supports it directly.', 1, 1, 90),
      P('Foundation', 'The root or underlying basis.', 1, 2),
      P('Recent past', 'What is passing out of your life.', 0, 1),
      P('Crown', "What you're aiming for, or the best that could happen.", 1, 0),
      P('Near future', "What's coming up next.", 2, 1),
      P('You', 'Your stance and attitude toward the matter.', 3, 3),
      P('Environment', 'The people and circumstances around you.', 3, 2),
      P('Hopes and fears', 'What you want and dread, which are often tangled.', 3, 1),
      P('Outcome', 'Where things lead if the current course holds.', 3, 0),
    ],
  }),
  prep({
    id: 'year',
    name: 'Year ahead',
    tags: ['Big picture', 'Self'],
    bookend: false,
    blurb: 'A clock of twelve months plus an overall theme.',
    best: 'Birthdays, new years and long-range planning.',
    steps: [
      'Decide where the year starts. Starting with the current month works well.',
      'Shuffle and cut. Place the first card in the center as the theme of the year.',
      'Deal twelve cards in a circle like a clock, starting at 12 o\'clock and going clockwise, one for each month.',
      'Read the theme card first, then each month, and look for patterns across seasons.',
    ],
    tip: 'Notice clusters. Several Cups in a row suggests an emotional stretch; a run of Swords suggests a busy or tense one.',
    pos: [
      P('Theme of the year', 'The overall energy of the next twelve months.', 2.3, 3),
      ...months.map((m, k) => P(m, k === 0 ? 'The first month of your year, starting now.' : `Month ${k + 1} of your year.`, ck[k].x, ck[k].y)),
    ],
  }),
  prep({
    id: 'shadow',
    name: 'Shadow work',
    tags: ['Self'],
    links: [[0, 1, 'the shadow and its origin'], [0, 2, 'the shadow and how it shows up'], [0, 3, 'the shadow and what it protects'], [0, 4, 'the shadow and how to integrate it']],
    blurb: 'A gentle look at a hidden pattern and how to work with it.',
    best: 'Self-work and understanding recurring reactions.',
    steps: [
      "Choose a calm moment and a pattern, habit or reaction you'd like to understand.",
      'Shuffle and cut. Place the shadow card in the center, the origin to the left, how it shows up to the right, what it protects above, and integration below.',
      'Read slowly. Stop after any card that feels like enough.',
    ],
    tip: 'Hard cards here are information, not judgments. If a reading stirs up something heavy, pause and talk to someone you trust or a professional.',
    pos: [
      P('The shadow', "Something you avoid looking at or don't like admitting.", 1, 1),
      P('Where it began', 'The origin: an old experience, message or need.', 0, 1),
      P('How it shows up', 'How it appears in your habits and reactions today.', 2, 1),
      P('What it protects', 'The need or fear this pattern is guarding.', 1, 0),
      P('How to integrate', 'A way to work with it rather than against it.', 1, 2),
    ],
  }),
  prep({
    id: 'cozy',
    name: 'Cozy check-in',
    tags: ['Self'],
    links: [[0, 1, 'how you are and what you need'], [2, 3, 'what to set down and the comfort that replaces it'], [0, 3, 'how you are and the comfort']],
    blurb: 'Four soft questions about how you are and what would help.',
    best: 'Evenings, low-energy days and gentle self-care.',
    steps: [
      'Make tea, get comfortable, and take three slow breaths.',
      'Shuffle and cut. Deal four cards in a two-by-two square.',
      'Read left to right, top to bottom. Finish with the small comfort and try to do it today.',
    ],
    tip: 'Keep it gentle. Challenging cards here point to what needs tenderness, not what is wrong with you.',
    pos: [
      P("How I'm doing", 'An honest check-in with yourself.', 0, 0),
      P('What I need', 'What would help most right now.', 1, 0),
      P('What to set down', 'Something you can put down, even for tonight.', 0, 1),
      P('A small comfort', 'One small, doable kindness for yourself.', 1, 1),
    ],
  }),
];

export function freeSpread(n: number): Spread {
  const pos: Pos[] = [];
  for (let i = 0; i < n; i++) pos.push(P(`Card ${i + 1}`, `Position ${i + 1} in your layout.`, i % 5, Math.floor(i / 5)));
  return prep({
    id: 'free',
    name: 'Open layout',
    tags: [],
    seq: true,
    blurb: 'Any number of cards, in the order you laid them.',
    best: 'Spreads not listed here.',
    steps: [],
    tip: '',
    pos,
  });
}

export function getSpread(id: string, free: number): Spread {
  if (id === 'free') return freeSpread(free);
  return SPREADS.find((s) => s.id === id) ?? SPREADS[1];
}

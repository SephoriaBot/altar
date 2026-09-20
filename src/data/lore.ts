import type { Arc, Element } from '../types';

export const SUITS: Record<Exclude<Arc, 'major'>, { name: string; el: Element; domain: string; absent: string; syn: string }> = {
  wands: { name: 'Wands', el: 'Fire', domain: 'drive, passion and creative work', absent: 'little spark or drive is showing up right now', syn: 'wand batons staves rods' },
  cups: { name: 'Cups', el: 'Water', domain: 'emotion, intuition and relationships', absent: 'feelings and relationships are sitting in the background', syn: 'cup chalices chalice' },
  swords: { name: 'Swords', el: 'Air', domain: 'thought, communication and conflict', absent: 'few sharp conflicts, or that the thinking still needs doing', syn: 'sword blades' },
  pents: { name: 'Pentacles', el: 'Earth', domain: 'money, body, work and home', absent: 'practical matters may be getting overlooked', syn: 'pentacle coins coin disks discs pents' },
};

export const RANKS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Page', 'Knight', 'Queen', 'King'];
export const RANK_SHORT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'P', 'Kn', 'Q', 'K'];
export const PLUR = ['Aces', 'Twos', 'Threes', 'Fours', 'Fives', 'Sixes', 'Sevens', 'Eights', 'Nines', 'Tens'];
export const ROMAN = ['0', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];

export const NUMT: Record<number, string> = {
  1: 'new beginnings and potential',
  2: 'balance, choice and partnership',
  3: 'growth and collaboration',
  4: 'stability and structure',
  5: 'conflict, change and loss',
  6: 'harmony and transition',
  7: 'reflection and testing',
  8: 'movement and mastery',
  9: 'near-completion and reserves',
  10: 'culmination and overflow',
};

export const COURT: Record<string, string> = {
  Page: 'a messenger, student or fresh approach',
  Knight: 'action and pursuit',
  Queen: 'inner mastery and care',
  King: 'outer mastery and authority',
};

export const EL_TXT: Record<Element, string> = {
  Fire: 'action, will and passion',
  Water: 'feeling, intuition and connection',
  Air: 'thought, words and decisions',
  Earth: 'practical, physical and material concerns',
};

export const TH: Record<string, { label: string; line: string; q: string }> = {
  love: { label: 'Love and connection', line: 'Relationships and emotional bonds are a recurring thread.', q: 'Where do you feel most connected right now, and where are you holding back?' },
  work: { label: 'Work and effort', line: 'Your work, roles and responsibilities keep surfacing.', q: 'What part of your work energizes you, and what part drains you?' },
  money: { label: 'Money and resources', line: 'Material security and resources are in play.', q: 'What would a healthier relationship with money or resources look like?' },
  change: { label: 'Change', line: 'Change is a strong current running through the reading.', q: "What change is already underway that you haven't fully acknowledged?" },
  conflict: { label: 'Conflict and tension', line: 'Friction or competing forces appear more than once.', q: 'Where is tension asking to be addressed rather than avoided?' },
  healing: { label: 'Healing and recovery', line: 'Recovery, care and restoration are themes.', q: 'What would help you feel cared for this week?' },
  growth: { label: 'Growth', line: 'Growth and learning are threaded through the cards.', q: "What are you learning that you didn't expect to?" },
  choice: { label: 'Choices', line: 'A decision or fork is implied.', q: "What choice would you make if you weren't afraid of getting it wrong?" },
  endings: { label: 'Endings and closure', line: 'Something is finishing or asking to be closed.', q: 'What is ready to be finished, and what is holding you back from finishing it?' },
  beginnings: { label: 'New beginnings', line: 'Fresh starts and early stages show up.', q: 'What are you ready to begin, even imperfectly?' },
  rest: { label: 'Rest and pause', line: 'Rest, pause and retreat are called for.', q: 'What are you pushing through that would benefit from a pause?' },
  mind: { label: 'Thought and perception', line: 'Thinking, beliefs and perspective shape the situation.', q: 'Which story you tell yourself about this might be worth questioning?' },
  spirit: { label: 'Inner life and intuition', line: 'Intuition and inner meaning are speaking loudly.', q: 'What is your intuition saying that your reasoning keeps overriding?' },
  creativity: { label: 'Creativity', line: 'Creative energy and self-expression are present.', q: 'What would you make if nobody was going to judge it?' },
  home: { label: 'Home and belonging', line: 'Home, family and belonging are in the picture.', q: 'Where do you feel at home, and what would make that feeling stronger?' },
  ambition: { label: 'Drive and ambition', line: 'Ambition and forward momentum are prominent.', q: 'What goal is worth your energy, and which one is just habit?' },
  shadow: { label: 'Shadow and hidden patterns', line: 'Hidden patterns or avoided truths are surfacing.', q: "What pattern keeps returning that you'd rather not look at directly?" },
  communication: { label: 'Communication', line: 'Messages, words and how you express yourself matter here.', q: 'What needs to be said, and who needs to hear it?' },
};

export interface FocusDef {
  label: string;
  themes: string[];
  suits?: string[];
  major?: boolean;
  intro: string;
}

export const FOCUS: Record<string, FocusDef> = {
  general: { label: 'General', themes: [], intro: '' },
  love: { label: 'Love', themes: ['love', 'home', 'healing'], suits: ['cups'], intro: 'Reading for love: these cards speak most directly to relationships and emotional life.' },
  work: { label: 'Work', themes: ['work', 'ambition', 'creativity'], suits: ['wands', 'pents'], intro: 'Reading for work: these cards speak most directly to career, effort and ambition.' },
  money: { label: 'Money', themes: ['money'], suits: ['pents'], intro: 'Reading for money: these cards speak most directly to resources and security.' },
  inner: { label: 'Inner life', themes: ['spirit', 'shadow', 'healing', 'growth', 'mind'], major: true, intro: 'Reading for your inner life: these cards speak most directly to intuition, patterns and growth.' },
};

// Classic pairings. Keys are the card short names (leading "The" removed).
export const PAIRS: [string, string, string][] = [
  ['Fool', 'Magician', 'Raw spark meets real skill: a fresh start you have the tools to pursue.'],
  ['Fool', 'Death', 'Leaving something behind for the unknown. A clean break makes the leap possible.'],
  ['Fool', 'Tower', 'A sudden shake-up forces a restart. It feels abrupt, but it frees you to begin again.'],
  ['Magician', 'High Priestess', 'Will and intuition working together: act on what you sense and know.'],
  ['High Priestess', 'Moon', 'Deep intuition and dreamlike uncertainty. Trust your feelings, but verify what is hidden.'],
  ['High Priestess', 'Hermit', 'Solitary, inward wisdom. The answer is found by going quiet, not by asking around.'],
  ['Empress', 'Emperor', 'Nurture and structure in partnership. Stable, well-tended foundations.'],
  ['Lovers', 'Devil', 'Attraction that may hold a hook. Ask whether the bond is a free choice or a compulsion.'],
  ['Lovers', 'Two of Cups', 'A mutual, chosen connection with real alignment behind it.'],
  ['Hierophant', 'Lovers', 'Commitment inside shared values: vows, tradition, or a bond meant to be formal.'],
  ['Chariot', 'Strength', 'Determination joined with composure. You win by steadiness, not force.'],
  ['Hermit', 'Hanged Man', 'A deliberate pause and retreat. Waiting and reflecting is the work right now.'],
  ['Wheel of Fortune', 'Death', "A big turning point as one cycle closes. Change is arriving whether or not you're ready."],
  ['Justice', 'Judgement', 'A reckoning. Consequences land and clarity follows, so review honestly.'],
  ['Death', 'Tower', 'Major upheaval. Something has to end, and resisting it will cost more than allowing it.'],
  ['Death', 'Sun', 'An ending that leads into renewed joy. What falls away makes room for light.'],
  ['Tower', 'Star', 'Healing after collapse. Hope returns once the dust settles.'],
  ['Star', 'Moon', 'Hope in the midst of uncertainty. Keep faith while the picture stays unclear.'],
  ['Moon', 'Sun', 'Fear giving way to clarity, like dawn after a confusing stretch.'],
  ['Sun', 'World', 'Completion with joy. Success is recognized and worth celebrating.'],
  ['Devil', 'Tower', "A trap breaking apart. Liberation may feel sudden and uncomfortable, but it's real."],
  ['Temperance', 'Devil', 'Moderation against excess. Notice which one is steering.'],
  ['Judgement', 'World', "A calling answered and a cycle completed. You're ready to close a chapter."],
  ['Hanged Man', 'Two of Swords', 'Suspended in indecision. The pause is asking you to face what you are avoiding.'],
  ['Two of Swords', 'Moon', "A stalemate fed by incomplete information. Don't decide from fear or fog."],
  ['Nine of Swords', 'Moon', 'Night-time anxiety amplified by imagination. Ground yourself and tell someone.'],
  ['Three of Swords', 'Ten of Swords', 'Heartbreak at its lowest point. When this pair appears, the worst is passing.'],
  ['Four of Swords', 'Hermit', 'Rest and solitude are needed. Retreat to recover before acting.'],
  ['Three of Cups', 'Ten of Cups', 'Joy in community and family. Shared happiness that lasts.'],
  ['Ace of Cups', 'Page of Cups', 'A tender new emotional message or creative idea arrives.'],
  ['Ace of Wands', 'Ace of Swords', 'An inspired idea with the clarity to pursue it. A strong start for a project.'],
  ['Ace of Pentacles', 'Ace of Wands', 'Opportunity meets drive. A promising venture with practical backing.'],
  ['Eight of Pentacles', 'Magician', 'Mastery through practice. Skill becomes results.'],
  ['Five of Pentacles', 'Ten of Pentacles', 'Hardship with security within reach. Help or stability is closer than it looks.'],
  ['Knight of Swords', 'Chariot', 'Fast momentum. Great for decisive action, if you keep control of the pace.'],
  ['Ten of Wands', 'Four of Swords', 'Overloaded and in need of a break. Put something down and rest.'],
];

export const BASICS = [
  'Ask an open question, like "What do I need to understand about this?" Yes-or-no questions give thin readings.',
  'Shuffle however feels natural, cut the deck, and deal in the order shown by the numbers.',
  'Read each card on its own first. Then look at neighbors: shared suits, repeated numbers, and elements that support or oppose each other.',
  'Treat difficult cards as information about what needs attention, not as fixed outcomes.',
];

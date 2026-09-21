// Marseille tradition: the same 78 cards (same ids), read the Marseille way.
//
// What is different from the Rider-Waite data in cards.ts and lore.ts:
//  - Names and numbering follow the Marseille deck (La Force is XI, La Justice is VIII).
//  - Number cards have no scenes. They are read by number and suit, and each one
//    echoes the major arcanum with the same number (Five of Coins and Le Pape).
//  - No elements, no astrology, no reversals. Those belong to later traditions.
//  - Each card carries a "look" note: what to notice in the picture.
//
// Card ids match cards.ts, so saved readings work in either tradition. Pairings are
// keyed by the Rider-Waite short name (`key`), the one name every tradition shares.

import type { Arc, Card, SuitDef } from '../types';
import { CARDS as BASE } from './cards';

type Suit = Exclude<Arc, 'major'>;

export const M_SUITS: Record<Suit, SuitDef> = {
  wands: {
    name: 'Batons',
    el: 'Fire',
    domain: 'energy, growth and work done in the world',
    absent: 'little drive or practical effort is showing up right now',
    syn: 'baton batons staff staves wand wands rods clubs',
    look: 'Batons are drawn as rough staves that cross and curve.',
  },
  cups: {
    name: 'Cups',
    el: 'Water',
    domain: 'feeling, love and the life of the heart',
    absent: 'the heart is sitting in the background',
    syn: 'cup cups chalice chalices coupes hearts',
    look: 'Cups are drawn as ornate goblets.',
  },
  swords: {
    name: 'Swords',
    el: 'Air',
    domain: 'thought, decision and conflict',
    absent: 'few sharp decisions or conflicts, or that the thinking still needs doing',
    syn: 'sword swords blades epees spades',
    look: 'Swords are drawn as curved blades that cross and interlace.',
  },
  pents: {
    name: 'Coins',
    el: 'Earth',
    domain: 'money, trade and the material world',
    absent: 'practical and material matters may be getting overlooked',
    syn: 'coin coins deniers denier pentacle pentacles disks discs diamonds',
    look: 'Coins are drawn as discs with flowers or rays at the center.',
  },
};

export const M_RANKS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Valet', 'Knight', 'Queen', 'King'];

export const M_NUMT: Record<number, string> = {
  1: 'origin and pure potential',
  2: 'duality, relationship and choice',
  3: 'creation and the first fruit',
  4: 'structure, foundation and the material world',
  5: 'learning, tradition and crisis at the human center',
  6: 'choice, harmony and the crossroads',
  7: 'movement, will and victory',
  8: 'balance, justice and consolidation',
  9: 'solitude, wisdom and inner search',
  10: 'completion and the turning of the cycle',
};

export const M_COURT: Record<string, string> = {
  Valet: 'a young messenger, student or beginner',
  Knight: 'movement, a traveler, action underway',
  Queen: 'mature, receptive mastery that holds and cultivates',
  King: 'mature, active authority that directs and decides',
};

const NUM_LOOK: Record<number, string> = {
  1: 'A single large emblem, usually alone in the center.',
  2: 'Two emblems, usually mirrored or crossing.',
  3: 'Three emblems, usually in a row or a triangle.',
  4: 'Four emblems, usually one at each corner.',
  5: 'Usually four at the corners and one in the center: the fifth is the heart of the card.',
  6: 'Six emblems, usually in two groups of three.',
  7: 'Seven emblems, usually six with one set apart.',
  8: 'Eight emblems, usually in two mirrored columns.',
  9: 'Nine emblems, usually one short of a full ten.',
  10: 'Ten emblems, usually filling the whole card.',
};

const COURT_LOOK: Record<string, string> = {
  Valet: 'A young figure holding the suit emblem. Where does he look?',
  Knight: 'A rider with the suit emblem. Which way is the horse heading?',
  Queen: 'A crowned woman with the suit emblem. What does she hold, and where does her gaze go?',
  King: 'A crowned man with the suit emblem. What does he hold, and where does his gaze go?',
};

const tone = (c: string) => (c === '+' ? 1 : c === '-' ? -1 : 0);
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const tokens = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);

// ---- Major arcana -----------------------------------------------------------------
// Fields: name | short | numeral | number | Rider-Waite name | keywords | meaning | look | themes | tone
const MAJORS = `Le Mat|Le Mat|–|0|The Fool|wandering,freedom,folly,leaving without a map|A traveler with no number and no fixed place. Move on without a full plan and carry only what you need, but notice what follows at your heels, since it decides how free you really are.|He walks with a stick and a bundle, his clothes torn, and an animal bites or pulls at his leg. Is he leaving something, or is something chasing him?|beginnings,change,spirit|0
Le Bateleur|Le Bateleur|I|1|The Magician|skill,initiative,a new start,showmanship|A beginning with everything laid out on the table. Your talents and tools are within reach. The question is whether you pick one and commit, or keep performing the possibilities. Beware smooth talk, your own included.|A young man behind a table covered with small objects, a wand in one hand, under a wide curved hat brim. What has he picked up, and what is he leaving on the table?|beginnings,creativity,work|+
La Papesse|La Papesse|II|2|The High Priestess|knowledge,silence,study,discretion|Knowledge held quietly. She keeps her book open on her lap and says nothing. Something is still to be studied and understood before it is spoken. Patience and discretion serve you now.|A crowned, veiled woman seated with an open book on her lap. What is written in it, and why does she keep it to herself?|spirit,mind,rest|0
L'Impératrice|L'Impératrice|III|3|The Empress|creation,abundance,worldly authority,fertility|Something is being brought into the world. Creative and practical work grows when authority is used with warmth rather than force.|A crowned woman seated with a scepter and a shield showing an eagle. What does she rule, and how comfortable does she look?|creativity,home,growth|+
L'Empereur|L'Empereur|IV|4|The Emperor|structure,authority,foundation,stability|The frame that holds things in place: rules, resources and a firm seat. Build steadily and lead from stable ground, and remember that power hardens when it stops listening.|Usually drawn in profile, crowned, with crossed legs, a scepter and an eagle shield. He is turned to the side rather than facing us.|work,ambition,money|+
Le Pape|Le Pape|V|5|The Hierophant|teaching,tradition,faith,guidance|A teacher or institution passes on what was handed down. Seek counsel, join a tradition or become the one who teaches, and ask whether the rules you receive actually serve you.|A robed figure in a triple crown blesses two kneeling figures below him, with two pillars behind. Who is being taught, and what does the pupils' posture say?|spirit,growth,communication|+
L'Amoureux|L'Amoureux|VI|6|The Lovers|choice,attraction,the crossroads,commitment|A man stands between two women and has to choose while Cupid aims from above. This is about choosing between paths, not only about romance, and the choice shows who you are.|A young man between two women, with Cupid drawing a bow above them. Where is he looking, and does he seem to have decided?|love,choice|0
Le Chariot|Le Chariot|VII|7|The Chariot|victory,will,movement,self-command|Progress under your own steering. No reins are visible, so direction comes from will and balance. Keep the two horses working together and you advance.|A crowned man standing under a canopy in a cart drawn by two horses, with no reins in sight. Are the horses pulling the same way?|ambition,work,change|+
La Force|La Force|XI|11|Strength|gentle strength,courage,patience,mastery of instinct|Strength without violence: a woman opens or closes a lion's jaws with calm hands. Meet what frightens you with steadiness and tenderness rather than force. In Marseille order this card is XI, not VIII.|A woman in a broad-brimmed hat holds a lion's jaws, opening or closing them. Her face is calm, and so is the lion's.|growth,healing,spirit|+
L'Hermite|L'Hermite|IX|9|The Hermit|solitude,prudence,searching,guidance|Step back and take your time. You carry a small light, enough to show the next few steps. Wisdom comes from patient searching.|An old man in a hooded cloak with a lantern and a staff. How much of the way does his light actually show?|rest,spirit,mind|0
La Roue de Fortune|La Roue de Fortune|X|10|Wheel of Fortune|cycles,luck,turning point,destiny|What rises will fall and turn again. The wheel does not care who is on top, so ride the turn instead of fighting it.|A wheel turned by a crank, with creatures climbing on one side, falling on the other and one enthroned on top. Where are you on it?|change,endings,beginnings|0
La Justice|La Justice|VIII|8|Justice|balance,fairness,decision,consequence|Weigh things fairly and cut cleanly. A decision or judgment is due, and it rests on what is true rather than what is convenient. In Marseille order this card is VIII, not XI.|A crowned woman seated and facing forward, holding scales in one hand and an upright sword in the other. What is on the scales?|choice,conflict,mind|0
Le Pendu|Le Pendu|XII|12|The Hanged Man|suspension,sacrifice,a new viewpoint,surrender|Hanging still, you see things the other way up. A pause, a sacrifice or a change of view is required. The hands are bound but the head stays calm.|A man hangs by one foot from a wooden frame, hands tied behind him so that arms and head make a triangle. His face is composed.|rest,spirit,change|0
L'Arcane sans nom|Sans nom|XIII|13|Death|ending,clearing,transformation,harvest|The scythe clears the ground. Something has to end for anything new to grow, and the cards around it show what. This card names no one and does not foretell a literal death.|A skeleton mows a field with a scythe. Hands, feet and heads lie in the turned earth, with shoots among them. In most decks the card has no printed name.|endings,change|-
Tempérance|Tempérance|XIV|14|Temperance|flow,moderation,healing,exchange|Pouring from one vessel into another without spilling: balance through steady exchange. Blend, adjust, and let time do the healing.|A winged figure pours liquid between two vessels. Follow the stream: which way does it run?|healing,rest,growth|+
Le Diable|Le Diable|XV|15|The Devil|attachment,instinct,temptation,being bound|Desire and fear hold you by a cord, but the cords are loose. See what you are attached to, and notice how small the two figures at his feet are.|A winged, horned figure stands on a pedestal above two smaller horned figures tied to it by cords.|shadow,money,love|-
La Maison Dieu|La Maison Dieu|XVI|16|The Tower|sudden change,collapse,revelation,release|The tower is struck and what was built on a false footing comes down. It is a shock and a clearing: what falls was not going to hold. The name means House of God.|A tower struck by lightning, its top knocked off, with two figures falling and stones scattering around it.|change,endings,shadow|-
L'Étoile|L'Étoile|XVII|17|The Star|hope,openness,renewal,giving|Open and unguarded, she pours water back to the earth and the pool. Give freely and trust that renewal follows: hope after upheaval.|A kneeling, unclothed woman pours from two jugs, one onto land and one into water, beneath a large star ringed by smaller ones.|healing,spirit,beginnings|+
La Lune|La Lune|XVIII|18|The Moon|intuition,illusion,instinct,night|By moonlight everything looks uncertain. Dreams, instincts and worries rise. Travel carefully, and do not confuse the reflection with the thing itself.|A moon with a face and falling drops, two towers, two dogs howling and a crayfish crawling out of a pool in front.|spirit,shadow,mind|0
Le Soleil|Le Soleil|XIX|19|The Sun|clarity,joy,success,warmth|Warmth, honesty and open success. Two young figures stand together under a bright sun, and things are out in the open and going well.|A sun with a face and long rays shines on two children, or a young pair, before a low wall. Do they touch?|growth,love,home|+
Le Jugement|Le Jugement|XX|20|Judgement|awakening,calling,renewal,answering a summons|A trumpet sounds and figures rise. It is a call to wake up, to answer and to be counted, and what you have been through becomes a new life.|An angel blows a trumpet above three figures rising from the ground.|endings,beginnings,spirit|+
Le Monde|Le Monde|XXI|21|The World|completion,fulfillment,integration,the whole world|The work is complete and you stand in the middle of it. A dancer moves within a wreath, ringed by four living creatures: wholeness, arrival, and the start of a larger cycle.|A dancing figure inside an oval wreath, with an angel, an eagle, a lion and a bull in the four corners.|endings,growth,spirit|+`;

// ---- Minor arcana -----------------------------------------------------------------
// Ten number cards then Valet, Knight, Queen, King per suit.
// Fields: keywords | meaning | themes | tone
const MINOR: Record<Suit, string> = {
  wands: `a seed of energy,a new project,vitality,initiative|A fresh surge of energy and a project ready to start. The staff is raw and still growing. Plant it and it will take root.|beginnings,creativity,ambition|+
two efforts,partnership in action,planning,a choice of direction|Two staves cross: two efforts, two people or two ways to proceed. Plan together, or decide which direction gets your energy.|choice,work|0
growth,first results,expansion,teamwork|The first shoots. What you started has form and can be shared. Look for who to work with and what to let grow.|growth,work,creativity|+
foundation,a stable base,a workplace or home,order|A solid base for work: a place, a routine or a structure to build on. Secure it before you expand.|home,work|+
friction,competing efforts,a trial,restless energy|Many hands pull toward the middle and energy has no clear direction, so there is struggle. Look for what sits at the center instead of fighting over the edges.|conflict,work,change|-
harmony of forces,a choice for growth,recognition,steady progress|Two groups of three in balance: a decision to put your energy where it can flourish. Progress is steady and harmonious.|growth,choice,work|+
drive,victory through will,defending your ground,moving ahead|Energy committed to a goal. You push forward and hold your ground, and success comes through determined action.|ambition,conflict,work|+
orderly momentum,coordination,mastery,many tasks in motion|A lot of energy arranged in a pattern: many tasks in motion and working together. Keep the rhythm and the system going.|work,ambition|+
endurance,solitary effort,stored strength,the end of a labor|Nearly at the end of a long effort, working mostly alone. Gather what you have left and finish what you started.|work,rest|0
harvest,a full load,culmination,overwork|The harvest is heavy. Success and responsibility arrive together. Complete the cycle, and notice whether you are carrying too much.|work,endings|0
an eager messenger,a new venture,apprenticeship,curiosity|A young, energetic person, or news of a new venture. Enthusiasm needs to be trained into skill.|beginnings,communication,work|+
action,travel,enthusiasm,a change of direction|Energy on the move: someone arriving or leaving, or a decision to go after something. Speed helps only if it has a target.|ambition,change|+
warmth,creativity,confidence,cultivated energy|Mature, receptive energy that keeps things growing: a warm, capable person who nurtures a project.|creativity,work,home|+
leadership,enterprise,vision,authority in action|An experienced leader or a mature venture: a person of vision who directs work with authority.|work,ambition|+`,
  cups: `the heart's source,love,spirit,a gift|A cup that overflows: an offering of love, faith or creativity. Something is given from the heart, so receive it.|love,spirit,beginnings|+
attraction,union,exchange of feeling,a bond|Two cups face each other: a meeting, an exchange, a friendship or a love. Notice whether it is mutual.|love,choice|+
celebration,friendship,shared feeling,community|Feeling multiplies when it is shared. A gathering, a celebration or the joy of a group. It can also mean a triangle in a relationship.|love,creativity,home|+
emotional stability,comfort,routine,holding on to feeling|A stable emotional base: a settled home or a long relationship. Beware getting so comfortable that feeling stops moving.|home,love,rest|0
feelings at the center,an emotional test,vulnerability,the heart in question|Feelings are stirred up and pulled in several directions. Something is being tested in the heart, so ask what sits at its center.|love,change,shadow|0
a choice from the heart,harmony,sharing,an old bond|A choice made from feeling, or feelings brought into balance. Affection is given and returned, and it may point to family or old bonds.|love,choice,home|+
devotion,a leap of faith,a triumph of the heart,feeling in motion|Feeling in motion: devotion, a leap of faith or a win for the heart. Follow what you love and keep your feet on the ground.|love,spirit,ambition|+
feelings weighed fairly,forgiveness,peace,order in the heart|Feelings weighed fairly and brought into order. It is time to settle emotional accounts, forgive or make peace.|healing,love|+
contentment,a wish fulfilled,inner fullness,gratitude|Nearly full: satisfaction and gratitude gathered over time, with a quiet look inward. Enough is enough.|healing,love,rest|+
lasting happiness,family,feeling complete,a full circle|The cups are full: emotional fulfillment, a happy household, or a bond that has completed a cycle.|love,home|+
a tender messenger,new feelings,sensitivity,an invitation|A young or gentle person, or a message from the heart. A feeling wants to be expressed.|love,communication,beginnings|+
romance,an offer,following a feeling,an approach|Feeling in motion: an invitation, a romantic approach, or someone acting from the heart.|love,change|+
compassion,intuition,receptivity,emotional depth|A caring, perceptive person, or your own inner listening. She holds feelings without spilling them.|love,healing,spirit|+
emotional maturity,generosity,counsel,composure|An emotionally mature person who leads with generosity and steadiness: someone to consult, or to become.|love,healing,work|+`,
  swords: `clarity,a decision,a clean cut,truth|A clear, sharp beginning: a decision, insight or truth that cuts through confusion. Use it with care, because it cuts both ways.|mind,beginnings,communication|+
stalemate,two views,a hard choice,a standoff|Two blades cross and hold each other. Two minds or two options are in balance, and nothing moves until one gives way or a third path appears.|choice,conflict,mind|0
wounded feelings,a painful truth,a triangle,words that hurt|A sharp truth that hurts: sorrow, jealousy or three-way tension. What is cut open can also be healed.|love,conflict,healing|-
a pause,a guarded mind,defense,structured thought|Blades arranged like a fortress: a defensive position or a period of thought. Take shelter briefly, then work out the plan.|rest,mind|0
conflict,argument,competition,a sharp turning point|Sharp words or ideas collide around a central point. There is conflict, competition or a decision that cuts. Find what matters at the center.|conflict,mind,communication|-
a considered choice,negotiation,crossing to calmer ground,balanced ideas|Ideas weighed in balance. A negotiation or a reasoned choice moves you to calmer conditions.|choice,communication,change|+
strategy,fighting spirit,skill in a contest,determination|The mind engaged in action: strategy, argument and skill in a contest. Victory is possible with a clear plan.|conflict,ambition,mind|0
disciplined thinking,fair judgment,restraint,formal matters|Ordered, disciplined thinking: fair judgment, contracts or a formal process. Restraint can be wise or confining.|mind,choice|0
worry,sleepless thought,solitude,mental intensity|The mind alone with itself at night: worry, obsession or intense study. Nothing is solved until it is brought into the light.|mind,shadow,rest|-
the end of a conflict,saturation,a final cut,relief after clarity|Too many blades. A conflict has run its course, the sharp period ends, and only completion is left.|endings,conflict|-
an alert mind,a message,learning,watchfulness|A quick, curious young mind, or a message and a question: information arriving. Keep it honest.|mind,communication,beginnings|0
decisive action,argument,rapid movement,assertiveness|A fast, cutting mind in motion: someone arrives with an opinion. Move quickly, but watch the edge.|communication,ambition,conflict|0
clear judgment,independence,discernment,honesty|A sharp, unsentimental perceiver who sees through things and says so. The mind, cultivated.|mind,communication|+
authority,law,strategy,intellectual mastery|A person of judgment, such as a judge, lawyer or strategist. Decisions have to be fair and reasoned.|mind,work,choice|+`,
  pents: `a material opportunity,a gift of resources,a seed of wealth,a new asset|A concrete new resource: money, work, land or health. Hold it, plant it, and it grows.|money,beginnings,work|+
exchange,juggling resources,two sources,balance in money|Two coins: exchange, trade, or balancing two commitments. Keep the ledger straight.|money,choice,work|0
craft,first profit,building,collaboration|Work bearing fruit: a project taking material shape with skilled help. Value grows through cooperation.|work,money,creativity|+
possession,security,saving,holding tight|A firm hold on resources: safe and secure, and possibly tight-fisted. It is a foundation to build on, but question whether fear of loss is steering.|money,home|0
need,uncertainty,a practical crisis,resources at the center|Money or material security is tested. There is a hole at the center of things. Ask for help and fix the essentials first.|money,change,shadow|-
fair exchange,generosity,sharing wealth,choices about money|Resources shared in balance: giving and receiving, or a decision about where the money goes.|money,choice,love|+
patient growth,results of long work,careful investment,assessment|Time to check what has grown. Stay patient, because efforts keep paying off if you tend them.|work,money,growth|0
craft,mastery,discipline,steady accumulation|Well-ordered work and steady accumulation. Skill grows through repetition, and value builds slowly.|work,money|+
comfort,independence,a mature harvest,self-sufficiency|The fruits of long effort: the independence and material comfort you have earned. Enjoy it and stay grounded.|money,rest|+
wealth,inheritance,lasting security,family assets|The material cycle is complete: lasting security, property or family resources passed along.|money,home,endings|+
a student of practical things,a small opportunity,a careful start,learning|A learner in practical matters, or a small offer of work or money. Start small and be careful.|money,beginnings,work|+
reliability,slow progress,hard work,patient movement|Slow, dependable movement: someone or something proceeding steadily. It is not fast, but it arrives.|work,money|0
practicality,comfort,nurturing,resourcefulness|A capable keeper of home and resources, someone who turns wealth into comfort.|home,money,healing|+
prosperity,providing,business,stable authority|A successful provider or businessperson: the material world under good management.|money,work,ambition|+`,
};

// ---- Pairings ---------------------------------------------------------------------
// Keys are the Rider-Waite short names (the `key` on every card); the text uses Marseille ideas.
export const M_PAIRS: [string, string, string][] = [
  ['Fool', 'Magician', 'The wanderer meets the one at the table: a first step, and tools to make something of it.'],
  ['Fool', 'Tower', 'The traveler walks into a collapse, or out of one. What falls frees him to move on.'],
  ['Fool', 'Death', 'Leaving the old ground behind. Only what you can carry comes along.'],
  ['Magician', 'High Priestess', 'Showing and keeping silent: the one who acts beside the one who studies. Do the work, and learn the reason for it.'],
  ['High Priestess', 'Hierophant', 'Two keepers of knowledge, one private and one public. Decide what should be studied quietly and what should be taught.'],
  ['High Priestess', 'Hermit', 'Silence and searching. The answer comes by going quiet and studying, not by asking around.'],
  ['Empress', 'Emperor', 'Creation and order side by side: what is born gets a structure and someone to look after it.'],
  ['Emperor', 'Hierophant', 'Worldly power beside spiritual authority. Law, institutions and tradition set the frame.'],
  ['Hierophant', 'Lovers', 'Guidance at the crossroads: a choice made within a community, or a bond meant to be formal.'],
  ['Lovers', 'Chariot', 'After the choice, the movement. A commitment turns into action.'],
  ['Lovers', 'Devil', 'Attraction that may hold a hook. Ask whether the bond is freely chosen.'],
  ['Chariot', 'Strength', 'Drive tempered by gentleness. You advance by mastering your instincts, not by whipping them.'],
  ['Chariot', 'Justice', 'Victory and its measure. Move forward, then weigh what it cost and what it earned.'],
  ['Strength', 'Devil', 'Instinct met with tenderness, or instinct in chains. Which of the two is running things?'],
  ['Hermit', 'Hanged Man', 'Withdrawal and suspension: a deliberate pause, with time as the teacher.'],
  ['Justice', 'Hanged Man', 'A judgment held back. Balance comes from not acting on the first reaction.'],
  ['Wheel of Fortune', 'Death', 'The wheel turns and the scythe follows: a cycle is closing. Let it.'],
  ['Hanged Man', 'Death', 'Suspension before the ending. Letting go is the last step before the clearing.'],
  ['Death', 'Temperance', 'After the clearing, the slow blending. Renewal is gradual and steady.'],
  ['Death', 'Sun', 'An ending that leads into warmth. What falls away makes room for light.'],
  ['Temperance', 'Devil', 'Exchange versus fixation. Notice whether things are flowing or stuck.'],
  ['Devil', 'Tower', 'Bonds broken by force. The collapse comes where the chain was.'],
  ['Tower', 'Star', 'After the collapse, open sky. Hope returns once the dust has settled.'],
  ['Star', 'Moon', 'Hope in the dark. Keep pouring even when the way is unclear.'],
  ['Moon', 'Sun', 'Night giving way to day. Illusions dissolve in the light.'],
  ['Sun', 'Judgement', 'Joy and awakening: a call that lands warmly.'],
  ['Sun', 'World', 'Warmth and completion: a happy arrival.'],
  ['Judgement', 'World', 'The call is answered and a cycle is completed.'],
  ['Ace of Cups', 'Two of Cups', 'A gift from the heart taking the form of a bond.'],
  ['Ace of Wands', 'Ace of Pentacles', 'Energy and resources begin together: practical backing for a new effort.'],
  ['Ace of Swords', 'Justice', 'A clear cut and a fair weighing: a decision made on the truth.'],
  ['Nine of Swords', 'Moon', 'Night thoughts and night fears. Bring the worries out into daylight.'],
  ['Three of Swords', 'Ten of Swords', 'A wound, then the end of the quarrel. The sharp period is closing.'],
];

export const M_BASICS = [
  'Ask an open question, like "What do I need to understand about this?" Yes-or-no questions give thin readings.',
  'Shuffle however feels natural, cut the deck, and lay the cards in the order shown by the numbers.',
  'Look at the pictures first: the figures, what they hold, which way they look. Then check what a book says.',
  'Read each card alone, then in pairs. Cards whose figures face each other are in conversation, and cards facing away turn from one another.',
  'Let the numbers work. The number says how and the suit says where, and each number card echoes the major of the same number, from Le Bateleur (1) to La Roue de Fortune (10).',
  'Read every card upright. Most Marseille readers do not use reversals.',
];

// ---- Build the deck ---------------------------------------------------------------
const majorDefs = MAJORS.split('\n').map((ln) => ln.split('|'));
const SUIT_KEYS: Suit[] = ['wands', 'cups', 'swords', 'pents'];

const buildWords = (parts: string[], extra: string[]) => Array.from(new Set([...parts.flatMap(tokens), ...extra]));

export const M_CARDS: Card[] = BASE.map((b) => {
  if (b.arc === 'major') {
    const f = majorDefs[b.id];
    const num = Number(f[3]);
    return {
      ...b,
      name: f[0],
      short: f[1],
      alt: f[4],
      rk: f[2],
      num,
      el: 'Air',
      corr: null,
      kwU: f[5].split(','),
      kwR: [],
      up: f[6],
      rev: '',
      look: f[7],
      themes: f[8].split(','),
      tu: tone(f[9]),
      tr: 0,
      ord: num,
      words: buildWords([f[0], f[4], b.short], [String(num), f[2].toLowerCase(), 'major', 'trump', 'arcanum', 'arcane']),
    };
  }
  const suit = b.arc as Suit;
  const idxInSuit = b.id - 22 - SUIT_KEYS.indexOf(suit) * 14;
  const f = MINOR[suit].split('\n')[idxInSuit].split('|');
  const rank = M_RANKS[idxInSuit];
  const court = idxInSuit >= 10;
  const name = `${rank} of ${M_SUITS[suit].name}`;
  return {
    ...b,
    name,
    short: name,
    alt: name === b.name ? null : b.name,
    rank,
    kwU: f[0].split(','),
    kwR: [],
    up: f[1],
    rev: '',
    look: court ? COURT_LOOK[rank] : `${NUM_LOOK[b.num!]} ${M_SUITS[suit].look}`,
    themes: f[2].split(','),
    tu: tone(f[3]),
    tr: 0,
    words: buildWords([name, b.name], [...M_SUITS[suit].syn.split(' '), ...(b.num ? [String(b.num)] : []), ...(court ? ['court'] : []), ...(rank === 'Knight' ? ['cavalier'] : [])]),
  };
});

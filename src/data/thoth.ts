// Thoth tradition: the same 78 cards (same ids), read the Thoth way (Crowley / Harris).
//
// What is different from the Rider-Waite data in cards.ts and lore.ts:
//  - Names and numbering follow the Thoth deck: Adjustment is VIII, Lust is XI,
//    Art is XIV, the Aeon is XX. Court cards are Knight, Queen, Prince and Princess.
//  - Every number card has a title (Dominion, Strife, Ruin...) and a decan (Mars in Aries).
//  - Courts carry their elemental combination and zodiac span (Fire of Fire, 20° Scorpio–20° Sagittarius).
//  - Elements, astrology and elemental dignities are on. Reversals are off: the Thoth is read upright.
//
// Card ids match cards.ts, so saved readings work in every tradition. Pairings are keyed by
// the Rider-Waite short name (`key`), the one name every tradition shares.
//
// Court equivalents: Princess = Page, Prince = Knight, Queen = Queen, Knight = King.

import type { Arc, Card, Element, SuitDef } from '../types';
import { CARDS as BASE } from './cards';
import { ROMAN } from './lore';

type Suit = Exclude<Arc, 'major'>;

export const T_SUITS: Record<Suit, SuitDef> = {
  wands: { name: 'Wands', el: 'Fire', domain: 'will, energy and creative fire', absent: 'little drive or spark is showing up right now', syn: 'wand wands rods staves batons fire' },
  cups: { name: 'Cups', el: 'Water', domain: 'love, feeling and the unconscious', absent: 'feelings and relationships are sitting in the background', syn: 'cup cups chalice chalices water' },
  swords: { name: 'Swords', el: 'Air', domain: 'intellect, truth and conflict', absent: 'few sharp conflicts, or the thinking still needs doing', syn: 'sword swords blades air' },
  pents: { name: 'Disks', el: 'Earth', domain: 'matter, work, body and results', absent: 'practical matters may be getting overlooked', syn: 'disk disks disc discs coins coin pentacle pentacles pents earth' },
};

export const T_RANKS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Princess', 'Prince', 'Queen', 'Knight'];
const T_RANK_SHORT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'Ps', 'Pr', 'Q', 'Kn'];

// Numbers read as the ten sephiroth of the Tree of Life.
export const T_NUMT: Record<number, string> = {
  1: 'Kether, the crown and pure root force',
  2: 'Chokmah, wisdom and the first outward flow',
  3: 'Binah, understanding, form and limit',
  4: 'Chesed, mercy, order and consolidation',
  5: 'Geburah, severity, strain and cutting away',
  6: 'Tiphareth, beauty and balance at the center',
  7: 'Netzach, victory, desire and endurance',
  8: 'Hod, splendor, mind and method',
  9: 'Yesod, foundation and the hidden work of the unconscious',
  10: 'Malkuth, the kingdom: matter, and the end of the cycle',
};

export const T_COURT: Record<string, string> = {
  Princess: 'earth of the suit: the seed in the ground, a student, a message or a new beginning',
  Prince: 'air of the suit: an idea in charge, ambition that plans and directs',
  Queen: 'water of the suit: receptive, deep mastery that holds and shapes',
  Knight: 'fire of the suit: swift, forceful movement toward a goal',
};

const tone = (c: string) => (c === '+' ? 1 : c === '-' ? -1 : 0);
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const tokens = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
const buildWords = (parts: string[], extra: string[]) => Array.from(new Set([...parts.flatMap(tokens), ...extra]));

// ---- Majors -----------------------------------------------------------------------
// Rows follow the shared card ids (so Lust sits where Strength does, Adjustment where Justice does).
// name|number|element|astrology|keywords|meaning|themes|tone
const MAJORS = `The Fool|0|Air|Air (Aleph)|innocence,the leap,folly,spontaneity|The holy fool at the edge: pure potential, before thought or plan. Step out with open eyes and let the new thing surprise you.|beginnings,growth|+
The Magus|1|Air|Mercury (Beth)|will,communication,skill,cunning|Mercury at work: language, craft and quick hands. Say what you mean, and bring every tool you have to one aim.|creativity,ambition,mind|+
The Priestess|2|Water|Moon (Gimel)|intuition,the veil,silence,mystery|Mystery held in reserve, like the moon between the pillars. Wait and watch before you speak; the answer comes from below the surface.|spirit,mind|0
The Empress|3|Earth|Venus (Daleth)|fertility,beauty,desire,abundance|Venus in full bloom: love, pleasure and creative fertility. Something is ripening. Let it grow, and enjoy it.|creativity,home,love|+
The Emperor|4|Fire|Aries (Heh)|authority,vision,structure,command|The ram's fire turned into rule. Take charge, set the law of the house, and lead from vision rather than habit.|work,ambition|+
The Hierophant|5|Earth|Taurus (Vav)|teaching,initiation,tradition,ritual|The bull's patient wisdom: learning handed down, and a doorway into a deeper mystery. Take the teaching, then make it your own.|mind,spirit|+
The Lovers|6|Air|Gemini (Zain)|union,choice,alchemy,harmony|Opposites joining into something new. A bond or decision that combines two sides of you; choose the union that makes both stronger.|love,choice|+
The Chariot|7|Water|Cancer (Cheth)|control,endurance,protection,victory|The charioteer holds the grail and drives on: disciplined, self-contained progress. Advance by guarding what you carry.|ambition,work|+
Lust|11|Fire|Leo (Teth)|vitality,passion,courage,ecstasy|The woman and the beast ride together in delight. Strength here comes from joy and desire, not restraint; let your instincts run alongside you.|healing,love,growth|+
The Hermit|9|Earth|Virgo (Yod)|solitude,seeking,the hidden seed,prudence|The lone light carried into the dark. Withdraw to find what is fertile inside you; your own lamp is enough to see by.|spirit,rest|0
Fortune|10|Fire|Jupiter (Kaph)|cycles,expansion,luck,the turning wheel|The wheel turns, and Jupiter's fortunes turn with it. Expand into the opening, and expect the wheel to keep moving.|change|+
Adjustment|8|Air|Libra (Lamed)|balance,truth,precision,cause and effect|The scales are true and the sword is sharp. What was done now finds its exact measure; act accurately and accept the result.|mind,choice|0
The Hanged Man|12|Water|Water (Mem)|surrender,suspension,rebirth,a new view|Hung by the heel, the figure sees from beneath: giving up control to be changed by it. Let go of the old view.|rest,change|0
Death|13|Water|Scorpio (Nun)|transformation,decay,release,rebirth|The skeleton dances and the scythe cuts. Dissolution feeds new form; the ending is natural, and what emerges will be different.|endings,change|0
Art|14|Fire|Sagittarius (Samekh)|alchemy,synthesis,blending,the great work|Fire and water mixed in one vessel. Combine what seems opposed, patiently, and something new can result.|healing,growth|+
The Devil|15|Earth|Capricorn (Ayin)|instinct,bondage,vitality,laughter|Pan's horned joke: raw creative energy, and the traps of compulsion. Own the appetite; do not let it own you.|shadow,conflict|-
The Tower|16|Fire|Mars (Peh)|sudden destruction,revelation,liberation,shock|War and lightning tear the false structure down. It is violent and it is necessary; what stands afterward is what was real.|change,endings|-
The Star|17|Air|Aquarius (Tzaddi)|hope,inspiration,vision,openness|The naked star-goddess pours from the vault of heaven. Renewal comes by being open: give freely, and trust what returns.|healing,spirit|+
The Moon|18|Water|Pisces (Qoph)|illusion,the unconscious,dreaming,the long path|The long path between the towers, in twilight. Things shift and images mislead; walk anyway, and watch what rises from below.|shadow,spirit,mind|0
The Sun|19|Fire|Sun (Resh)|joy,clarity,vitality,generosity|Children dance in a ring beneath the full sun. Plain happiness and health; bright, open, and for everyone.|growth,healing|+
The Aeon|20|Fire|Fire (Shin)|renewal,awakening,a new era,reckoning|Horus rises: a call to a new cycle. What was fixed is broken open, and you are asked to answer as your whole self.|change,growth|+
The Universe|21|Earth|Saturn (Tau)|completion,integration,the world,limit|The dancer within the serpent's ring: a cycle closes and everything is held in place. Finish it, and prepare to begin again.|growth,endings|+`;

// ---- Minors -----------------------------------------------------------------------
// title and keywords|meaning|themes|tone|astrology
// Aces, then Two to Ten, then Princess, Prince, Queen, Knight.
const MINOR: Record<Suit, string> = {
  wands: `Root of Fire,force,inception,the spark|The first flame: raw creative force before it has any shape. Something is being lit; pick it up while it is hot.|beginnings,creativity|+|Fire, root of the suit
Dominion,mastery,willpower,command|Mars in Aries: will in command of itself. Take the lead, decide, and hold your ground. Confidence backed by drive.|ambition,work|+|Mars in Aries
Virtue,pride,established will,generosity|Sun in Aries: strength that has proved itself and is glad to share. Steady authority, earned through effort.|ambition,growth|+|Sun in Aries
Completion,settlement,work done,celebration|Venus in Aries: the labor is finished and the house stands. Enjoy what you built; it is a stable base to work from.|home,work|+|Venus in Aries
Strife,conflict,competition,friction|Saturn in Leo: quarrels and cross-purposes, with energy spent against itself. Some friction is useful, but it should not run on unchecked.|conflict|-|Saturn in Leo
Victory,triumph,confidence,acclaim|Jupiter in Leo: a win after struggle, with recognition. Take the credit and keep the momentum; do not get complacent.|ambition,growth|+|Jupiter in Leo
Valour,courage against odds,standing firm,defense|Mars in Leo: one against many. You are outnumbered and you hold anyway; nerve, not numbers, decides it.|conflict,ambition|0|Mars in Leo
Swiftness,speed,messages,rapid movement|Mercury in Sagittarius: things move fast, whether news, travel or quick decisions. Act while it is moving, and check the details before they blur past.|change,mind|+|Mercury in Sagittarius
Strength,reserve,stamina,perseverance|Moon in Sagittarius: deep, steady power held in reserve. Stay ready and conserve it; you have more in you than you think.|healing,growth|+|Moon in Sagittarius
Oppression,burden,overload,willed cruelty|Saturn in Sagittarius: a fire pressed into a weight. Too much taken on and carried alone. Put some of it down.|conflict,work|-|Saturn in Sagittarius
brilliance,eagerness,a spark of will,daring|Earth of Fire: a bright, restless young person or impulse. Eager and quick, wanting to act; give it a direction.|creativity,beginnings|+|Earth of Fire
ambition,chivalry,charging ahead,vision|Air of Fire: a leader driven by an idea and moving fast. Generous, proud, and inclined to overreach.|ambition,work|+|Air of Fire · 20° Cancer–20° Leo
command,attraction,confidence,fierce loyalty|Water of Fire: magnetic, self-assured power. Warm, commanding and hard to ignore; confidence with real heart behind it.|ambition,love|+|Water of Fire · 20° Pisces–20° Aries
swiftness,impulsiveness,adventure,fire|Fire of Fire: the rider on the blaze. Fast, bold and inspiring, with a temper; move now, but do not burn what you pass.|change,ambition|0|Fire of Fire · 20° Scorpio–20° Sagittarius`,
  cups: `Root of Water,love,the source,overflow|The first pouring of feeling: love, compassion and creative depth arriving at the source. Let it fill you and overflow.|love,creativity|+|Water, root of the suit
Love,union,harmony,reciprocity|Venus in Cancer: two currents meeting in equal exchange. A close, mutual bond, freely given both ways.|love|+|Venus in Cancer
Abundance,celebration,fullness,friendship|Mercury in Cancer: shared joy and plenty. A good time among people you trust; enjoy it fully.|love,home|+|Mercury in Cancer
Luxury,comfort,saturation,inertia|Moon in Cancer: contentment that can go still. The comfort is real, but notice if it is turning into inertia.|home,rest|0|Moon in Cancer
Disappointment,loss,hope frustrated,sorrow|Mars in Scorpio: what you hoped for goes sour. Feel it fully; the disappointment is real, and it is not the end.|endings,shadow|-|Mars in Scorpio
Pleasure,ease,gladness,simple joys|Sun in Scorpio: uncomplicated happiness, at ease with what is. Enjoy it without needing to earn it.|love,rest|+|Sun in Scorpio
Debauch,indulgence,illusion,poisoned pleasure|Venus in Scorpio: appetite outrunning its use. Something sweet is turning sour; ask what you are numbing.|shadow,conflict|-|Venus in Scorpio
Indolence,apathy,weariness,drift|Saturn in Pisces: the tide is out. Energy and enthusiasm drain; rest is fine, but do not let it become a habit.|rest,shadow|-|Saturn in Pisces
Happiness,fulfilment,wishes granted,contentment|Jupiter in Pisces: satisfaction, the wish come true. Feelings are settled and generous; be glad of it.|love,growth|+|Jupiter in Pisces
Satiety,glut,completion,overfullness|Mars in Pisces: too much of a good thing. The cup overflows and stagnates; what was full goes stale, and it is time to empty and change.|endings,change|0|Mars in Pisces
sensitivity,gentle dreaming,romance,openness|Earth of Water: a soft, imaginative person or feeling. Gentle and receptive, drawn to beauty; can be dreamy and easily hurt.|love,creativity|+|Earth of Water
subtlety,emotional intelligence,depth,charm|Air of Water: emotion thought through. Persuasive and quietly intense; feeling directed with intent, sometimes with an agenda.|love,mind|0|Air of Water · 20° Libra–20° Scorpio
stillness,reflection,receptivity,intuition|Water of Water: a deep, mirror-still presence. Highly intuitive and absorbing; take care not to lose yourself in what you take in.|love,spirit|0|Water of Water · 20° Gemini–20° Cancer
romance,the quest,invitation,an approaching offer|Fire of Water: the rider who arrives bearing a cup. An offer, invitation or romantic pursuit; charming, and it deserves a real answer.|love,change|+|Fire of Water · 20° Aquarius–20° Pisces`,
  swords: `Root of Air,clarity,truth,force of mind|A blade of pure thought, drawn. Sharp insight and the power to decide; cut cleanly, and know it can cut both ways.|mind,beginnings|+|Air, root of the suit
Peace,truce,balance,stillness|Moon in Libra: a poised calm between two forces. The stillness comes from balance, but nothing is settled; peace here means holding the tension.|mind,choice|0|Moon in Libra
Sorrow,heartbreak,grief,a truth that hurts|Saturn in Libra: the heart pierced. A real loss or a painful truth; it is sorrow that comes from clarity, and it lasts as long as it takes.|shadow,endings|-|Saturn in Libra
Truce,rest,pause,recovery|Jupiter in Libra: a ceasefire and time to recover. Take the breather; the issue is not resolved, but you have room to regroup.|rest,healing|0|Jupiter in Libra
Defeat,loss,humiliation,failure|Venus in Aquarius: a bruising loss of face or position. Accept it, take the lesson, and do not relitigate it.|conflict,endings|-|Venus in Aquarius
Science,method,reason,problem-solving|Mercury in Aquarius: intellect at its best, with analysis, understanding and solutions that work. Think it through carefully.|mind,work|+|Mercury in Aquarius
Futility,wasted effort,doubt,scattered aim|Moon in Aquarius: plenty of effort and little result. Plans that are too diffuse or half-hearted; choose one thing and finish it.|mind,conflict|-|Moon in Aquarius
Interference,obstruction,indecision,tangle|Jupiter in Gemini: too many ideas pulling different ways. Progress stalls under confusion or outside meddling; simplify.|mind,conflict|-|Jupiter in Gemini
Cruelty,anguish,worry,sleeplessness|Mars in Gemini: the mind turning on itself in the night. Fear feeds fear. Get some distance and remember it is a thought spiral more than a fact.|shadow,mind|-|Mars in Gemini
Ruin,collapse,the end of a bad idea,finality|Sun in Gemini: the collapse of a structure of thought. It is painful, and it is over, and now you can build from what is left.|endings,change|-|Sun in Gemini
alertness,sharp wit,vigilance,observation|Earth of Air: quick, watchful and fierce. Clear-eyed and ready to argue; direct that sharpness carefully.|mind,conflict|0|Earth of Air
intellect,analysis,logic,relentlessness|Air of Air: pure intellect, fast and precise. Brilliant and cold; it can solve the problem and lose the person.|mind,ambition|0|Air of Air · 20° Capricorn–20° Aquarius
perception,clear sight,independence,hard truth|Water of Air: piercing perception. Sees through pretense and speaks plainly; has known loss, and it made her clear rather than soft.|mind,shadow|0|Water of Air · 20° Virgo–20° Libra
attack,speed,decisiveness,swift action|Fire of Air: the charge of an idea. Fast, forceful and sometimes reckless; be decisive, and watch what you cut.|conflict,change|0|Fire of Air · 20° Taurus–20° Gemini`,
  pents: `Root of Earth,matter,resources,the seed|The first grain: material possibility, health and solid ground. Plant it carefully; something real can grow here.|work,beginnings|+|Earth, root of the suit
Change,alternation,juggling,adaptability|Jupiter in Capricorn: two things kept in motion, the rhythm of give and take. Stay flexible; balance is something you keep doing, not something you reach.|change,work|0|Jupiter in Capricorn
Works,craft,skill,building|Mars in Capricorn: a project taking real shape through skill and effort. Work with others where you must; the results will show.|work,creativity|+|Mars in Capricorn
Power,security,holding,control|Sun in Capricorn: solid, defended holdings. Security and authority in place, with the risk of gripping too tightly.|work,home|0|Sun in Capricorn
Worry,anxiety,material strain,doubt|Mercury in Taurus: money and practical anxieties nagging. The trouble is real but usually smaller than the fretting about it.|work,shadow|-|Mercury in Taurus
Success,reward,achievement,steady gain|Moon in Taurus: hard work paying off, slowly and surely. Enjoy the result and stay with what got you here.|work,growth|+|Moon in Taurus
Failure,stalled growth,poor return,patience|Saturn in Taurus: the crop is poor. Effort has not paid yet and the method may need rethinking; do not pour more in without changing it.|work,shadow|-|Saturn in Taurus
Prudence,diligence,careful work,thrift|Sun in Virgo: steady attention to small things, with planning and patient effort. Not glamorous, and it builds something that lasts.|work,growth|+|Sun in Virgo
Gain,profit,comfort,self-sufficiency|Venus in Virgo: material comfort earned and enjoyed. Independence and a well-tended life; you can enjoy the harvest.|work,home|+|Venus in Virgo
Wealth,inheritance,lasting security,fullness|Mercury in Virgo: prosperity that lasts. Family, property and material foundations in place; check that they still serve you.|home,work|+|Mercury in Virgo
patience,fertile ground,steadiness,the student|Earth of Earth: the seed in the field. Grounded, slow and dependable; growth is quiet and comes from time in the soil.|work,growth|+|Earth of Earth
practicality,method,hard work,reliability|Air of Earth: the practical planner. Methodical, thorough and dependable, sometimes to the point of dullness; get the job done properly.|work,home|+|Air of Earth · 20° Aries–20° Taurus
generosity,resourcefulness,nurture,sensual grounding|Water of Earth: fertile, capable and giving. Manages resources and people with warmth and gets things to grow.|home,work|+|Water of Earth · 20° Sagittarius–20° Capricorn
endurance,slow strength,perseverance,steady drive|Fire of Earth: the slow plow horse. Unhurried and unstoppable; commit, and it will get done.|work,ambition|+|Fire of Earth · 20° Leo–20° Virgo`,
};

// ---- Pairings ---------------------------------------------------------------------
// Keys are the Rider-Waite short names (the `key` on every card); the text uses Thoth ideas.
export const T_PAIRS: [string, string, string][] = [
  ['Fool', 'Magician', 'The holy fool meets the Magus: pure potential meets skill and speech. A beginning with the tools to carry it.'],
  ['Fool', 'Tower', 'A leap and a lightning strike. What breaks is what could not have come along; the road is clear.'],
  ['Magician', 'High Priestess', 'The word and the silence: what is said and what is kept back. Speak, then listen.'],
  ['High Priestess', 'Moon', 'Two faces of the same water. Deep intuition in low light: trust the feeling, and check the picture.'],
  ['Empress', 'Emperor', 'Venus beside Aries: fertility and law. What grows is given form and someone to defend it.'],
  ['Hierophant', 'Lovers', 'Initiation and union: a bond entered as a rite, with meaning beyond the two people in it.'],
  ['Lovers', 'Devil', 'Union and appetite. Is this a chosen bond or a compulsion? The Devil laughs, and the joke may be on you.'],
  ['Chariot', 'Strength', 'The charioteer and the woman on the beast: control guarded by discipline, then delight with the force released.'],
  ['Chariot', 'Justice', 'The cup carried steady, then the scales set true. Victory that has to be weighed, and can be.'],
  ['Strength', 'Devil', 'Two forms of raw vitality, one in delight and one in bondage. The energy is the same; the relationship to it is the difference.'],
  ['Hermit', 'Hanged Man', 'The lone lamp and the inverted view: a deliberate withdrawal in which time and stillness do the work.'],
  ['Death', 'Temperance', 'Dissolution then synthesis. The old form dies so that something new can be mixed.'],
  ['Tower', 'Star', 'The collapse and the calm after it. Once the false structure is down, hope is possible.'],
  ['Moon', 'Sun', 'Night path and open day: confusion resolving into clarity. Keep walking; the light is coming.'],
  ['Judgement', 'World', 'The Aeon and the Universe: a call to a new cycle and the completion of the old one. One door closing as another opens.'],
];

export const T_BASICS = [
  'Ask an open question, like "What do I need to understand about this?" Yes-or-no questions give thin readings.',
  'Shuffle however feels natural, cut the deck, and deal in the order shown by the numbers.',
  'Read each card on its own first: the title, the number (its sephira), and the astrology. Then look at neighbors, where the elements support or oppose each other.',
  'The Thoth is read upright. Difficult cards, like Ruin or Oppression, describe a condition to work through, not a fixed outcome.',
];

// ---- Build ------------------------------------------------------------------------
const majorDefs = MAJORS.split('\n').map((ln) => ln.split('|'));
const SUIT_KEYS: Suit[] = ['wands', 'cups', 'swords', 'pents'];

export const T_CARDS: Card[] = BASE.map((b) => {
  if (b.arc === 'major') {
    const f = majorDefs[b.id];
    const num = Number(f[1]);
    const name = f[0];
    const short = name.replace(/^The /, '');
    return {
      ...b,
      name,
      short,
      alt: name === b.name ? null : b.name,
      rk: ROMAN[num],
      num,
      el: f[2] as Element,
      corr: f[3],
      kwU: f[4].split(','),
      kwR: [],
      up: f[5],
      rev: '',
      look: null,
      themes: f[6].split(','),
      tu: tone(f[7]),
      tr: 0,
      ord: num,
      words: buildWords([name, b.name, f[3]], [String(num), ROMAN[num].toLowerCase(), 'major', 'trump', 'arcana']),
    };
  }
  const suit = b.arc as Suit;
  const idxInSuit = b.id - 22 - SUIT_KEYS.indexOf(suit) * 14;
  const f = MINOR[suit].split('\n')[idxInSuit].split('|');
  const rank = T_RANKS[idxInSuit];
  const court = idxInSuit >= 10;
  const name = `${rank} of ${T_SUITS[suit].name}`;
  const kwU = f[0].split(',');
  return {
    ...b,
    name,
    short: name,
    alt: name === b.name ? null : b.name,
    rank,
    rk: T_RANK_SHORT[idxInSuit],
    corr: f[4],
    kwU,
    kwR: [],
    up: f[1],
    rev: '',
    look: null,
    themes: f[2].split(','),
    tu: tone(f[3]),
    tr: 0,
    words: buildWords([name, b.name, f[4], ...(court ? [] : [kwU[0]])], [...T_SUITS[suit].syn.split(' '), ...(b.num ? [String(b.num)] : []), ...(court ? ['court'] : [])]),
  };
});
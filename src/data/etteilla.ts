// Etteilla tradition: the same 78 cards (same ids), read the Etteilla way.
//
// A note on accuracy: Etteilla (Jean-Baptiste Alliette, 1780s) published the first deck
// built specifically for divination, with its own card order, some renamed cards, and a
// numbering sequence that mixes majors and minors together rather than running 0-21 then
// suit by suit. Reproducing that exact historical order and every original French title
// with confidence is beyond what I can verify here, so this file keeps the app's shared
// card ids (RWS order) for indexing and focuses on what is most distinctive and best
// documented about Etteilla's method: a short upright meaning and a short, often quite
// different, reversed meaning for every card, with no elements or astrology attached
// (those belong to Golden Dawn and Thoth, not Etteilla). Treat the specific wording as a
// close approximation in Etteilla's spirit, not a source-checked transcription of the
// 1780s originals, and verify it against a dedicated Etteilla reference before relying on it.
//
// Card ids match cards.ts, so saved readings work in every tradition. Pairings are keyed
// by the Rider-Waite short name (`key`), the one name every tradition shares.
// Court equivalents follow the French pattern: Valet = Page, Cavalier = Knight, Dame = Queen, Roi = King.

import type { Arc, Card, SuitDef } from '../types';
import { CARDS as BASE } from './cards';

type Suit = Exclude<Arc, 'major'>;

export const E_SUITS: Record<Suit, SuitDef> = {
  wands: { name: 'Batons', el: 'Fire', domain: 'work, enterprise and news of business', absent: 'little movement in work or enterprise right now', syn: 'baton batons wand wands staves rods fire' },
  cups: { name: 'Cups', el: 'Water', domain: 'the heart, pleasure and family matters', absent: 'the heart and home are sitting quietly in the background', syn: 'cup cups chalice chalices water' },
  swords: { name: 'Swords', el: 'Air', domain: 'trouble, dispute and hard news', absent: 'no sharp trouble is showing up right now', syn: 'sword swords blades air' },
  pents: { name: 'Coins', el: 'Earth', domain: 'money, property and material fortune', absent: 'money matters are sitting quietly in the background', syn: 'coin coins deniers pentacle pentacles pents disks discs earth' },
};

export const E_RANKS = ['Ace', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Valet', 'Cavalier', 'Dame', 'Roi'];
const E_RANK_SHORT = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'V', 'Ca', 'D', 'R'];

export const E_COURT: Record<string, string> = {
  Valet: 'a young person, a student, or news arriving',
  Cavalier: 'a visitor, a departure, or something arriving quickly',
  Dame: 'a woman close to the matter, or the receiving, sheltering side of the suit',
  Roi: 'a man of standing, or authority and experience brought to bear',
};

const tone = (c: string) => (c === '+' ? 1 : c === '-' ? -1 : 0);
const norm = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const tokens = (s: string) => norm(s).split(/[^a-z0-9]+/).filter(Boolean);
const buildWords = (parts: string[], extra: string[]) => Array.from(new Set([...parts.flatMap(tokens), ...extra]));

// ---- Majors -------------------------------------------------------------------------
// name|upright keywords|reversed keywords|upright meaning|reversed meaning|themes|tone(up,rev)
const MAJORS = `The Questioner|a new undertaking,a traveler,folly risked for freedom|a bad bargain,carelessness,a warning unheeded|Someone sets out without a fixed plan, trusting the road to provide. A workable risk, taken with open eyes.|The same leap taken blind. Look again before you commit; a loss is being invited in.|beginnings|+-
The Magician|skill put to use,a clever plan,resourcefulness|trickery,an empty display,wasted talent|Ability and will are lined up. Use what is in your hands; do not wait for better tools.|Cleverness turned to deceit, or real talent left idle. Something here is not what it appears.|creativity,ambition|+-
The High Priestess|hidden knowledge,a secret kept,patience|a secret revealed too soon,a wrong done in silence|What is not yet said still matters. Hold the matter close and let it ripen before you act.|A secret comes out before its time, or silence has done harm. Something concealed should now be named.|spirit,mind|0-
The Empress|fertility,a happy outcome,material success|a project that stalls,fertility delayed,vanity|Growth and reward are on the way, earned through care already given. A generous season.|What should have flourished is checked or delayed. Look at what is being neglected.|creativity,home,growth|+0
The Emperor|a man of authority,stability,firm protection|weakness in authority,a plan that fails,immaturity|A steady hand, official or fatherly, brings order to the matter. Structure holds.|Authority is absent, contested, or poorly used. The plan lacks the backing it needs.|work,ambition|+-
The Pope|a trusted advisor,counsel worth taking,a marriage or alliance|bad advice,a false friend,an alliance that sours|Someone with real standing offers guidance worth taking. A bond is formalized in good faith.|The advice or the alliance is unsound. Question who is really being served.|mind,love|+-
Love|a choice between two paths,attraction,a meeting of hearts|a poor choice,indecision,a union that fails|A real choice presents itself, and the heart is engaged. Choose with both reason and feeling.|The choice is being avoided or wrongly made. A pairing that will not hold.|love,choice|+-
The Chariot|a journey,news arriving,a battle carried to victory|a journey stopped,news delayed,defeat|Progress is underway and will arrive, whether news, travel, or a hard-won advance. Keep moving.|The road is blocked or the news is bad. What was moving toward you has stalled.|change,ambition|+-
Strength|force used well,a difficulty overcome,inner resolve|force misused,violence,a struggle lost|Real strength, whether physical or of will, is enough for what is in front of you.|Force is used badly, or the struggle goes the other way. Restraint is called for.|conflict,ambition|+-
The Hermit|wise counsel,a trustworthy elder,caution rewarded|bad counsel,betrayal by someone trusted,isolation|An older or wiser presence offers real guidance. Slow down and seek counsel before you act.|The counsel or the counselor cannot be trusted. Solitude has tipped into isolation.|spirit,rest|+-
The Wheel|good fortune,a turn for the better,an unexpected gain|misfortune,a turn for the worse,a setback|Fortune shifts in your favor, often suddenly. Take the opening while it is here.|The wheel turns against you. Expect a reversal, and plan around it rather than fighting it.|change|+-
Justice|a fair judgment,a lawsuit settled well,honesty rewarded|an unjust decision,a dispute dragging on,bias|The matter will be measured fairly, in court or otherwise. Act honestly and trust the outcome.|The verdict, formal or otherwise, goes wrong, or drags. Something is being weighed unfairly.|choice,conflict|+-
The Hanged Man|a necessary wait,a matter held in suspense,self-sacrifice for a good end|a wasted sacrifice,a wait that leads nowhere,betrayal|What is in limbo will resolve, but not yet. What you give up now serves you later.|The wait or the sacrifice is for nothing. Something stalled is not going to move.|rest,endings|0-
Death|a transformation,an ending that clears the way,a change of state|a change resisted,stagnation,a transformation refused|An ending is at hand, and it makes room for what comes next. Let it happen.|Change is being resisted and the old state festers instead of clearing. It needs to end anyway.|endings,change|0-
Temperance|moderation,a successful blending,harmony restored|excess,a bad mixture,conflict between parties|Combine what needs combining, carefully and in the right measure. Balance produces success.|Something is overdone, or mixed badly. Two sides that should meet are instead at odds.|healing,growth|+-
The Devil|a fated bond,strong desire,material force|bondage,a fate that traps,corruption|A powerful attachment or drive, not necessarily a bad one, takes hold. Own it consciously.|The attachment has become a trap. What looked like power is now a chain.|shadow,conflict|0-
The Tower|sudden upheaval,a plan destroyed,a painful surprise|the same upheaval, deserved,ruin,a downfall long coming|A sudden, forceful break in the matter. It cannot be prevented, only met.|The same collapse, but it was earned or long overdue. Do not mistake it for bad luck alone.|change,endings|--
The Star|hope,a bright outlook,a wish granted|a wish denied,dashed hope,poor judgment|Genuine hope, well founded. What you are working toward is reachable.|Hope was misplaced, or the wish will not be granted as expected. Reassess the goal.|healing,spirit|+-
The Moon|hidden enemies,deception,a matter clouded in doubt|a danger avoided,a deception uncovered,doubt easing|Something is not fully visible, and caution is warranted. Do not commit until it clears.|The hidden danger is spotted in time, or the deception is caught. Relief follows.|shadow,mind|-+
The Sun|a happy marriage or bond,good fortune,contentment|a bond that fails,a lesser fortune,unfulfilled happiness|Plain good fortune, warmth, and a bond that holds. Enjoy what is working.|The happiness expected does not fully arrive, or a bond weakens. Temper expectations.|love,growth|+-
Judgement|a change of situation,news that reopens a matter,renewal|a decision delayed,fear of change,a summons ignored|A significant change arrives, often as news that reopens something thought settled. Answer it.|The needed change is avoided, or a decision is put off out of fear. It will not wait forever.|change,growth|+-
The World|success achieved,a journey completed,recognition|success delayed,an unfinished matter,a small success only|The matter reaches a real, satisfying completion. What was worked for is achieved.|Completion is delayed, or the success, when it comes, is smaller than hoped.|growth,endings|+0`;

// ---- Minors -------------------------------------------------------------------------
// upright keywords|reversed keywords|upright meaning|reversed meaning|themes|tone
const MINOR: Record<Suit, string> = {
  wands: `enterprise,a new venture,birth of an idea|a bad start,a venture postponed,a false start|A venture begins. The spark is real; commit to it early.|The start is poor, or delayed past its moment. Wait, or begin differently.|beginnings,work|+-
association,a partnership formed,an alliance in business|a partnership that sours,obstacles to a deal|Two parties join their efforts and gain by it. A partnership worth forming.|The alliance runs into trouble, or should not be formed as planned.|work,ambition|+-
enterprise underway,cooperation,initial success|delay,a plan that stalls,arrogance|Early progress on a shared undertaking. Momentum is building.|The undertaking stalls, or overconfidence gets in the way.|work,ambition|+0
a settled home,a secure base,a happy return|a home disrupted,insecurity,a return delayed|A stable base to work and live from, secured through past effort.|The home base is unsettled, or a return is delayed. Shore up the foundation.|home,rest|+-
conflict over resources,rivalry,a struggle worth having|a struggle avoided,useless conflict,anxiety|Competition, but a healthy kind that can sharpen the outcome. Engage it.|The struggle is pointless, or avoidance only prolongs the worry.|conflict,work|0-
victory,a public success,news that lifts you|a win delayed,false praise,a private success only|Success arrives and is seen by others. Take the recognition.|The win is delayed, exaggerated, or does not extend beyond you.|ambition,growth|+0
a bold stand,courage under pressure,holding your ground|hesitation,being overwhelmed,a stand that fails|You hold a position against real pressure, and it is the right move.|You hesitate too long, or the pressure proves too much this time.|conflict,ambition|+-
swift news,rapid movement,a message on its way|news delayed,a plan derailed,jealousy interfering|Fast-moving news or travel. Be ready to act quickly on what arrives.|The news or movement is delayed, or something else interferes with the plan.|change,mind|+-
resilience,a defensive strength,standing firm on guard|a false sense of safety,unwarranted suspicion,exhaustion|You are more prepared for the challenge than you feel. Trust your readiness.|The defenses are weaker than assumed, or suspicion is doing more harm than the threat itself.|conflict,work|+0
a heavy burden,an ending near,oppression that will pass|a burden set down,a betrayal that clears,too much held onto|A weight carried near its end. What is heavy now will be set down soon.|The burden is finally released, sometimes by discovering a betrayal.|conflict,endings|0+
a young messenger,news,a new venture beginning|bad news,a message misused,spying|A young person or fresh news enters the matter. Take it seriously.|The news is bad, or someone is misusing what they were told.|beginnings,mind|0-
departure,a swift decision,a change of place|a departure that goes wrong,recklessness,a quarrel|A quick, decisive move, often a literal departure or change. Act while it is timely.|The move is rash, or leads to conflict rather than progress.|change,ambition|+-
a confident,generous woman,a warm household|jealousy,a household in disorder,coldness|A capable, generous presence steadies the household or the matter.|The same presence turns jealous or cold, or the household is in disorder.|home,love|+-
authority in business,a firm and fair man,good counsel|harsh authority,poor judgment,a man not to be trusted|A capable man of standing gives sound direction to the venture.|The authority is heavy-handed, or poorly judged. Question the direction given.|work,ambition|+-`,
  cups: `a new love,good news of the heart,a happy beginning|a false start in love,love postponed,an empty gesture|Affection or good feeling is beginning. Let it in without overthinking it.|The beginning is not what it seems, or feeling is being held back.|love,beginnings|+-
a strong bond,a true friendship,love returned|a bond breaking,a friendship strained,love not returned|A close bond holds, and both sides give equally to it.|The bond is under strain, or the feeling is not mutual.|love|+-
celebration,good news among friends,a happy gathering|overindulgence,a celebration cut short,excess|Shared joy, worth marking with the people around you.|The celebration is undercut by excess, or news arrives to end it early.|love,home|+0
a quiet dissatisfaction,turning away from what's offered,reflection|new interest returning,an offer reconsidered|Something offered does not satisfy, and you turn inward instead. That is fine, for now.|Interest returns, or an old offer is worth a second look.|rest,mind|0+
a loss felt,regret,a disappointment in love|a wound beginning to heal,a return after loss|A real loss, worth grieving before moving on.|The grief begins to ease, or something lost partly returns.|shadow,endings|-0
a memory returning,a reunion,an old friend or love reappearing|living in the past,a reunion that disappoints|Someone or something from before comes back into the matter.|The past is romanticized too much, or the reunion falls short.|love,change|+0-
too many options,a tempting illusion,daydreaming|a choice finally made,clarity after confusion|Many possibilities, none yet chosen. Beware getting lost among them.|A choice is finally made, and the fog clears.|choice,mind|0+
walking away,a quest for something more,leaving a comfortable place|returning to what was left,fear of the unknown|You leave a known comfort in search of something more meaningful.|You go back to what you left, or fear keeps you from leaving at all.|change,spirit|0-
a wish granted,contentment,satisfaction earned|smugness,a wish only partly granted,overindulgence|What you hoped for arrives, and you are satisfied with it.|The satisfaction curdles into self-satisfaction, or falls short.|growth,love|+-
lasting happiness,family harmony,a wish fulfilled at home|a family disrupted,a fleeting happiness,discord at home|A deep and lasting contentment, especially around home and family.|Harmony at home breaks down, or the happiness does not last.|home,love|+-
a sensitive young person,an offer of love,a dreamer|bad news,a deceptive offer,immaturity acted out|A gentle, imaginative presence or offer enters the matter.|The offer is not sincere, or news arrives that disappoints.|love,beginnings|+-
an invitation,an approach in love,a graceful proposal|a false invitation,seduction,an opportunity missed|Someone approaches with a genuine, charming offer. Consider it seriously.|The approach is not what it seems, or the opportunity passes you by.|love,change|+-
a loving, intuitive woman,emotional support,a generous heart|emotional withdrawal,a woman not to be trusted,moodiness|A caring, perceptive presence supports the matter with real warmth.|That support is withdrawn, or the warmth was not genuine.|love,home|+-
a wise, calm man,emotional maturity,good counsel in matters of the heart|emotional manipulation,a man of poor character,volatility|A composed, generous man of feeling steadies the matter.|The same figure turns manipulative, or proves unreliable.|love,mind|+-`,
  swords: `a difficult truth,a sharp decision,a triumph won through conflict|a truth avoided,a decision botched,self-inflicted harm|A clear, cutting truth or decision arrives. Face it directly; there is a win in it.|The truth is avoided, or the decision made badly, and it costs you.|conflict,mind|+-
a standoff,a difficult truce,a decision withheld|a truce breaking,dishonesty,a decision forced|Two sides hold an uneasy balance. It will not resolve until someone moves.|The truce fails, or dishonesty forces the issue before it's ready.|conflict,choice|0-
heartbreak,a painful truth,grief|a wound healing,a truth finally spoken|A real, sharp pain, usually from a truth that had to be faced.|The pain begins to heal, or a long-avoided truth is finally said.|shadow,endings|-0
rest after conflict,a needed withdrawal,recovery|a forced return,rest cut short,unfinished business|Step back from the conflict to recover; it will keep until you're ready.|The rest is interrupted, or you're pulled back before you're ready.|rest,conflict|0-
a hollow victory,a win at real cost,betrayal in a dispute|reconciliation,a truce after loss,regret|You win, but the cost is high, or the win costs a relationship.|A reconciliation follows the loss, or regret leads to repair.|conflict,shadow|-0
a difficult transition,moving on from trouble,a journey away from conflict|a return to old trouble,a transition blocked|You move away from a difficult situation, even if the way is not easy.|You're pulled back into the trouble you were leaving, or the move stalls.|change,conflict|0-
a deception uncovered,a risky plan,acting alone|a confession,a plan exposed too soon,getting caught|A plan involving some secrecy or risk. Watch that it stays sound.|The deception is found out, sometimes to your relief.|shadow,mind|0+
feeling trapped,self-imposed limits,a difficult bind|release from the bind,a crisis passing|You feel boxed in by the situation, more than the facts strictly require.|The bind loosens, often once you see it was partly self-made.|shadow,change|-+
worry,anxiety,a sleepless mind|worry easing,a fear proving unfounded|Real anxiety about the matter, worse in the imagining than the fact.|The worry eases, or the feared outcome doesn't happen.|shadow,mind|-+
an ending forced,a painful defeat,the worst of it is over|a slow recovery,a defeat that wasn't total|A hard ending, but a complete one; there is nothing worse waiting behind it.|The recovery is slow, or the defeat, while painful, wasn't final.|endings,shadow|-0
a sharp-minded young person,unwelcome news,a spy or informant|news withheld,a plan poorly executed|A quick, watchful presence or piece of news enters, not always welcome.|The news is held back, or a sharp plan is carried out badly.|mind,conflict|0-
a sudden attack,decisive and forceful action,a swift conflict|a reckless attack,a conflict escalated needlessly|Fast, forceful action in a conflict. Decisive, and better begun than delayed.|The action is reckless, or it escalates a conflict that could have stayed small.|conflict,change|0-
a sharp, perceptive woman,hard truths spoken plainly,independence|coldness,cruelty in speech,bitterness|A clear-eyed, independent presence who says what others avoid saying.|The same clarity turns cold or cruel, and independence into isolation.|mind,conflict|0-
a shrewd or ruthless man,legal or intellectual authority,cunning strategy|cruelty,abuse of authority,dishonest strategy|A sharp, strategic presence, especially in legal or intellectual matters.|The same presence turns cruel or dishonest in how authority is used.|mind,conflict|0-`,
  pents: `a new source of money,a practical opportunity,a solid beginning|an opportunity missed,poor planning,a bad investment|A real material opportunity opens up. Plan carefully and take it.|The opportunity is missed, or poorly planned from the start.|work,beginnings|+-
juggling resources,adaptability,managing two things at once|dropping the ball,overcommitment,poor money management|You keep more than one thing in balance and manage it well.|Something gets dropped, or resources are managed badly.|work,change|+-
skilled work,recognition for craft,collaboration that pays off|shoddy work,uncredited effort,poor teamwork|Real skill is applied and it shows. Collaboration strengthens the result.|The work is careless, or the credit and the collaboration both fail.|work,creativity|+-
holding on tightly,security through control,conservatism|greed,hoarding,a refusal to share or spend|You secure what you have, though it may cost some flexibility.|The holding on becomes greed, or a refusal to share what should be shared.|work,shadow|0-
material hardship,being left out in the cold,a difficult loss|help arriving,recovery from hardship,a debt resolved|Real financial or material difficulty, felt sharply.|Help arrives, or the hardship begins to resolve.|shadow,endings|-+
generosity,a fair exchange,receiving what you're owed|an unfair exchange,charity misused,a debt unpaid|Money or help moves fairly between people, in either direction.|The exchange is unfair, or generosity is taken advantage of.|work,home|+-
patience with slow growth,an investment not yet paid off,evaluation|impatience,a bad investment,wasted effort|Something is growing, but slowly. Stay patient and keep tending it.|Impatience leads to pulling out too soon, or the effort was wasted.|work,rest|0-
diligence,skilled, careful labor,steady improvement|sloppy work,a shortcut that backfires,a skill neglected|Careful, steady effort improves your position. Keep at the craft.|Corners are cut, or a skill goes untended and it shows.|work,growth|+-
self-sufficiency,comfort earned alone,a refined result|isolation,overreliance on material comfort,a setback to comfort|Independence and comfort, earned through your own steady effort.|The independence tips into isolation, or the comfort is disrupted.|home,work|+-
lasting wealth,family security,a legacy established|a family dispute over money,an inheritance delayed,instability|Material security that lasts and can be passed on.|Money causes family conflict, or the security proves less stable than it looked.|home,work|+-
a practical young person,news of money,a new job or task|bad news of money,a task done poorly|A grounded young presence or piece of news about material matters.|The news is unwelcome, or the task is handled badly.|work,beginnings|+-
a slow but steady advance,reliability,a dependable arrival|a stalled advance,laziness,a missed deadline|Slow, dependable progress. It will arrive, even if not quickly.|Progress stalls, or reliability fails when it's needed.|work,change|+-
a resourceful, practical woman,comfort provided through care|a woman preoccupied with material security,neglect through overwork|A capable, grounded presence provides real material and practical support.|The same presence becomes overly focused on security, at cost to other things.|home,work|+-
a successful, generous man,material mastery,business acumen|a man motivated by greed,poor financial judgment|An accomplished, steady man of business strengthens the matter.|The same figure is driven by greed, or judgment proves poor.|work,ambition|+-`,
};

// ---- Pairings -------------------------------------------------------------------------
export const E_PAIRS: [string, string, string][] = [
  ['Fool', 'Wheel of Fortune', 'A leap taken, and fortune turns on it. The risk and the turn of luck are tied together.'],
  ['Magician', 'High Priestess', 'What is spoken and what is kept back. Use your skill, but respect what is not yet ready to say.'],
  ['Emperor', 'Hierophant', 'Two kinds of authority, one of rule and one of counsel. Between them, the matter is well anchored.'],
  ['Lovers', 'Death', 'A choice made, and an ending that follows from it. Not every ending here is unwelcome.'],
  ['Chariot', 'Justice', 'A hard-won advance, then a fair reckoning of it. What was gained is measured honestly.'],
  ['Strength', 'Devil', 'Force rightly used against force that has become a trap. The same energy, two very different outcomes.'],
  ['Hanged Man', 'Death', 'A long wait, then the ending it was waiting for. What could not move finally does.'],
  ['Tower', 'Star', 'Sudden ruin, then hope after it. The collapse clears the ground the hope grows in.'],
  ['Moon', 'Sun', 'Doubt and confusion give way to plain clarity. Keep going; it does resolve.'],
  ['Judgement', 'World', 'A call to change, then the completion that answering it brings.'],
];

export const E_BASICS = [
  'Etteilla\u2019s method leans hard on reversals: shuffle so some cards land upside down, and read every card for whether it falls upright or reversed.',
  'Ask a direct, practical question. Etteilla readings tend toward concrete matters: money, travel, love, disputes, and news.',
  'Read the cards in the order they are laid, and let neighboring cards color one another, the way one piece of news changes how you read the next.',
  'The meanings here favor plain, worldly outcomes over psychological insight. Treat a hard reversed card as a warning to act on, not a verdict.',
];

// ---- Build --------------------------------------------------------------------------
const majorDefs = MAJORS.split('\n').map((ln) => ln.split('|'));
const SUIT_KEYS: Suit[] = ['wands', 'cups', 'swords', 'pents'];

export const E_CARDS: Card[] = BASE.map((b) => {
  if (b.arc === 'major') {
    const f = majorDefs[b.id];
    const name = f[0];
    const num = b.id;
    return {
      ...b,
      name,
      short: name,
      alt: name === b.name ? null : b.name,
      rk: String(num),
      num,
      el: b.el,
      corr: null,
      kwU: f[1].split(','),
      kwR: f[2].split(','),
      up: f[3],
      rev: f[4],
      look: null,
      themes: f[5].split(','),
      tu: tone(f[6][0]),
      tr: tone(f[6][1]),
      ord: num,
      words: buildWords([name, b.name], [String(num), 'major', 'etteilla']),
    };
  }
  const suit = b.arc as Suit;
  const idxInSuit = b.id - 22 - SUIT_KEYS.indexOf(suit) * 14;
  const f = MINOR[suit].split('\n')[idxInSuit].split('|');
  const rank = E_RANKS[idxInSuit];
  const court = idxInSuit >= 10;
  const name = `${rank} of ${E_SUITS[suit].name}`;
  return {
    ...b,
    name,
    short: name,
    alt: name === b.name ? null : b.name,
    rank,
    rk: E_RANK_SHORT[idxInSuit],
    el: E_SUITS[suit].el,
    corr: null,
    kwU: f[0].split(','),
    kwR: f[1].split(','),
    up: f[2],
    rev: f[3],
    look: null,
    themes: f[4].split(','),
    tu: tone(f[5][0]),
    tr: tone(f[5][1]),
    words: buildWords([name, b.name], [...E_SUITS[suit].syn.split(' '), ...(b.num ? [String(b.num)] : []), ...(court ? ['court'] : []), ...(rank === 'Cavalier' ? ['knight'] : []), ...(rank === 'Dame' ? ['queen'] : []), ...(rank === 'Roi' ? ['king'] : []), ...(rank === 'Valet' ? ['page'] : [])]),
  };
});

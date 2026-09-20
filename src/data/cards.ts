import type { Arc, Card, Element } from '../types';
import { RANKS, RANK_SHORT, ROMAN, SUITS } from './lore';

// name|element|astrology|upright keywords|reversed keywords|upright|reversed|themes|tone
// Tone is two characters, upright then reversed: + supportive, 0 mixed, - challenging.
const MAJOR = `The Fool|Air|Uranus|new beginnings,spontaneity,trust in the leap,innocence|recklessness,naivety,hesitation,poor judgment|A fresh start is opening. Step forward with curiosity and trust, even without a full map.|Either you're leaping without looking or fear is keeping you at the edge. Check your footing, then move.|beginnings,growth|+0
The Magician|Air|Mercury|willpower,skill,manifestation,resourcefulness|manipulation,untapped talent,scattered focus,trickery|You have the tools you need. Focus your intention and turn an idea into action.|Talent is going unused or being misdirected. Watch for spin, self-deception, or energy spread too thin.|creativity,ambition|+0
The High Priestess|Water|Moon|intuition,mystery,inner knowing,stillness|secrets,ignored intuition,surface-level thinking,withdrawal|Quiet down and listen. Answers are arriving as intuition, dreams, and what remains unspoken.|You may be overriding your gut or missing hidden information. Something isn't being said.|spirit,mind|00
The Empress|Earth|Venus|abundance,nurturing,creativity,comfort|smothering,creative block,dependence,self-neglect|Growth flourishes under care. Nurture yourself, your work and your relationships, and let beauty in.|Care is out of balance, given or received. Refill your own cup before pouring for others.|creativity,home,love|+0
The Emperor|Fire|Aries|structure,authority,stability,leadership|rigidity,control,domination,lack of discipline|Build on solid foundations with clear rules and steady leadership. Order is your ally.|Control has tipped into stubbornness, or structure is missing. Balance firmness with flexibility.|work,ambition|+0
The Hierophant|Earth|Taurus|tradition,guidance,shared values,mentorship|nonconformity,questioning norms,restriction,personal belief|Established wisdom, institutions or a mentor can guide you. Learning within a tradition serves you now.|The rulebook no longer fits. You're invited to define your own beliefs and methods.|mind,spirit|+0
The Lovers|Air|Gemini|connection,alignment,values-based choice,union|disharmony,misaligned values,avoiding a choice,imbalance|A meaningful bond or a choice that reflects your true values. Choose what you can fully stand behind.|Something is out of alignment, between people or between your choices and your values.|love,choice|+-
The Chariot|Water|Cancer|determination,momentum,control,victory|lack of direction,aggression,stalled progress,loss of control|Willpower steers opposing forces in one direction. Stay focused and drive forward.|You're pulled in different directions or pushing too hard. Regain the reins before speeding up.|ambition,work|+-
Strength|Fire|Leo|courage,patience,compassion,quiet confidence|self-doubt,raw emotion,insecurity,depleted energy|Gentle, steady courage wins where force can't. Meet the challenge with patience and warmth.|Confidence is low or feelings are running wild. Rebuild trust in yourself gradually.|healing,growth|+0
The Hermit|Earth|Virgo|solitude,reflection,wisdom,inner guidance|isolation,loneliness,withdrawal,refusing advice|Step back from the noise. Time alone brings clarity and lets your own answer surface.|Solitude has become isolation, or you're avoiding needed reflection. Reconnect or turn inward, whichever is missing.|spirit,rest|+-
Wheel of Fortune|Fire|Jupiter|cycles,turning point,luck,destiny|setbacks,resistance to change,bad timing,lack of control|Things are turning. Cycles bring change, and timing is bigger than you, so ride it with awareness.|A run of poor timing or resistance to a needed change. This phase is temporary; the wheel keeps moving.|change|+-
Justice|Air|Libra|fairness,truth,accountability,cause and effect|unfairness,dishonesty,avoiding accountability,bias|Facts and fair play prevail. Decisions and their consequences are coming into balance.|Something isn't being weighed fairly, or a consequence is being dodged. Look for the honest account.|mind,choice|0-
The Hanged Man|Water|Neptune|pause,surrender,new perspective,letting go|stalling,resistance,needless sacrifice,indecision|Stop pushing and look from another angle. A deliberate pause reveals what effort couldn't.|Waiting has become stalling, or you're sacrificing for no return. Decide what the pause is for.|rest,change|0-
Death|Water|Scorpio|endings,transformation,release,transition|resisting change,clinging,stagnation,a slow ending|A chapter closes to make room for the next. This is transformation, rarely literal loss.|You're holding on to something that's already over. Endings drag on until they're acknowledged.|endings,change|0-
Temperance|Fire|Sagittarius|balance,moderation,patience,blending|excess,imbalance,impatience,discord|Blend opposing needs and go slowly. Steady, measured effort restores harmony.|One area is overdone or neglected. Slow down and recalibrate the mix.|healing,growth|+-
The Devil|Earth|Capricorn|attachment,temptation,shadow,unhealthy patterns|breaking free,release,reclaiming power,awareness|Something has a grip on you, whether a habit, a bond or a belief. The chains are looser than they feel.|You see the trap clearly and are starting to loosen it. Freedom begins with honest acknowledgment.|shadow,conflict|-+
The Tower|Fire|Mars|upheaval,sudden change,revelation,breakdown|averted disaster,fear of change,delayed collapse,aftershocks|An unstable structure falls suddenly. It's jarring, but it clears ground for something truer.|You're avoiding an overdue shake-up or living through its aftershocks.|change,endings|-0
The Star|Air|Aquarius|hope,renewal,healing,inspiration|discouragement,disconnection,lost faith,dimmed hope|After the storm, calm and hope return. Rest, heal, and trust that you're being replenished.|Faith is running low. Small, steady acts of self-care bring the light back.|healing,spirit|+0
The Moon|Water|Pisces|illusion,intuition,uncertainty,the subconscious|clarity emerging,released fear,confusion lifting,hidden truth|Things aren't as clear as they seem. Move carefully, trust intuition, and expect feelings to distort the picture.|The fog is lifting and hidden matters are coming into view, or you're still circling in anxiety.|shadow,spirit,mind|0+
The Sun|Fire|Sun|joy,success,vitality,clarity|temporary gloom,overconfidence,delayed success,dimmed joy|Warmth, honesty and success. Things are clear, energy is high, and you can simply enjoy this.|The joy is there but clouded by doubt, fatigue or overconfidence. Success may arrive late.|growth,healing|+0
Judgement|Fire|Pluto|reckoning,awakening,calling,forgiveness|self-doubt,avoidance,harsh self-criticism,ignoring the call|A moment of clear-eyed review and a call to rise to something new. Forgive the past and answer.|You're judging yourself too harshly or ignoring a clear call. Reflection is being skipped.|endings,spirit,growth|+-
The World|Earth|Saturn|completion,wholeness,achievement,integration|loose ends,delayed completion,almost there,incomplete closure|A cycle completes with a sense of wholeness. Celebrate what you've built before starting again.|You're close but something remains unfinished. Tie up the last threads to close the loop.|endings,growth|+0`;

// Ace through Ten, then Page, Knight, Queen, King.
// upright keywords|reversed keywords|upright|reversed|themes|tone
const MINOR: Record<Exclude<Arc, 'major'>, string> = {
  wands: `inspiration,new venture,creative spark,potential|delays,lack of direction,false start,burnout|A surge of creative energy or a new venture. Follow the spark.|The spark is delayed or fizzling. Clarify what you actually want before you push.|beginnings,creativity,ambition|+0
planning,decision,future vision,discovery|fear of the unknown,playing it safe,poor planning,indecision|You hold the world in your hands. It's time to plan the next stage and choose a direction.|Reluctance to leave your comfort zone. Planning has stalled.|choice,ambition|0-
expansion,foresight,momentum,progress|delays,obstacles,lack of foresight,frustration|Your efforts are launching. Look ahead as the things you set in motion travel outward.|Plans stall or return slowly. Be patient and have a contingency plan.|work,ambition|+-
celebration,homecoming,stability,community|instability,tension at home,delayed celebration,feeling unwelcome|A milestone worth celebrating, with a sense of home and belonging.|The celebration is postponed or the foundation feels shaky.|home,love|+-
competition,conflict,disagreement,tension|avoiding conflict,resolution,inner conflict,truce|Clashing ideas and jostling for position. Friction can sharpen you if it stays healthy.|Conflict is settling, or being avoided. Choose an honest truce.|conflict|-0
victory,recognition,pride,public success|ego,fall from grace,lack of recognition,self-doubt|Success and public recognition. Enjoy the win.|Recognition is delayed or ego is getting ahead of you. Stay grounded.|work,ambition|+-
defense,perseverance,standing your ground,challenge|overwhelm,giving up,exhaustion,yielding|You hold the higher ground. Defend your position with persistence.|You're under siege and worn out. Decide what is actually worth defending.|conflict,ambition|0-
speed,swift action,movement,messages|delays,slowdown,scattered energy,frustration|Things move fast: messages, travel and momentum arrive.|Crossed wires and slow lines. Wait for things to align.|change,communication|+-
resilience,persistence,last stand,caution|exhaustion,defensiveness,paranoia,giving up|Battered but unbowed. One more push, and protect what you've built.|Fatigue makes everything look like an attack. Rest and reassess.|conflict,ambition|0-
burden,overcommitment,responsibility,hard work|releasing a burden,delegating,collapsing under load,letting go|You're carrying too much. Success has a weight, so ask what can be put down.|You're setting the load down, or dropping it. Delegate or defer.|work|-0
curiosity,new ideas,enthusiasm,exploration|lack of direction,immaturity,hesitancy,lost enthusiasm|An eager messenger with a fresh idea or opportunity. Explore it.|Enthusiasm without direction. Ideas need follow-through.|creativity,beginnings|+0
action,adventure,passion,impulsiveness|haste,scattered energy,delays,recklessness|Bold pursuit and passion. Move, but mind the pace.|Rushing ahead or stalling out. Focus your fire.|ambition,change|+-
confidence,warmth,determination,charisma|jealousy,insecurity,selfishness,demanding behavior|Magnetic, warm and self-assured. Lead by inspiring others.|Self-doubt or possessiveness dims the flame.|creativity,work|+-
vision,leadership,boldness,honor|domineering,impulsiveness,ruthlessness,unrealistic expectations|A visionary leader who turns ideas into results.|Big vision without follow-through, or overbearing control.|ambition,work|+-`,
  cups: `new feelings,love,compassion,emotional renewal|blocked emotion,emptiness,missed connection,repressed feelings|An overflow of emotion: new love, creativity or a spiritual opening.|Feelings are held back or draining away. Tend your emotional reserves.|love,beginnings,healing|+0
partnership,mutual attraction,harmony,connection|imbalance,one-sidedness,disconnection,breakup|A balanced, mutual bond. Two people meeting with respect.|The exchange is uneven or the connection is fraying.|love|+-
friendship,celebration,community,joy|overindulgence,gossip,exclusion,isolation|Celebration with people who lift you. Joy is shared.|Too much partying, or a social circle that feels strained.|love,home|+-
apathy,contemplation,reevaluation,disconnection|new motivation,awareness,acceptance,opportunity noticed|Bored, or absorbed in your own thoughts and missing what's being offered.|You're waking from apathy and noticing what's on offer.|rest,mind|0+
loss,regret,grief,focus on the negative|acceptance,moving on,forgiveness,finding peace|Mourning what spilled, while two cups still stand.|You're turning toward what remains and starting to move on.|healing,endings|-+
nostalgia,childhood,reunion,innocence|stuck in the past,unrealistic memory,moving forward,leaving home|Sweet memories, kindness and a reunion with the past.|Living in yesterday, or ready to let it go.|home,love|+0
choices,fantasy,illusion,wishful thinking|clarity,focused choice,reality check,temptation|Many tempting options, some of them illusions. Sort the real from the imagined.|The fog clears and you commit to one path.|choice,mind|0+
walking away,disillusionment,seeking more,letting go|fear of leaving,stagnation,aimlessness,avoidance|You leave something unfulfilling to search for deeper meaning.|Staying put out of fear, or wandering without purpose.|endings,change,spirit|0-
satisfaction,contentment,wishes fulfilled,gratitude|dissatisfaction,smugness,indulgence,hollow wins|Your wish comes true. Savor it.|Success feels hollow, or excess is standing in for satisfaction.|healing,love|+-
harmony,family,fulfillment,lasting happiness|broken home,misaligned values,disconnection,family conflict|Emotional fulfillment and a happy home.|Family friction, or a picture-perfect image with cracks in it.|love,home|+-
sensitivity,creative inspiration,intuitive message,dreaminess|emotional immaturity,creative block,mood swings,insecurity|A tender message or creative idea arrives. Listen to your heart.|Feelings are raw and inspiration is blocked.|creativity,love|+0
romance,charm,following the heart,invitation|moodiness,unrealism,jealousy,disappointment|A romantic offer, or an idealist following the heart.|Charm without substance, or moods overtaking plans.|love|+-
compassion,emotional intelligence,intuition,calm|codependency,emotional overwhelm,martyrdom,insecurity|Nurturing, emotionally intelligent care.|Boundaries blur and you absorb other people's feelings.|healing,love|+-
emotional balance,diplomacy,wisdom,generosity|manipulation,moodiness,emotional coldness,suppression|Calm mastery of feelings, offering support with composure.|Suppressed feelings, or emotional manipulation.|healing,love|+-`,
  swords: `clarity,truth,breakthrough,mental force|confusion,clouded judgment,harshness,miscommunication|A breakthrough of clarity and truth. Cut to the heart of it.|Confusion, or a truth used harshly.|mind,beginnings,communication|+0
stalemate,difficult decision,avoidance,truce|indecision,information overload,no good choice,exposure|Two options and a blindfold. A decision waits on information you're avoiding.|Overwhelmed by information, or forced to decide before you're ready.|choice,mind|0-
heartbreak,grief,betrayal,painful truth|recovery,forgiveness,releasing pain,slow healing|Sorrow that has to be felt. Pain clarifies.|The wound is healing, or is being suppressed.|love,healing,endings|-+
rest,recovery,contemplation,retreat|restlessness,burnout,returning to life,stagnation|Retreat and recover. Rest is productive.|You're ready to re-enter, or unable to rest.|rest,healing|+0
conflict,defeat,winning at all costs,tension|reconciliation,regret,moving on,leaving the fight|A hollow victory, or a fight not worth winning.|Reconciliation, or lingering resentment.|conflict,shadow|-+
transition,moving on,calmer waters,a healing journey|resistance to change,unfinished business,baggage,turbulence|Leaving rough waters behind on a gradual passage toward peace.|Not ready to leave, or carrying baggage along.|change,healing|+0
strategy,stealth,deception,going it alone|confession,getting caught,conscience,rethinking|Cleverness or evasion, acting alone. Ask whether it's honest.|Coming clean, or being found out.|mind,shadow|0+
restriction,feeling trapped,self-imposed limits,helplessness|freedom,new perspective,releasing limits,self-acceptance|The bindings are looser than they feel. You're freer than you think.|You're removing the blindfold and reclaiming agency.|mind,shadow|-+
anxiety,worry,sleepless nights,guilt|hope,reaching out,releasing worry,recovery|Worry at 3 a.m. blows things out of proportion. Talk it through.|Fear is easing. Reach for support.|mind,healing,shadow|-+
painful ending,rock bottom,betrayal,exhaustion|recovery,survival,resisting the end,slow healing|It's over, and the worst is behind you. Dawn follows.|You're pulling yourself up, or dragging out the ending.|endings|-+
curiosity,new ideas,vigilance,learning|gossip,haste,scattered thinking,careless words|A sharp, curious mind eager to learn. Ask questions.|Words used carelessly and thoughts scattered.|mind,communication,beginnings|+-
ambition,fast action,directness,drive|recklessness,disorganization,tactlessness,burning out|Charging ahead with sharp intent. Speed helps if it's aimed.|Impulsiveness and harsh words.|communication,ambition|0-
clear thinking,independence,directness,perception|coldness,bitterness,over-criticism,isolation|Honest, discerning, unsentimental clarity.|A sharp tongue, or emotional walls.|mind,communication|+-
intellectual authority,truth,fairness,strategy|manipulation,cruelty,misuse of power,rigid logic|Rational leadership guided by ethics.|Cold logic, or authority abused.|mind,work|+-`,
  pents: `opportunity,prosperity,new resources,manifestation|missed opportunity,poor planning,short-sightedness,scarcity mindset|A tangible new opportunity in money, work or health. Plant the seed.|An opportunity is missed, or the start is shaky.|money,beginnings|+0
balance,juggling,adaptability,priorities|overwhelm,disorganization,a dropped ball,imbalance|Juggling several demands with flexibility.|Overload, and something drops.|money,work|0-
teamwork,craftsmanship,collaboration,skill|disharmony,poor quality,lack of teamwork,working alone|Skilled collaboration builds something lasting.|Lack of cooperation or of standards.|work,creativity|+-
security,saving,control,conservatism|greed,letting go,generosity,insecurity|Holding tight to what you have: security, or clenched fists.|Loosening the grip, or overspending.|money|00
hardship,loss,isolation,insecurity|recovery,improvement,seeking help,spiritual wealth|Feeling out in the cold when help is close. Ask for it.|Things begin to improve and help arrives.|money,healing|-+
generosity,charity,fair exchange,sharing|debt,strings attached,one-sided giving,selfishness|Giving and receiving in balance.|An imbalance of power in giving.|money,love|+-
patience,long-term view,investment,assessment|impatience,poor returns,wasted effort,reassessment|Pause to assess your growth. The harvest is slow.|Impatience, or effort aimed in the wrong place.|work,money|0-
mastery,craft,diligence,practice|perfectionism,lack of focus,repetitive work,mediocrity|Dedicated practice builds real skill.|Perfectionism, or an uninspired grind.|work|+-
independence,luxury,self-sufficiency,reward|overspending,financial dependence,superficiality,overworking|Self-made comfort. Enjoy what you've earned.|Appearance over substance, or reliance on others.|money,healing|+-
legacy,wealth,family,long-term security|financial loss,family dispute,instability,fleeting success|Lasting security and family.|Unstable foundations, or disputes over inheritance.|home,money|+-
study,opportunity,ambition,groundedness|lack of progress,laziness,unrealistic goals,procrastination|A student of a practical goal. Start small.|Dreaming without doing.|beginnings,money,work|+-
reliability,patience,hard work,routine|stagnation,boredom,perfectionism,workaholism|Slow, steady, thorough progress.|Stuck in a rut, or too rigid.|work|+-
nurturing,practicality,abundance,homemaking|self-neglect,materialism,smothering,insecurity|Practical warmth that helps a home and its resources flourish.|Overextended, or preoccupied with security.|home,money|+-
abundance,prosperity,security,leadership|greed,indulgence,possessiveness,poor money habits|A secure builder who shares wealth wisely.|Materialism or stubbornness.|money,work|+-`,
};

const tone = (c: string) => (c === '+' ? 1 : c === '-' ? -1 : 0);

function buildWords(name: string, arc: Arc, num: number | null, rk: string): string[] {
  const w = new Set<string>();
  name
    .toLowerCase()
    .split(/\s+/)
    .forEach((x) => {
      if (x !== 'the' && x !== 'of') w.add(x);
    });
  if (arc === 'major') {
    w.add(String(num));
    w.add(rk.toLowerCase());
    w.add('major');
    w.add('trump');
  } else {
    SUITS[arc].syn.split(' ').forEach((x) => w.add(x));
    if (num) w.add(String(num));
  }
  return Array.from(w);
}

export const CARDS: Card[] = [];

MAJOR.split('\n').forEach((ln, i) => {
  const f = ln.split('|');
  CARDS.push({
    id: i,
    name: f[0],
    short: f[0].replace(/^The /, ''),
    arc: 'major',
    num: i,
    rank: null,
    court: false,
    rk: ROMAN[i],
    el: f[1] as Element,
    corr: f[2],
    kwU: f[3].split(','),
    kwR: f[4].split(','),
    up: f[5],
    rev: f[6],
    themes: f[7].split(','),
    tu: tone(f[8][0]),
    tr: tone(f[8][1]),
    words: buildWords(f[0], 'major', i, ROMAN[i]),
  });
});

(Object.keys(MINOR) as Exclude<Arc, 'major'>[]).forEach((suit) => {
  MINOR[suit].split('\n').forEach((ln, j) => {
    const f = ln.split('|');
    const name = `${RANKS[j]} of ${SUITS[suit].name}`;
    const num = j < 10 ? j + 1 : null;
    CARDS.push({
      id: CARDS.length,
      name,
      short: name,
      arc: suit,
      num,
      rank: RANKS[j],
      court: j >= 10,
      rk: RANK_SHORT[j],
      el: SUITS[suit].el,
      corr: null,
      kwU: f[0].split(','),
      kwR: f[1].split(','),
      up: f[2],
      rev: f[3],
      themes: f[4].split(','),
      tu: tone(f[5][0]),
      tr: tone(f[5][1]),
      words: buildWords(name, suit, num, RANK_SHORT[j]),
    });
  });
});

export const BY_SHORT = new Map(CARDS.map((c) => [c.short, c]));

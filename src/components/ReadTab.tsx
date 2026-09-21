import { useMemo, useRef, useState } from 'react';
import type { Card, Entry, ReadState, Slot, Spread } from '../types';
import { FOCUS, TH } from '../data/lore';
import { SPREADS, getSpread } from '../data/spreads';
import { analyze, focusLens, kwsOf, meaning, nm, normSlots, readingText, toEntries, type Analysis } from '../lib/engine';
import { cardArt } from '../lib/art';
import { cardFacts } from '../lib/facts';
import { saveReadingRemote } from '../lib/storage';
import { useTradition } from '../lib/tradition';
import { Picker } from './Picker';
import { Sheet } from './Sheet';
import { Table } from './Table';

interface Props {
  read: ReadState;
  setRead: (fn: (r: ReadState) => ReadState) => void;
  onOpenSpread: (id: string) => void;
  onCardInfo: (c: Card) => void;
  toast: (msg: string) => void;
}

export function ReadTab({ read, setRead, onOpenSpread, onCardInfo, toast }: Props) {
  const T = useTradition();
  const reversals = read.rev && T.reversals;
  const sp = useMemo(() => getSpread(read.spread, read.free), [read.spread, read.free]);
  const slots = useMemo(() => normSlots(read.cards[sp.id], sp.n), [read.cards, sp]);
  const entries = useMemo(() => toEntries(sp, slots, reversals, T), [sp, slots, reversals, T]);
  const [pick, setPick] = useState<number | null>(null);
  const [armed, setArmed] = useState(false);
  const armTimer = useRef<number | undefined>(undefined);
  const [copyText, setCopyText] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const setSlots = (next: (Slot | null)[]) => setRead((r) => ({ ...r, cards: { ...r.cards, [sp.id]: next } }));

  const choose = (card: Card, reversed: boolean) => {
    if (pick === null) return;
    const wasEmpty = !slots[pick];
    const next = slots.slice();
    next[pick] = { id: card.id, rev: reversals && reversed };
    setSlots(next);
    let nxt: number | null = null;
    if (wasEmpty) for (let j = pick + 1; j < sp.n; j++) if (!next[j]) { nxt = j; break; }
    setPick(nxt);
  };

  const removeAt = () => {
    if (pick === null) return;
    const next = slots.slice();
    next[pick] = null;
    setSlots(next);
    setPick(null);
  };

  const flip = (i: number) => {
    const next = slots.slice();
    const s = next[i];
    if (s) next[i] = { ...s, rev: !s.rev };
    setSlots(next);
  };

  const clear = () => {
    if (!armed) {
      setArmed(true);
      window.clearTimeout(armTimer.current);
      armTimer.current = window.setTimeout(() => setArmed(false), 3000);
      return;
    }
    setSlots(Array(sp.n).fill(null));
    setArmed(false);
  };

  const copy = async () => {
    const text = readingText(sp, entries, reversals, T, question.trim());
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied');
    } catch {
      setCopyText(text);
    }
  };

  const save = async () => {
    setSaving(true);
    setSaveMsg(null);
    try {
      await saveReadingRemote({ spreadId: sp.id, spreadName: sp.name, question: question.trim(), notes: notes.trim(), cards: slots });
      setSaveMsg({ ok: true, text: 'Saved to your journal.' });
      setQuestion('');
      setNotes('');
    } catch (e) {
      setSaveMsg({ ok: false, text: e instanceof Error ? e.message : 'Could not save.' });
    } finally {
      setSaving(false);
    }
  };

  const filled = entries.length;
  return (
    <>
      <h1>Read</h1>
      <p className="muted">Enter the cards you drew, in the positions where you laid them.</p>

      <label className="lbl" htmlFor="sel-spread">
        Spread
      </label>
      <select id="sel-spread" className="field" value={read.spread} onChange={(e) => setRead((r) => ({ ...r, spread: e.target.value }))}>
        {SPREADS.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} ({s.n})
          </option>
        ))}
        <option value="free">Open layout (any number of cards)</option>
      </select>

      <div className="row2">
        {T.reversals ? (
          <label className="check">
            <input type="checkbox" checked={read.rev} onChange={(e) => setRead((r) => ({ ...r, rev: e.target.checked }))} />
            Read reversals
          </label>
        ) : (
          <span className="muted small">{T.reversalsNote}</span>
        )}
        {sp.id !== 'free' ? (
          <button type="button" className="link" onClick={() => onOpenSpread(sp.id)}>
            How to lay it out
          </button>
        ) : (
          <span className="btns" style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn ghost sm" disabled={read.free <= 1} onClick={() => setRead((r) => ({ ...r, free: Math.max(1, r.free - 1) }))}>
              Remove position
            </button>
            <button type="button" className="btn ghost sm" disabled={read.free >= 12} onClick={() => setRead((r) => ({ ...r, free: Math.min(12, r.free + 1) }))}>
              Add position
            </button>
          </span>
        )}
      </div>

      <div className="cloth">
        <Table spread={sp} slots={slots} reversals={reversals} interactive onSlot={setPick} />
      </div>

      <div className="tools">
        <span className="muted small">
          {filled} of {sp.n} entered
        </span>
        <span className="btns">
          <button type="button" className="btn ghost sm" disabled={!filled} onClick={copy}>
            Copy reading
          </button>
          <button type="button" className="btn ghost sm" disabled={!filled} onClick={clear}>
            {armed ? 'Tap again to clear' : 'Clear'}
          </button>
        </span>
      </div>

      <div className="seg" role="group" aria-label="Results view">
        <button type="button" aria-pressed={read.view === 'cards'} onClick={() => setRead((r) => ({ ...r, view: 'cards' }))}>
          Each card
        </button>
        <button type="button" aria-pressed={read.view === 'together'} onClick={() => setRead((r) => ({ ...r, view: 'together' }))}>
          Together
        </button>
      </div>

      {filled === 0 ? (
        <p className="empty-note">Tap a numbered slot above and pick the card you drew. Cards fill in order, and the reading updates as you go.</p>
      ) : read.view === 'cards' ? (
        <CardsView sp={sp} slots={slots} reversals={reversals} onSlot={setPick} onFlip={flip} onInfo={onCardInfo} />
      ) : (
        <Together sp={sp} entries={entries} reversals={reversals} read={read} setRead={setRead} />
      )}

      {filled > 0 && (
        <>
          <h2>Save to your journal</h2>
          <label className="lbl" htmlFor="q">
            Question (optional)
          </label>
          <input id="q" className="field" value={question} onChange={(e) => setQuestion(e.target.value)} maxLength={300} placeholder="What were you asking?" />
          <label className="lbl" htmlFor="n">
            Notes (optional)
          </label>
          <textarea id="n" className="field" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={4000} placeholder="What stood out, what you decided" />
          <div className="acts">
            <button type="button" className="btn" disabled={saving} onClick={save}>
              {saving ? 'Saving' : 'Save reading'}
            </button>
          </div>
          {saveMsg && (
            <p className={saveMsg.ok ? 'muted' : 'err'} role="status">
              {saveMsg.text}
            </p>
          )}
        </>
      )}

      <Picker spread={sp} index={pick} slots={slots} reversals={reversals} onPick={choose} onRemove={removeAt} onClose={() => setPick(null)} />

      <Sheet open={copyText !== null} onClose={() => setCopyText(null)}>
        <div className="sh">
          <div className="sh-head">
            <h2>Copy reading</h2>
            <button type="button" className="btn ghost" onClick={() => setCopyText(null)}>
              Done
            </button>
          </div>
          <p className="muted small">Your browser blocked automatic copying. Select the text below and copy it.</p>
          <div className="sh-scroll">
            <textarea className="field" style={{ minHeight: 260 }} readOnly value={copyText ?? ''} onFocus={(e) => e.currentTarget.select()} />
          </div>
        </div>
      </Sheet>
    </>
  );
}

function CardsView({ sp, slots, reversals, onSlot, onFlip, onInfo }: { sp: Spread; slots: (Slot | null)[]; reversals: boolean; onSlot: (i: number) => void; onFlip: (i: number) => void; onInfo: (c: Card) => void }) {
  const T = useTradition();
  return (
    <div>
      {sp.pos.map((p, i) => {
        const s = slots[i];
        if (!s) {
          return (
            <div key={i} className="cb blank">
              <p className="pl">
                <span className="pn">{i + 1}</span>
                {p.l}
              </p>
              <p className="muted small">{p.m}</p>
              <button type="button" className="link" onClick={() => onSlot(i)}>
                Add the card for this position
              </button>
            </div>
          );
        }
        const c = T.cards[s.id];
        const rev = reversals && s.rev;
        const e: Entry = { i, pos: p, card: c, rev };
        const art = cardArt(c);
        return (
          <article key={i} className={`cb s-${c.arc}`}>
            <p className="pl">
              <span className="pn">{i + 1}</span>
              {p.l}. {p.m}
            </p>
            {art && <img className={'card-art' + (rev ? ' rev' : '')} src={art} alt="" />}
            <h3 className="cname">
              {c.name}
              {rev && <span className="ori">Reversed</span>}
            </h3>
            <div>
              {kwsOf(e).map((k) => (
                <span key={k} className="kw">
                  {k}
                </span>
              ))}
            </div>
            <p>{meaning(e)}</p>
            <details>
              <summary>More about this card</summary>
              {reversals && (
                <p>
                  <strong>{rev ? 'Upright' : 'Reversed'}:</strong> {rev ? c.up : c.rev}
                </p>
              )}
              {c.look && (
                <p>
                  <strong>Look closely.</strong> {c.look}
                </p>
              )}
              <p className="muted small">{[...(T.elements ? [`Element: ${c.el}.`, ...(c.corr ? [`Astrology: ${c.corr}.`] : [])] : []), ...cardFacts(c, T)].join(' ')}</p>
              <p className="muted small">Themes: {c.themes.map((t) => TH[t]?.label ?? t).join(', ')}.</p>
              <button type="button" className="link" onClick={() => onInfo(c)}>
                Open full card entry
              </button>
            </details>
            <div className="acts">
              <button type="button" className="btn ghost sm" onClick={() => onSlot(i)}>
                Change card
              </button>
              {reversals && (
                <button type="button" className="btn ghost sm" onClick={() => onFlip(i)}>
                  {rev ? 'Show upright' : 'Show reversed'}
                </button>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Together({ sp, entries, reversals, read, setRead }: { sp: Spread; entries: Entry[]; reversals: boolean; read: ReadState; setRead: (fn: (r: ReadState) => ReadState) => void }) {
  const T = useTradition();
  if (entries.length < 2) return <p className="empty-note">Add at least two cards to see how they combine.</p>;
  const A: Analysis = analyze(entries, sp, reversals, T);
  const lens = focusLens(entries, read.focus);
  return (
    <div>
      <section className="blk">
        <h2>The big picture</h2>
        <div className="chips">
          {A.chips.map((c) => (
            <span key={c} className="chip static">
              {c}
            </span>
          ))}
        </div>
        {A.paras.map((p) => (
          <p key={p}>{p}</p>
        ))}
        {A.themes.length > 0 && (
          <>
            <h3>What keeps coming up</h3>
            <ul className="plain">
              {A.themes.map((t) => (
                <li key={t.t}>
                  <strong>{t.label}.</strong> {t.line} <span className="muted">{t.cards.join(', ')}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {A.pairs.length > 0 && (
        <section className="blk">
          <h2>How the cards connect</h2>
          {A.pairs.map((p) => (
            <div key={`${p.a.i}-${p.b.i}`} className="pair">
              <h3>
                {p.a.pos.l} and {p.b.pos.l}
                {p.curated && <span className="badge">Classic pairing</span>}
              </h3>
              <p className="sub">
                {nm(p.a)} with {nm(p.b)}
                {p.label ? `. ${p.label}` : ''}
              </p>
              <p>{p.text}</p>
            </div>
          ))}
        </section>
      )}

      <section className="blk">
        <h2>Other ways to read it</h2>
        <p className="muted">These are lenses, not verdicts. Try each one and notice which fits.</p>

        {A.story && (
          <>
            <h3>Follow the story</h3>
            <p>{A.story}</p>
          </>
        )}

        <h3>Support and challenge</h3>
        {A.lean && (
          <p>
            <strong>Lean on:</strong> {A.lean}
          </p>
        )}
        {A.watch && (
          <p>
            <strong>Watch for:</strong> {A.watch}
          </p>
        )}
        {A.note && <p>{A.note}</p>}

        <h3>Read it for a specific topic</h3>
        <div className="chips scroll" role="group" aria-label="Topic">
          {Object.entries(FOCUS).map(([k, f]) => (
            <button key={k} type="button" className="chip" aria-pressed={read.focus === k} onClick={() => setRead((r) => ({ ...r, focus: k }))}>
              {f.label}
            </button>
          ))}
        </div>
        {!lens ? (
          <p className="muted">Pick a topic to see which cards speak to it most directly.</p>
        ) : (
          <>
            <p>{lens.intro}</p>
            {lens.direct.length > 0 ? (
              <ul className="plain">
                {lens.direct.map((e) => (
                  <li key={e.i}>
                    <strong>
                      {e.pos.l}: {nm(e)}.
                    </strong>{' '}
                    {meaning(e)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No card ties directly to this topic, so treat the spread as background. Ask how each card shapes the mood around it.</p>
            )}
            {lens.rest && <p className="muted">{lens.rest}</p>}
          </>
        )}

        <h3>Questions to sit with</h3>
        <ul className="plain">
          {A.questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}


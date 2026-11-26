import { useEffect, useMemo, useRef, useState } from 'react';
import type { Arc, Card, Slot, Spread } from '../types';
import { cardArt } from '../lib/art';
import { filtersFor, searchCards, type DeckFilter } from '../lib/search';
import { useTradition } from '../lib/tradition';
import { Glyph, Icons } from './Glyph';
import { Sheet } from './Sheet';
import './picker-cats.css';

interface Props {
  spread: Spread;
  index: number | null;
  slots: (Slot | null)[];
  reversals: boolean;
  onPick: (card: Card, reversed: boolean) => void;
  onRandom: () => void;
  onRemove: () => void;
  onClose: () => void;
}

export function Picker({ spread, index, slots, reversals, onPick, onRandom, onRemove, onClose }: Props) {
  return (
    <Sheet open={index !== null} onClose={onClose}>
      {index !== null && <PickerBody key={index} {...{ spread, index, slots, reversals, onPick, onRandom, onRemove, onClose }} />}
    </Sheet>
  );
}

function PickerBody({ spread, index, slots, reversals, onPick, onRandom, onRemove, onClose }: Omit<Props, 'index'> & { index: number }) {
  const T = useTradition();
  const cur = slots[index];
  const [q, setQ] = useState('');
  const [f, setF] = useState<DeckFilter | null>(null);
  const [rev, setRev] = useState(!!cur?.rev && reversals);
  const inputRef = useRef<HTMLInputElement>(null);
  const p = spread.pos[index];

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  const used = useMemo(() => {
    const m = new Map<number, number>();
    slots.forEach((s, j) => {
      if (s && j !== index) m.set(s.id, j + 1);
    });
    return m;
  }, [slots, index]);

  const browsing = f !== null || q.trim() !== '';
  const results = useMemo(() => (browsing ? searchCards(q, f ?? 'all', T) : []), [q, f, T, browsing]);
  const cats = useMemo(
    () =>
      filtersFor(T)
        .filter(([k]) => k !== 'all')
        .map(([k, label]) => ({ k, label: k === 'major' ? 'Major Arcana' : label, n: T.cards.filter((c) => c.arc === k).length })),
    [T],
  );
  const catLabel = cats.find((c) => c.k === f)?.label;

  return (
    <div className="sh">
      <div className="sh-head">
        <div>
          <p className="pl">
            Position {index + 1} of {spread.n}
          </p>
          <h2>{p.l}</h2>
          <p className="muted small">{p.m}</p>
        </div>
        <button type="button" className="btn ghost" onClick={onClose}>
          Done
        </button>
      </div>

      {reversals && (
        <div className="seg" role="group" aria-label="Orientation">
          <button type="button" aria-pressed={!rev} onClick={() => setRev(false)}>
            Upright
          </button>
          <button type="button" aria-pressed={rev} onClick={() => setRev(true)}>
            Reversed
          </button>
        </div>
      )}

      <button type="button" className="btn sm" onClick={onRandom}>
        Draw a random card
      </button>

      <input
        ref={inputRef}
        className="field"
        type="search"
        placeholder={f ? `Search ${catLabel}` : 'Search by name, number or suit'}
        value={q}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        enterKeyHint="search"
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const first = results.find((c) => !used.has(c.id));
            if (first) onPick(first, rev);
          }
        }}
      />
      {f && (
        <button type="button" className="link back" onClick={() => setF(null)}>
          {Icons.back}
          All categories
          <span className="muted"> · {catLabel}</span>
        </button>
      )}

      <div className="sh-scroll">
        {!browsing && (
          <div className="cats">
            {cats.map((c) => (
              <button key={c.k} type="button" className={`cat s-${c.k}` + (c.k === 'major' ? ' wide' : '')} onClick={() => setF(c.k)}>
                <span className="cat-ic">
                  <Glyph arc={c.k as Arc} tradition={T.id} />
                </span>
                <span className="cat-name">{c.label}</span>
                <span className="cat-n">{c.n} cards</span>
              </button>
            ))}
          </div>
        )}
        {browsing && results.length === 0 && <p className="empty-note">No card matches. Try a name, a number or a suit, like "tower" or "3 cups".</p>}
        {results.map((c) => {
          const u = used.get(c.id);
          const art = cardArt(c);
          return (
            <button key={c.id} type="button" className={`row s-${c.arc}` + (cur?.id === c.id ? ' cur' : '')} disabled={!!u} onClick={() => onPick(c, rev)}>
              <span className={'ic' + (art ? ' has-art' : '')}>
                {art ? <img src={art} alt="" /> : <Glyph arc={c.arc} tradition={T.id} />}
              </span>
              <span className="rt">
                <span className="rn">{c.name}</span>
                <span className="rs">{u ? `Already placed at position ${u}` : c.kwU.slice(0, 3).join(', ')}</span>
              </span>
            </button>
          );
        })}
      </div>

      {cur && (
        <div className="sh-foot">
          <button type="button" className="btn ghost" onClick={onRemove}>
            Remove this card
          </button>
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Card, Slot, Spread } from '../types';
import { cardArt } from '../lib/art';
import { filtersFor, searchCards, type DeckFilter } from '../lib/search';
import { useTradition } from '../lib/tradition';
import { Glyph } from './Glyph';
import { Sheet } from './Sheet';

interface Props {
  spread: Spread;
  index: number | null;
  slots: (Slot | null)[];
  reversals: boolean;
  onPick: (card: Card, reversed: boolean) => void;
  onRemove: () => void;
  onClose: () => void;
}

export function Picker({ spread, index, slots, reversals, onPick, onRemove, onClose }: Props) {
  return (
    <Sheet open={index !== null} onClose={onClose}>
      {index !== null && <PickerBody key={index} {...{ spread, index, slots, reversals, onPick, onRemove, onClose }} />}
    </Sheet>
  );
}

function PickerBody({ spread, index, slots, reversals, onPick, onRemove, onClose }: Omit<Props, 'index'> & { index: number }) {
  const T = useTradition();
  const cur = slots[index];
  const [q, setQ] = useState('');
  const [f, setF] = useState<DeckFilter>('all');
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

  const results = useMemo(() => searchCards(q, f, T), [q, f, T]);

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

      <input
        ref={inputRef}
        className="field"
        type="search"
        placeholder="Search by name, number or suit"
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
      <div className="chips scroll">
        {filtersFor(T).map(([k, label]) => (
          <button key={k} type="button" className="chip" aria-pressed={f === k} onClick={() => setF(k)}>
            {label}
          </button>
        ))}
      </div>

      <div className="sh-scroll">
        {results.length === 0 && <p className="empty-note">No card matches. Try a name, a number or a suit, like "tower" or "3 cups".</p>}
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

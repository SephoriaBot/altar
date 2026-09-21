import { useMemo, useState } from 'react';
import type { Card } from '../types';
import { filtersFor, searchCards, type DeckFilter } from '../lib/search';
import { useTradition } from '../lib/tradition';
import { Glyph } from './Glyph';

export function CardsTab({ onOpen }: { onOpen: (c: Card) => void }) {
  const T = useTradition();
  const [q, setQ] = useState('');
  const [f, setF] = useState<DeckFilter>('all');
  const res = useMemo(() => searchCards(q, f, T), [q, f, T]);
  return (
    <>
      <h1>Cards</h1>
      <p className="muted">{T.cardsIntro}</p>
      <input className="field" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder='Try "tower" or "3 cups"' autoComplete="off" autoCapitalize="off" spellCheck={false} aria-label="Search cards" />
      <div className="chips scroll" role="group" aria-label="Filter by suit">
        {filtersFor(T).map(([k, label]) => (
          <button key={k} type="button" className="chip" aria-pressed={f === k} onClick={() => setF(k)}>
            {label}
          </button>
        ))}
      </div>
      <div>
        {res.map((c) => (
          <button key={c.id} type="button" className={`row s-${c.arc}`} onClick={() => onOpen(c)}>
            <span className="ic">
              <Glyph arc={c.arc} tradition={T.id} />
            </span>
            <span className="rt">
              <span className="rn">{c.name}</span>
              <span className="rs">{c.kwU.slice(0, 3).join(', ')}</span>
            </span>
          </button>
        ))}
        {res.length === 0 && <p className="empty-note">No card matches. Try a name, a number or a suit, like "tower" or "3 cups".</p>}
      </div>
    </>
  );
}

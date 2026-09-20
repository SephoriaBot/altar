import { useState } from 'react';
import { BASICS } from '../data/lore';
import { SPREADS } from '../data/spreads';
import type { Spread } from '../types';
import { Icons } from './Glyph';
import { Table, Thumb } from './Table';

const FILTERS = ['All', 'Quick', 'Love', 'Work', 'Decisions', 'Self', 'Big picture'];

interface Props {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onUse: (id: string) => void;
}

export function SpreadsTab({ openId, setOpenId, onUse }: Props) {
  const [filter, setFilter] = useState('All');
  const open = SPREADS.find((s) => s.id === openId);
  if (open) return <Detail sp={open} onBack={() => setOpenId(null)} onUse={onUse} />;

  const list = SPREADS.filter((s) => filter === 'All' || (filter === 'Quick' ? s.n <= 4 : s.tags.includes(filter)));
  return (
    <>
      <h1>Spreads</h1>
      <p className="muted">Look up how to lay out a spread, then enter your cards in Read to see each card and how they combine.</p>
      <details className="basics">
        <summary>Reading basics</summary>
        <ol className="steps">
          {BASICS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ol>
      </details>
      <div className="chips scroll" role="group" aria-label="Filter spreads">
        {FILTERS.map((f) => (
          <button key={f} type="button" className="chip" aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f}
          </button>
        ))}
      </div>
      <div>
        {list.map((s) => (
          <button key={s.id} type="button" className="srow" onClick={() => setOpenId(s.id)}>
            <Thumb spread={s} />
            <span className="stx">
              <span className="sname">{s.name}</span>
              <span className="scnt">
                {s.n} {s.n === 1 ? 'card' : 'cards'}
              </span>
              <span className="sbl">{s.blurb}</span>
            </span>
          </button>
        ))}
        {list.length === 0 && <p className="empty-note">No spreads match that filter.</p>}
      </div>
    </>
  );
}

function Detail({ sp, onBack, onUse }: { sp: Spread; onBack: () => void; onUse: (id: string) => void }) {
  return (
    <>
      <button type="button" className="link back" onClick={onBack}>
        {Icons.back}
        All spreads
      </button>
      <h1>{sp.name}</h1>
      <p className="lead">{sp.blurb}</p>
      <div className="chips">
        <span className="chip static">
          {sp.n} {sp.n === 1 ? 'card' : 'cards'}
        </span>
        {sp.tags.map((t) => (
          <span key={t} className="chip static">
            {t}
          </span>
        ))}
      </div>
      <p>
        <strong>Best for:</strong> {sp.best}
      </p>
      <div className="cloth">
        <Table spread={sp} />
      </div>
      <h2>Positions</h2>
      <ol className="plist">
        {sp.pos.map((p, i) => (
          <li key={i}>
            <strong>{p.l}</strong>
            <br />
            <span className="muted">{p.m}</span>
          </li>
        ))}
      </ol>
      <h2>How to use it</h2>
      <ol className="steps">
        {sp.steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
      <div className="note">
        <strong>Reading tip.</strong> {sp.tip}
      </div>
      <button type="button" className="btn" onClick={() => onUse(sp.id)}>
        Read with this spread
      </button>
    </>
  );
}

import type { CSSProperties } from 'react';
import type { Slot, Spread } from '../types';
import { CARDS } from '../data/cards';
import { Glyph } from './Glyph';

interface Props {
  spread: Spread;
  slots?: (Slot | null)[];
  reversals?: boolean;
  interactive?: boolean;
  mini?: boolean;
  onSlot?: (i: number) => void;
}

export function Table({ spread, slots, reversals = true, interactive = false, mini = false, onSlot }: Props) {
  const style = { '--cols': spread.maxX + 1, '--maxx': spread.maxX, '--maxy': spread.maxY } as CSSProperties;
  return (
    <div className={'tbl' + (mini ? ' mini' : '')} style={style}>
      {spread.pos.map((p, i) => {
        const s = slots?.[i] ?? null;
        const c = s ? CARDS[s.id] : null;
        const rev = !!(c && reversals && s?.rev);
        const st = { '--x': p.x, '--y': p.y, '--rot': `${p.rot}deg`, '--rev': `${rev ? 180 : 0}deg`, zIndex: p.rot ? 2 : 1 } as CSSProperties;
        const cls = 'slot' + (c ? ` on s-${c.arc}` : ' empty') + (p.ntop ? ' ntop' : '');
        const inner = c ? (
          <>
            <span className="n">{i + 1}</span>
            <span className="rk">{c.rk}</span>
            <span className="g-wrap">
              <Glyph arc={c.arc} />
            </span>
            {c.arc === 'major' && <span className="nm">{c.short}</span>}
          </>
        ) : (
          <span className="n">{i + 1}</span>
        );
        if (interactive) {
          const label = c ? `Position ${i + 1}, ${p.l}: ${c.name}${rev ? ', reversed' : ''}. Tap to change.` : `Position ${i + 1}, ${p.l}: empty. Tap to add a card.`;
          return (
            <button key={i} type="button" className={cls} style={st} aria-label={label} onClick={() => onSlot?.(i)}>
              {inner}
            </button>
          );
        }
        return (
          <div key={i} className={cls} style={st}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}

// A small, scaled-down layout for the spread list.
export function Thumb({ spread }: { spread: Spread }) {
  const w = 12;
  const g = 3;
  const h = 18;
  const W = (spread.maxX + 1) * (w + g) - g;
  const H = (spread.maxY + 1) * (h + g) - g;
  const k = Math.min(1, 80 / W, 80 / H);
  return (
    <div className="thumb" aria-hidden="true">
      <div style={{ width: Math.round(W * k), height: Math.round(H * k) }}>
        <div style={{ width: W, height: H, transform: `scale(${k})`, transformOrigin: '0 0' }}>
          <Table spread={spread} mini />
        </div>
      </div>
    </div>
  );
}

import type { Card } from '../types';
import { CARDS } from '../data/cards';
import { COURT, NUMT, SUITS, TH } from '../data/lore';
import { cardByShort, pairsFor, toneWord } from '../lib/engine';
import { Sheet } from './Sheet';

const arcName = (c: Card) => (c.arc === 'major' ? 'Major Arcana' : SUITS[c.arc].name);

export function CardDetail({ card, onClose, onOpen }: { card: Card | null; onClose: () => void; onOpen: (c: Card) => void }) {
  return (
    <Sheet open={!!card} onClose={onClose}>
      {card && (
        <div className="sh">
          <div className="sh-head">
            <div>
              <p className="pl">{arcName(card)}</p>
              <h2>{card.name}</h2>
            </div>
            <button type="button" className="btn ghost" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="sh-scroll">
            <div className="chips">
              <span className="chip static">Element: {card.el}</span>
              {card.corr && <span className="chip static">Astrology: {card.corr}</span>}
              <span className="chip static">Upright feels {toneWord(card.tu)}</span>
            </div>
            {card.num && card.rank && (
              <p className="muted small">
                {card.rank}: {NUMT[card.num]}. {SUITS[card.arc as keyof typeof SUITS].name} govern {SUITS[card.arc as keyof typeof SUITS].domain}.
              </p>
            )}
            {card.court && card.rank && (
              <p className="muted small">
                {card.rank}: {COURT[card.rank]}. {SUITS[card.arc as keyof typeof SUITS].name} govern {SUITS[card.arc as keyof typeof SUITS].domain}.
              </p>
            )}
            <h3>Upright</h3>
            <div>{card.kwU.map((k) => <span className="kw" key={k}>{k}</span>)}</div>
            <p>{card.up}</p>
            <h3>Reversed</h3>
            <div>{card.kwR.map((k) => <span className="kw" key={k}>{k}</span>)}</div>
            <p>{card.rev}</p>
            <h3>Themes</h3>
            <div>{card.themes.map((t) => <span className="kw" key={t}>{TH[t]?.label ?? t}</span>)}</div>
            {pairsFor(card.short).length > 0 && (
              <>
                <h3>Classic pairings</h3>
                <ul className="plain">
                  {pairsFor(card.short).map((p) => {
                    const other = cardByShort(p.other) ?? CARDS[0];
                    return (
                      <li key={p.other}>
                        <button type="button" className="link inline" onClick={() => onOpen(other)}>
                          {other.name}
                        </button>
                        . {p.text}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

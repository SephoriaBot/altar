import type { Card } from '../types';
import { TH } from '../data/lore';
import { cardArt } from '../lib/art';
import { cardByKey, pairsFor, toneWord } from '../lib/engine';
import { cardFacts } from '../lib/facts';
import { useTradition } from '../lib/tradition';
import { Sheet } from './Sheet';

export function CardDetail({ card, onClose, onOpen }: { card: Card | null; onClose: () => void; onOpen: (c: Card) => void }) {
  const T = useTradition();
  const pairs = card ? pairsFor(card.key, T) : [];
  return (
    <Sheet open={!!card} onClose={onClose}>
      {card && (
        <div className="sh">
          <div className="sh-head">
            <div>
              <p className="pl">{card.arc === 'major' ? 'Major Arcana' : T.suits[card.arc].name}</p>
              <h2>{card.name}</h2>
              {card.alt && <p className="muted small">Also called {card.alt}</p>}
            </div>
            <button type="button" className="btn ghost" onClick={onClose}>
              Close
            </button>
          </div>
          <div className="sh-scroll">
            {cardArt(card) && <img className="card-art" src={cardArt(card)!} alt={`${card.name} card art`} />}
            <div className="chips">
              {T.elements && <span className="chip static">Element: {card.el}</span>}
              {T.elements && card.corr && <span className="chip static">Astrology: {card.corr}</span>}
              <span className="chip static">{T.reversals ? 'Upright feels' : 'Feels'} {toneWord(card.tu)}</span>
            </div>
            {cardFacts(card, T).length > 0 && <p className="muted small">{cardFacts(card, T).join(' ')}</p>}
            <h3>{T.reversals ? 'Upright' : 'Meaning'}</h3>
            <div>{card.kwU.map((k) => <span className="kw" key={k}>{k}</span>)}</div>
            <p>{card.up}</p>
            {card.look && (
              <>
                <h3>Look closely</h3>
                <p>{card.look}</p>
              </>
            )}
            {T.reversals && (
              <>
                <h3>Reversed</h3>
                <div>{card.kwR.map((k) => <span className="kw" key={k}>{k}</span>)}</div>
                <p>{card.rev}</p>
              </>
            )}
            <h3>Themes</h3>
            <div>{card.themes.map((t) => <span className="kw" key={t}>{TH[t]?.label ?? t}</span>)}</div>
            {pairs.length > 0 && (
              <>
                <h3>Classic pairings</h3>
                <ul className="plain">
                  {pairs.map((p) => {
                    const other = cardByKey(p.other, T) ?? T.cards[0];
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

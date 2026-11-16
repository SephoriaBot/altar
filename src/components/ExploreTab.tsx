import { useState } from 'react';
import type { Card } from '../types';
import { CardsTab } from './CardsTab';
import { SpreadsTab } from './SpreadsTab';

type Section = 'spreads' | 'cards';

interface Props {
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onUse: (id: string) => void;
  onCardOpen: (card: Card) => void;
}

export function ExploreTab({
  openId,
  setOpenId,
  onUse,
  onCardOpen,
}: Props) {
  const [section, setSection] = useState<Section>('spreads');

  return (
    <section className="explore-tab">
      <header>
        <h1>Explore</h1>
        <p className="muted">
          Find a spread for your question or explore the cards.
        </p>
      </header>

      <div className="seg" role="group" aria-label="Explore tarot">
        <button
          type="button"
          aria-pressed={section === 'spreads'}
          onClick={() => {
            setSection('spreads');
            setOpenId(null);
          }}
        >
          Spreads
        </button>

        <button
          type="button"
          aria-pressed={section === 'cards'}
          onClick={() => {
            setSection('cards');
            setOpenId(null);
          }}
        >
          Card library
        </button>
      </div>

      {section === 'spreads' ? (
        <SpreadsTab
          openId={openId}
          setOpenId={setOpenId}
          onUse={onUse}
        />
      ) : (
        <CardsTab onOpen={onCardOpen} />
      )}
    </section>
  );
}
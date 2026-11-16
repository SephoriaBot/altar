
import { useState } from 'react';
import type { SavedReading, Slot } from '../types';
import { useTradition } from '../lib/tradition';
import { drawCards } from '../lib/draw';
import { cardArt } from '../lib/art';

interface HomeTabProps {
  readings: SavedReading[];
  onOpenReading: (reading: SavedReading) => void;
  onGoTo: (tab: 'journal' | 'read') => void;
}

export function HomeTab({
  readings,
  onOpenReading,
  onGoTo,
}: HomeTabProps) {
  const T = useTradition();
  const [dailyDraw, setDailyDraw] = useState<Slot | null>(null);

  const recentReading = readings[0] ?? null;
  const drawnCard = dailyDraw ? T.cards[dailyDraw.id] : null;

  function handleDailyDraw() {
    const deck = Object.values(T.cards);
    if (!deck.length) return;

    const [slot] = drawCards(deck, 1, new Set(), true);

    if (slot) setDailyDraw(slot);
  }

  return (
    <section className="home-tab">
      <header className="home-header">
        <p className="eyebrow">Your Altar</p>
        <h1>A space for reflection.</h1>
        <p className="home-intro">
          Take a moment for yourself, explore the cards, and revisit
          the messages that stay with you.
        </p>
      </header>

      <article className="home-card home-card-daily-draw">
        <div className="home-card-icon">
          <img src="/dailydraw.png" alt="Daily Draw" />
        </div>

        <div className="home-daily-draw-content">
          <p className="home-card-label">Daily Draw</p>

          {!drawnCard ? (
            <>
              <h2>What wants your attention today?</h2>
              <p>
                Draw a card for a moment of reflection, guidance,
                or curiosity.
              </p>
              <button type="button" onClick={handleDailyDraw}>
                Draw your card
              </button>
            </>
          ) : (
            <div className="home-daily-draw-reveal">
              <p className="home-daily-draw-result-label">
                Your card for today
              </p>

              <div className="home-tarot-card">
                <div className="home-tarot-card-inner">
                  {cardArt(drawnCard) ? (
                    <img
                      src={cardArt(drawnCard) ?? ''}
                      alt={drawnCard.name}
                      className="home-tarot-card-image"
                    />
                  ) : (
                    <>
                      <span className="home-tarot-card-number">
                        {drawnCard.id < 22
                          ? drawnCard.id
                          : drawnCard.num ?? ''}
                      </span>
                      <div className="home-tarot-card-symbol">✦</div>
                      <h2>{drawnCard.name}</h2>
                      <span className="home-tarot-card-orientation">
                        {dailyDraw?.rev ? 'Reversed' : 'Upright'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="home-daily-draw-meaning">
                <p className="home-daily-draw-meaning-label">
                  {dailyDraw?.rev ? 'Reversed' : 'Upright meaning'}
                </p>
                <p>
                  {dailyDraw?.rev ? drawnCard.rev : drawnCard.up}
                </p>
              </div>

              <button type="button" onClick={handleDailyDraw}>
                Draw again
              </button>
            </div>
          )}
        </div>
      </article>

      <div className="home-grid">
        <article className="home-card home-card-reading">
          <div className="home-card-icon">
            <img src="/recentreadings.png" alt="Recent Reading" />
          </div>

          <div>
            <p className="home-card-label">Recent reading</p>

            {recentReading ? (
              <>
                <h2>
                  {recentReading.question || 'Untitled reading'}
                </h2>
                <p>
                  {recentReading.spreadName || 'Personal reading'}
                </p>

                <div className="home-reading-cards">
                  {recentReading.cards
                    .filter(Boolean)
                    .slice(0, 3)
                    .map((slot, index) => {
                      if (!slot) return null;

                      const card = T.cards[slot.id];
                      if (!card) return null;

                      return (
                        <div
                          className="home-reading-card"
                          key={`${slot.id}-${index}`}
                        >
                          {card.name}
                        </div>
                      );
                    })}
                </div>

                <button
                  type="button"
                  onClick={() => onOpenReading(recentReading)}
                >
                  Open reading
                </button>
              </>
            ) : (
              <>
                <h2>Your first reading awaits.</h2>
                <p>
                  Begin a reading and it will appear here once saved.
                </p>
                <button
                  type="button"
                  onClick={() => onGoTo('read')}
                >
                  Begin a reading
                </button>
              </>
            )}
          </div>
        </article>

        <article className="home-card home-card-journal">
          <div className="home-card-icon">
            <img src="/journal.png" alt="Saved Readings" />
          </div>

          <div>
            <p className="home-card-label">Saved Readings</p>
            <h2>Your reading history</h2>

            <p>
              {readings.length === 0
                ? 'Your saved readings will be collected here.'
                : `You have ${readings.length} ${
                    readings.length === 1
                      ? 'saved reading'
                      : 'saved readings'
                  } to revisit.`}
            </p>

            <button
              type="button"
              onClick={() => onGoTo('journal')}
            >
              View saved readings
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}

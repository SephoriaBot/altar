
import { useState } from 'react';
import type { SavedReading, Slot } from '../types';
import { useTradition } from '../lib/tradition';
import { dailyCard, localDateKey } from '../lib/dailyCard';
import { useAuth } from '../lib/useAuth';
import { ReminderToggle } from './ReminderToggle';
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
  const { userId } = useAuth();
  const [dailyDraw, setDailyDraw] = useState<Slot | null>(null);

  const recentReading = readings[0] ?? null;
  const drawnCard = dailyDraw ? T.cards[dailyDraw.id] : null;

  function handleDailyDraw() {
    // Same card all day for this person; a new one tomorrow.
    const slot = dailyCard(userId ?? 'anonymous', localDateKey());
    if (T.cards[slot.id]) setDailyDraw(slot);
  }

  return (
    <section className="home-tab">
      <header className="home-header">
        <p className="eyebrow">Your Altar</p>
        <h1>A space for reflection.</h1>
        <p className="home-intro">
          Take a moment for yourself, do a reading, and revisit
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
                Reveal today's card
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
            </div>
          )}
          <ReminderToggle />
        </div>
      </article>

      <div className="home-grid">
        <article className="home-card home-card-reading">
          <div className="home-card-icon">
            <img src="/recentreadings.png" alt="New Reading" />
          </div>

          <div>
            <p className="home-card-label">New Reading</p>
            <h2>Sit down with the cards</h2>
            <p>
              Choose a spread, then enter the cards you drew or
              draw them here.
            </p>
            <button type="button" onClick={() => onGoTo('read')}>
              Start a reading
            </button>
          </div>
        </article>

        <article className="home-card home-card-journal">
          <div className="home-card-icon">
            <img src="/journal.png" alt="Saved Readings" />
          </div>

          <div>
            <p className="home-card-label">Saved Readings</p>

            {recentReading ? (
              <>
                <h2>{recentReading.spreadName}</h2>
                <p>
                  {recentReading.question
                    ? `"${recentReading.question}"`
                    : 'No question noted.'}{' '}
                  Saved{' '}
                  {new Date(recentReading.createdAt).toLocaleDateString(
                    undefined,
                    { month: 'short', day: 'numeric' },
                  )}
                  .
                </p>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={() => onOpenReading(recentReading)}
                  >
                    Open it
                  </button>
                  <button type="button" onClick={() => onGoTo('journal')}>
                    All saved ({readings.length})
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Nothing saved yet</h2>
                <p>Readings you save will show up here.</p>
              </>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

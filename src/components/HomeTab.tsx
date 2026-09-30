import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@clerk/react';
import type { SavedReading } from '../types';
import { useTradition } from '../lib/tradition';

interface HomeTabProps {
  readings: SavedReading[];
  onOpenReading: (reading: SavedReading) => void;
  onGoTo: (tab: 'journal' | 'chart' | 'read') => void;
}

export function HomeTab({
  readings,
  onOpenReading,
  onGoTo,
}: HomeTabProps) {
  const T = useTradition();

  const { getToken, isSignedIn } = useAuth();

  const [chart, setChart] = useState<any | null>(null);

    useEffect(() => {
    if (!isSignedIn) {
      setChart(null);
      return;
    }

    let cancelled = false;

    async function loadSavedChart() {
      try {
        const token = await getToken();

        const response = await fetch('/api/charts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) return;

        const data = await response.json();

        if (!cancelled && data.charts?.length) {
          setChart(data.charts[0].chart);
        }
      } catch {
        // Keep the Home dashboard usable if the chart cannot be loaded.
      }
    }

    void loadSavedChart();

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  const stats = useMemo(() => {
    const cardCounts = new Map<string, number>();

    readings.forEach((reading) => {
      reading.cards.forEach((slot) => {
        if (!slot) return;

        const card = T.cards[slot.id];
        if (!card) return;

        cardCounts.set(card.name, (cardCounts.get(card.name) ?? 0) + 1);
      });
    });

    const recurringCards = Array.from(cardCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    return {
      totalReadings: readings.length,
      recurringCards,
    };
  }, [readings, T]);

  const recentReading = readings[0] ?? null;

  return (
    <section className="home-tab">
      <header className="home-header">
        <p className="eyebrow">Your Altar</p>

        <h1>A space for reflection.</h1>

        <p className="home-intro">
          Your readings, your journal, your chart, and the patterns that
          emerge over time.
        </p>
      </header>

      <div className="home-grid">
               <article className="home-card home-card-chart">
          <div className="home-card-icon">☾</div>

          <div>
            <p className="home-card-label">Your chart</p>

            {chart ? (
  <>
    <h2>
      {chart.placements?.find(
        (placement: { body: string }) => placement.body === 'sun',
      )?.sign ?? 'Your celestial map'}
      {' '}Sun
    </h2>

    <p>
  {chart.placements?.find(
    (placement: { body: string }) => placement.body === 'moon',
  )?.sign ?? 'Moon'}
  {' '}Moon
  {' · '}
  {chart.angles?.zodiacAscendant != null
    ? `${Math.floor(chart.angles.zodiacAscendant / 30) === 0 ? 'Aries' :
        Math.floor(chart.angles.zodiacAscendant / 30) === 1 ? 'Taurus' :
        Math.floor(chart.angles.zodiacAscendant / 30) === 2 ? 'Gemini' :
        Math.floor(chart.angles.zodiacAscendant / 30) === 3 ? 'Cancer' :
        Math.floor(chart.angles.zodiacAscendant / 30) === 4 ? 'Leo' :
        Math.floor(chart.angles.zodiacAscendant / 30) === 5 ? 'Virgo' :
        Math.floor(chart.angles.zodiacAscendant / 30) === 6 ? 'Libra' :
        Math.floor(chart.angles.zodiacAscendant / 30) === 7 ? 'Scorpio' :
        Math.floor(chart.angles.zodiacAscendant / 30) === 8 ? 'Sagittarius' :
        Math.floor(chart.angles.zodiacAscendant / 30) === 9 ? 'Capricorn' :
        Math.floor(chart.angles.zodiacAscendant / 30) === 10 ? 'Aquarius' :
        'Pisces'} Rising`
    : 'Rising'}
</p>

    <button type="button" onClick={() => onGoTo('chart')}>
      View your chart
    </button>
  </>
) : (
              <>
                <h2>Your celestial map</h2>

                <p>
                  Save your birth chart to begin seeing your personal
                  placements here.
                </p>

                <button type="button" onClick={() => onGoTo('chart')}>
                  Open chart
                </button>
              </>
            )}
          </div>
        </article>

        <article className="home-card home-card-reading">
          <div className="home-card-icon">✦</div>

          <div>
            <p className="home-card-label">Recent reading</p>

            {recentReading ? (
              <>
                <h2>
  {recentReading.question || 'Untitled reading'}
</h2>

<p>{recentReading.spreadName || 'Personal reading'}</p>

<div className="home-reading-cards">
  {recentReading.cards
    .filter(Boolean)
    .slice(0, 3)
    .map((slot, index) => {
      if (!slot) return null;

      const card = T.cards[slot.id];
      if (!card) return null;

      return (
        <div className="home-reading-card" key={`${slot.id}-${index}`}>
          <span>{card.name}</span>
        
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
                  Begin a reading and your personal history will start here.
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

<article className="home-card home-card-pattern">
  <div className="home-card-icon">◇</div>

  <div>
    <p className="home-card-label">Your patterns</p>

    <h2>What keeps appearing?</h2>

    {stats.recurringCards.length > 0 ? (
      <>
        <p>
          The cards that have appeared most often across your saved
          readings.
        </p>

        <div className="home-card-list">
          {stats.recurringCards.map(([name, count], index) => (
            <div className="home-list-row" key={name}>
              <span>
                <strong>{index + 1}</strong>
                {' '}
                {name}
              </span>

              <span>
                {count} {count === 1 ? 'appearance' : 'appearances'}
              </span>
            </div>
          ))}
        </div>
      </>
    ) : (
      <>
        <p>
          As you save readings, Altar will begin noticing recurring
          cards and patterns in your history.
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
  <div className="home-card-icon">♡</div>

  <div>
    <p className="home-card-label">Your journal</p>

    <h2>Your reflections</h2>

    {stats.totalReadings === 0 ? (
      <p>
        Your saved readings and reflections will live here.
      </p>
    ) : (
      <>
        <p>
          You have {stats.totalReadings}{' '}
          {stats.totalReadings === 1 ? 'saved reading' : 'saved readings'}.
        </p>

        {recentReading?.createdAt && (
          <p className="home-journal-date">
            Last reading ·{' '}
            {new Date(recentReading.createdAt).toLocaleDateString(
              undefined,
              {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              },
            )}
          </p>
        )}
      </>
    )}

    <button
      type="button"
      onClick={() => onGoTo('journal')}
    >
      Open journal
    </button>
  </div>
</article>
           </div>

      <div className="home-reflection">
        <span className="home-reflection-symbol">☾</span>

        <div>
          <p className="home-card-label">A moment for reflection</p>

          <p className="home-reflection-text">
            What are you noticing lately that you might have
            overlooked before?
          </p>
        </div>
      </div>
    </section>
  );
}
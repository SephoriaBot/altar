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
                  {chart.sunSign
                    ? `${chart.sunSign} Sun`
                    : 'Your celestial map'}
                </h2>

                <p>
                  {chart.moonSign && chart.ascendantSign
                    ? `${chart.moonSign} Moon · ${chart.ascendantSign} Rising`
                    : 'Your birth chart is saved in Altar.'}
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
                  These are some of the cards appearing most often in
                  your saved readings..
                </p>

                <div className="home-card-list">
                  {stats.recurringCards.map(([name, count]) => (
                    <div className="home-list-row" key={name}>
                      <span>{name}</span>

                      <span>
                        {count}{' '}
                        {count === 1
                          ? 'appearance'
                          : 'appearances'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p>
                As you save readings, Altar will begin noticing
                recurring cards and patterns in your history.
              </p>
            )}
          </div>
        </article>

        <article className="home-card home-card-journal">
          <div className="home-card-icon">♡</div>

          <div>
            <p className="home-card-label">Your journal</p>

            <h2>Your reflections</h2>

            <p>
              {stats.totalReadings === 0
                ? 'Your saved readings and reflections will live here.'
                : `You have ${stats.totalReadings} saved ${
                    stats.totalReadings === 1
                      ? 'reading'
                      : 'readings'
                  }.`}
            </p>

            <button
              type="button"
              onClick={() => onGoTo('journal')}
            >
              Open journal
            </button>
          </div>
        </article>
      </div>
    </section>
  );
}
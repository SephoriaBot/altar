import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/react';
import { localBirthTimeToUtc } from '../lib/timezone';

interface LocationResult {
  label: string;
  lat: number;
  lng: number;
}

type ZodiacSystem = 'tropical' | 'sidereal';

interface ChartPlacement {
  body: string;
  sign: string;
  degree: number;
  longitude: number;
  tropicalLongitude?: number;
  zodiacLongitude?: number;
  house: number | null;
  retrograde: boolean;
}

interface HouseInterpretation {
  house: number;
  name: string;
  sign: string;
  title: string;
  description: string;
}

interface SavedChart {
  id: string;
  chart: {
    zodiac?: ZodiacSystem;
    ayanamsha?: string | null;
    ayanamshaDegrees?: number | null;

    angles: {
      ascendant: number;
      midheaven: number;
      ramc: number;
      obliquity: number;
      zodiacAscendant?: number;
      zodiacMidheaven?: number;
    } | null;

    houseCusps: number[] | null;
    houseInterpretations?: HouseInterpretation[];
    placements: ChartPlacement[];
  };
}

const planetNames: Record<string, string> = {
  sun: 'Sun',
  moon: 'Moon',
  mercury: 'Mercury',
  venus: 'Venus',
  mars: 'Mars',
  jupiter: 'Jupiter',
  saturn: 'Saturn',
  uranus: 'Uranus',
  neptune: 'Neptune',
  pluto: 'Pluto',
};

const planetSymbols: Record<string, string> = {
  sun: '☉',
  moon: '☽',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
};

const planetClasses: Record<string, string> = {
  sun: 'chart-sun',
  moon: 'chart-moon',
  mercury: 'chart-mercury',
  venus: 'chart-venus',
  mars: 'chart-mars',
  jupiter: 'chart-jupiter',
  saturn: 'chart-saturn',
  uranus: 'chart-uranus',
  neptune: 'chart-neptune',
  pluto: 'chart-pluto',
};

function formatDegree(degree: number): string {
  const safe = Math.max(0, Math.min(29.999999, degree));
  const degrees = Math.floor(safe);
  const minutes = Math.round((safe - degrees) * 60);

  if (minutes === 60) {
    return `${degrees + 1}° 00'`;
  }

  return `${degrees}° ${String(minutes).padStart(2, '0')}'`;
}

function formatAngle(angle: number): string {
  const normalized = ((angle % 360) + 360) % 360;
  const signIndex = Math.floor(normalized / 30);
  const degree = normalized - signIndex * 30;

  const signs = [
    'Aries',
    'Taurus',
    'Gemini',
    'Cancer',
    'Leo',
    'Virgo',
    'Libra',
    'Scorpio',
    'Sagittarius',
    'Capricorn',
    'Aquarius',
    'Pisces',
  ];

  return `${signs[signIndex]} ${formatDegree(degree)}`;
}

function formatAyanamsha(degrees: number | null | undefined): string {
  if (degrees == null) return '';

  const whole = Math.floor(degrees);
  const minutes = Math.round((degrees - whole) * 60);

  return `${whole}° ${String(minutes).padStart(2, '0')}'`;
}

export function BirthChartForm() {
const { getToken, isSignedIn } = useAuth();
  const [label, setLabel] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);

  const [houseSystem, setHouseSystem] =
    useState<'whole-sign' | 'equal'>('whole-sign');

  const [zodiac, setZodiac] =
    useState<ZodiacSystem>('tropical');

  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] =
    useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(null);
  const [searching, setSearching] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedChart, setSavedChart] =
    useState<SavedChart | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setSavedChart(null);
      return;
    }

    let cancelled = false;

    async function loadSavedChart() {
      try {
        const token = await getToken();

        const res = await fetch('/api/charts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) return;

        const data = await res.json();

        if (!cancelled && data.charts?.length) {
          setSavedChart(data.charts[0]);
        }
      } catch {
        // Ignore load errors; the user can still create a new chart.
      }
    }

    void loadSavedChart();

    return () => {
      cancelled = true;
    };
  }, [getToken, isSignedIn]);

  async function searchLocation() {
    if (locationQuery.trim().length < 2) return;

    setSearching(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/geocode?q=${encodeURIComponent(locationQuery)}`,
      );

      if (!res.ok) {
        throw new Error('Location search failed.');
      }

      const data = await res.json();
      setLocationResults(data.results ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Location search failed.',
      );
    } finally {
      setSearching(false);
    }
  }

  function pickLocation(loc: LocationResult) {
    setSelectedLocation(loc);
    setLocationResults([]);
    setLocationQuery(loc.label);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSavedChart(null);

    if (!birthDate) {
      setError('Birth date is required.');
      return;
    }

    if (!selectedLocation) {
      setError('Pick a birth location from the search results.');
      return;
    }

    if (!timeUnknown && !birthTime) {
      setError(
        'Enter a birth time, or check "I don\'t know the exact time."',
      );
      return;
    }

    if (!isSignedIn) {
  setError('Please sign in to save your natal chart.');
  return;
}

setSubmitting(true);

try {
      const utcDate = timeUnknown
        ? null
        : localBirthTimeToUtc(
            birthDate,
            birthTime,
            selectedLocation.lat,
            selectedLocation.lng,
          );

      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${await getToken()}`,
},
        body: JSON.stringify({
          label: label || undefined,
          birthDate: utcDate
            ? utcDate.toISOString().slice(0, 10)
            : birthDate,
          birthTime: utcDate
            ? `${String(utcDate.getUTCHours()).padStart(2, '0')}:${String(
                utcDate.getUTCMinutes(),
              ).padStart(2, '0')}`
            : undefined,
          birthLat: selectedLocation.lat,
          birthLng: selectedLocation.lng,
          birthLocationLabel: selectedLocation.label,
          houseSystem: timeUnknown ? undefined : houseSystem,
          zodiac,
          ayanamsha: zodiac === 'sidereal' ? 'lahiri' : undefined,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        throw new Error(
          body.error ??
            `Failed to save chart (status ${res.status}).`,
        );
      }

      const data = await res.json();

      setSavedChart({
        id: data.id,
        chart: data.chart,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save chart.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const chart = savedChart?.chart;

  const ascendant =
    chart?.angles?.zodiacAscendant ??
    chart?.angles?.ascendant;

  const midheaven =
    chart?.angles?.zodiacMidheaven ??
    chart?.angles?.midheaven;

  const sun = chart?.placements.find(
    (p) => p.body === 'sun',
  );

  const moon = chart?.placements.find(
    (p) => p.body === 'moon',
  );

  return (
    <div className="chart-page">
      <form onSubmit={handleSubmit} className="chart-form">
        <div className="chart-intro">
          <span className="chart-eyebrow">
            ✦ Birth Chart
          </span>

          <h2>Create your natal chart</h2>

          <p className="muted">
            Enter your birth details to calculate your planetary
            placements, houses, and chart angles.
          </p>
        </div>

        <div className="chart-section">
          <div className="chart-section-title">
            <span>01</span>
            Birth details
          </div>

          <label className="lbl" htmlFor="chart-label">
            Chart name
          </label>

          <input
            id="chart-label"
            className="field"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My natal chart"
          />

          <label className="lbl" htmlFor="birth-date">
            Birth date
          </label>

          <input
            id="birth-date"
            className="field"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
          />

          <label className="check">
            <input
              type="checkbox"
              checked={timeUnknown}
              onChange={(e) =>
                setTimeUnknown(e.target.checked)
              }
            />
            <span>I don't know the exact birth time</span>
          </label>

          {!timeUnknown && (
            <div>
              <label className="lbl" htmlFor="birth-time">
                Birth time
              </label>

              <input
                id="birth-time"
                className="field"
                type="time"
                value={birthTime}
                onChange={(e) =>
                  setBirthTime(e.target.value)
                }
              />

              <p className="small muted chart-help">
                Use the local time at your birthplace.
              </p>
            </div>
          )}
        </div>

        <div className="chart-section">
          <div className="chart-section-title">
            <span>02</span>
            Birthplace
          </div>

          <label className="lbl" htmlFor="birth-location">
            City, state or country
          </label>

          <div className="chart-location-row">
            <input
              id="birth-location"
              className="field"
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                setSelectedLocation(null);
              }}
              placeholder="Richmond, Virginia"
            />

            <button
              type="button"
              className="btn sm"
              onClick={searchLocation}
              disabled={searching}
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {selectedLocation && (
            <div className="chart-selected-location">
              <span>✓</span>
              {selectedLocation.label}
            </div>
          )}

          {locationResults.length > 0 && (
            <div className="chart-location-results">
              {locationResults.map((loc, i) => (
                <button
                  key={`${loc.label}-${i}`}
                  type="button"
                  onClick={() => pickLocation(loc)}
                >
                  {loc.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="chart-section">
          <div className="chart-section-title">
            <span>03</span>
            Zodiac
          </div>

          <div className="seg chart-zodiac-toggle">
            <button
              type="button"
              aria-pressed={zodiac === 'tropical'}
              onClick={() => setZodiac('tropical')}
            >
              Tropical
            </button>

            <button
              type="button"
              aria-pressed={zodiac === 'sidereal'}
              onClick={() => setZodiac('sidereal')}
            >
              Sidereal
            </button>
          </div>

          {zodiac === 'tropical' ? (
            <p className="small muted">
              Uses the tropical zodiac, aligned with the
              seasonal equinoxes.
            </p>
          ) : (
            <div className="note chart-zodiac-note">
              <strong>Sidereal · Lahiri</strong>
              <p>
                Uses the Lahiri ayanamsha to account for the
                difference between the tropical and sidereal
                zodiacs.
              </p>
            </div>
          )}
        </div>

        {!timeUnknown && (
          <div className="chart-section">
            <div className="chart-section-title">
              <span>04</span>
              Houses
            </div>

            <div className="seg">
              <button
                type="button"
                aria-pressed={houseSystem === 'whole-sign'}
                onClick={() =>
                  setHouseSystem('whole-sign')
                }
              >
                Whole Sign
              </button>

              <button
                type="button"
                aria-pressed={houseSystem === 'equal'}
                onClick={() => setHouseSystem('equal')}
              >
                Equal
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="chart-error" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn chart-submit"
          disabled={submitting}
        >
          {submitting
            ? 'Calculating chart…'
            : 'Calculate natal chart'}
        </button>
      </form>

      {chart && (
        <section className="chart-results">
          <div className="chart-results-header">
            <span className="chart-eyebrow">
              ✦ Your chart
            </span>

            <h2>{label || 'Natal Chart'}</h2>

            <p className="muted">
              {chart.zodiac === 'sidereal'
                ? 'Sidereal zodiac · Lahiri ayanamsha'
                : 'Tropical zodiac'}
              {!timeUnknown &&
                ` · ${
                  houseSystem === 'whole-sign'
                    ? 'Whole Sign'
                    : 'Equal'
                } houses`}
            </p>
          </div>

          <div className="chart-big-three">
            <div className="chart-big-three-card chart-sun">
              <span className="chart-symbol">☉</span>
              <span className="chart-card-label">Sun</span>

              <strong>
                {sun?.sign ?? '—'}
              </strong>

              {sun && (
                <span>
                  {formatDegree(sun.degree)}
                </span>
              )}
            </div>

            <div className="chart-big-three-card chart-moon">
              <span className="chart-symbol">☽</span>
              <span className="chart-card-label">Moon</span>

              <strong>
                {moon?.sign ?? '—'}
              </strong>

              {moon && (
                <span>
                  {formatDegree(moon.degree)}
                </span>
              )}
            </div>

            <div className="chart-big-three-card chart-rising">
              <span className="chart-symbol">↑</span>
              <span className="chart-card-label">
                Rising
              </span>

              <strong>
                {ascendant != null
                  ? formatAngle(ascendant).split(' ')[0]
                  : '—'}
              </strong>

              {ascendant != null && (
                <span>
                  {formatAngle(ascendant)
                    .split(' ')
                    .slice(1)
                    .join(' ')}
                </span>
              )}
            </div>
          </div>

          <div className="chart-subsection">
            <div className="chart-subsection-heading">
              <h3>Planetary placements</h3>
              <span>
                {chart.placements.length} placements
              </span>
            </div>

            <div className="chart-planet-list">
              {chart.placements.map((placement) => (
                <div
                  key={placement.body}
                  className={`chart-planet-card ${
                    planetClasses[placement.body] ?? ''
                  }`}
                >
                  <div className="chart-planet-symbol">
                    {planetSymbols[placement.body] ?? '✦'}
                  </div>

                  <div className="chart-planet-main">
                    <strong>
                      {planetNames[placement.body] ??
                        placement.body}
                    </strong>

                    <span>
                      {placement.sign}{' '}
                      {formatDegree(placement.degree)}
                    </span>
                  </div>

                  <div className="chart-planet-meta">
                    {placement.house !== null && (
                      <span>
                        House {placement.house}
                      </span>
                    )}

                    {placement.retrograde && (
                      <span className="chart-retrograde">
                        ℞ Retrograde
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {chart.angles && (
            <div className="chart-subsection">
              <div className="chart-subsection-heading">
                <h3>Chart angles</h3>
              </div>

              <div className="chart-angle-grid">
                <div className="chart-angle-card">
                  <span className="chart-angle-symbol">
                    ASC
                  </span>

                  <strong>Ascendant</strong>

                  <span>
                    {ascendant != null
                      ? formatAngle(ascendant)
                      : '—'}
                  </span>
                </div>

                <div className="chart-angle-card">
                  <span className="chart-angle-symbol">
                    MC
                  </span>

                  <strong>Midheaven</strong>

                  <span>
                    {midheaven != null
                      ? formatAngle(midheaven)
                      : '—'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!timeUnknown &&
            chart.houseInterpretations &&
            chart.houseInterpretations.length > 0 && (
              <div className="chart-subsection">
                <div className="chart-subsection-heading">
                  <h3>House meanings</h3>
                  <span>
                    {chart.zodiac === 'sidereal'
                      ? 'Sidereal signs'
                      : 'Tropical signs'}
                  </span>
                </div>

                <div className="chart-house-list">
                  {chart.houseInterpretations.map((house) => (
                    <details
                      key={house.house}
                      className="chart-house-card"
                    >
                      <summary>
                        <span className="chart-house-number">
                          {house.house}
                        </span>

                        <span className="chart-house-title">
                          <strong>{house.name}</strong>
                          <small>
                            {house.sign} · {house.title}
                          </small>
                        </span>
                      </summary>

                      <p>{house.description}</p>
                    </details>
                  ))}
                </div>
              </div>
            )}

          {chart.zodiac === 'sidereal' && (
            <div className="note chart-ayanamsha-note">
              <strong>Sidereal calculation</strong>

              <p>
                Lahiri ayanamsha:{' '}
                {formatAyanamsha(
                  chart.ayanamshaDegrees,
                )}
              </p>
            </div>
          )}

          {timeUnknown && (
            <div className="note">
              <strong>Birth time unknown</strong>
              <p>
                Planetary positions can still be calculated,
                but houses and chart angles require a known
                birth time.
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
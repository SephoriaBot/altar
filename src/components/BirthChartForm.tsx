import { useState } from 'react';
import { localBirthTimeToUtc } from '../lib/timezone';

interface LocationResult {
  label: string;
  lat: number;
  lng: number;
}

interface ChartPlacement {
  body: string;
  sign: string;
  degree: number;
  longitude: number;
  house: number | null;
  retrograde: boolean;
}

interface SavedChart {
  id: string;
  chart: {
    angles: {
      ascendant: number;
      midheaven: number;
      ramc: number;
      obliquity: number;
    } | null;
    houseCusps: number[] | null;
    placements: ChartPlacement[];
  };
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '0.35rem',
  marginBottom: '1rem',
};

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1rem',
};

const checkboxRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.5rem',
  marginBottom: '1rem',
};

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

function formatDegree(degree: number): string {
  const degrees = Math.floor(degree);
  const minutes = Math.round((degree - degrees) * 60);

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

export function BirthChartForm() {
  const [label, setLabel] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [houseSystem, setHouseSystem] =
    useState<'whole-sign' | 'equal'>('whole-sign');

  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] =
    useState<LocationResult | null>(null);
  const [searching, setSearching] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedChart, setSavedChart] = useState<SavedChart | null>(null);

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
      setLocationResults(data.results);
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
          houseSystem,
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

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        style={{ maxWidth: '28rem' }}
      >
        <div style={fieldStyle}>
          <label htmlFor="chart-label">
            Chart label (optional)
          </label>

          <input
            id="chart-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="My chart"
          />
        </div>

        <div style={fieldStyle}>
          <label htmlFor="birth-date">
            Birth date
          </label>

          <input
            id="birth-date"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            required
          />
        </div>

        <div style={checkboxRowStyle}>
          <input
            id="time-unknown"
            type="checkbox"
            checked={timeUnknown}
            onChange={(e) => setTimeUnknown(e.target.checked)}
          />

          <label htmlFor="time-unknown">
            I don't know the exact birth time
          </label>
        </div>

        {!timeUnknown && (
          <div style={fieldStyle}>
            <label htmlFor="birth-time">
              Birth time (local time at birthplace)
            </label>

            <input
              id="birth-time"
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
            />
          </div>
        )}

        <div style={fieldStyle}>
          <label htmlFor="birth-location">
            Birth location
          </label>

          <div style={rowStyle}>
            <input
              id="birth-location"
              value={locationQuery}
              onChange={(e) => {
                setLocationQuery(e.target.value);
                setSelectedLocation(null);
              }}
              placeholder="City, State/Country"
              style={{ flex: 1 }}
            />

            <button
              type="button"
              onClick={searchLocation}
              disabled={searching}
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </div>

          {locationResults.length > 0 && (
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: 0,
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem',
              }}
            >
              {locationResults.map((loc, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => pickLocation(loc)}
                    style={{
                      textAlign: 'left',
                      width: '100%',
                    }}
                  >
                    {loc.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!timeUnknown && (
          <div style={fieldStyle}>
            <label htmlFor="house-system">
              House system
            </label>

            <select
              id="house-system"
              value={houseSystem}
              onChange={(e) =>
                setHouseSystem(
                  e.target.value as 'whole-sign' | 'equal',
                )
              }
            >
              <option value="whole-sign">
                Whole Sign
              </option>

              <option value="equal">
                Equal
              </option>
            </select>
          </div>
        )}

        {error && (
          <p role="alert" style={{ marginBottom: '1rem' }}>
            {error}
          </p>
        )}

        <button type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : 'Calculate chart'}
        </button>
      </form>

      {savedChart && (
        <section
          style={{
            marginTop: '2rem',
            maxWidth: '42rem',
          }}
        >
          <h3>
            {label || 'Natal Chart'}
          </h3>

          <p
            style={{
              marginTop: '-0.5rem',
              marginBottom: '1.5rem',
              opacity: 0.7,
            }}
          >
            {timeUnknown
              ? 'Birth time unknown — planetary positions shown without houses.'
              : 'Planetary positions and chart angles'}
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(12rem, 1fr))',
              gap: '0.75rem',
            }}
          >
            {savedChart.chart.placements.map((placement) => (
              <div
                key={placement.body}
                style={{
                  border: '1px solid rgba(0,0,0,0.12)',
                  borderRadius: '0.75rem',
                  padding: '0.9rem 1rem',
                }}
              >
                <strong>
                  {planetNames[placement.body] ??
                    placement.body}
                </strong>

                <div style={{ marginTop: '0.3rem' }}>
                  {placement.sign}{' '}
                  {formatDegree(placement.degree)}
                </div>

                <div
                  style={{
                    fontSize: '0.85rem',
                    opacity: 0.65,
                    marginTop: '0.25rem',
                  }}
                >
                  {placement.retrograde
                    ? 'Retrograde'
                    : 'Direct'}

                  {placement.house !== null &&
                    ` · House ${placement.house}`}
                </div>
              </div>
            ))}
          </div>

          {savedChart.chart.angles && (
            <div style={{ marginTop: '1.5rem' }}>
              <h4>Chart Angles</h4>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns:
                    'repeat(auto-fit, minmax(12rem, 1fr))',
                  gap: '0.75rem',
                }}
              >
                <div>
                  <strong>Ascendant</strong>
                  <div>
                    {formatAngle(
                      savedChart.chart.angles.ascendant,
                    )}
                  </div>
                </div>

                <div>
                  <strong>Midheaven</strong>
                  <div>
                    {formatAngle(
                      savedChart.chart.angles.midheaven,
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
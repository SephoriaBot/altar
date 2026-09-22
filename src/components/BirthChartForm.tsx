import { useState } from 'react';
import { localBirthTimeToUtc } from '../lib/timezone';

interface LocationResult {
  label: string;
  lat: number;
  lng: number;
}

interface SavedChartSummary {
  id: string;
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

export function BirthChartForm() {
  const [label, setLabel] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [birthTime, setBirthTime] = useState('');
  const [timeUnknown, setTimeUnknown] = useState(false);
  const [houseSystem, setHouseSystem] = useState<'whole-sign' | 'equal'>('whole-sign');

  const [locationQuery, setLocationQuery] = useState('');
  const [locationResults, setLocationResults] = useState<LocationResult[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationResult | null>(null);
  const [searching, setSearching] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedChart, setSavedChart] = useState<SavedChartSummary | null>(null);

  async function searchLocation() {
    if (locationQuery.trim().length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(locationQuery)}`);
      if (!res.ok) throw new Error('Location search failed.');
      const data = await res.json();
      setLocationResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Location search failed.');
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

    if (!birthDate) {
      setError('Birth date is required.');
      return;
    }
    if (!selectedLocation) {
      setError('Pick a birth location from the search results.');
      return;
    }
    if (!timeUnknown && !birthTime) {
      setError('Enter a birth time, or check "I don\'t know the exact time."');
      return;
    }

    setSubmitting(true);
    try {
      const utcDate = timeUnknown
        ? null
        : localBirthTimeToUtc(birthDate, birthTime, selectedLocation.lat, selectedLocation.lng);

      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label || undefined,
          birthDate: utcDate ? utcDate.toISOString().slice(0, 10) : birthDate,
          birthTime: utcDate
            ? `${String(utcDate.getUTCHours()).padStart(2, '0')}:${String(utcDate.getUTCMinutes()).padStart(2, '0')}`
            : undefined,
          birthLat: selectedLocation.lat,
          birthLng: selectedLocation.lng,
          birthLocationLabel: selectedLocation.label,
          houseSystem,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Failed to save chart (status ${res.status}).`);
      }

      const data = await res.json();
      setSavedChart({ id: data.id });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save chart.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '28rem' }}>
      <div style={fieldStyle}>
        <label htmlFor="chart-label">Chart label (optional)</label>
        <input id="chart-label" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My chart" />
      </div>

      <div style={fieldStyle}>
        <label htmlFor="birth-date">Birth date</label>
        <input id="birth-date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
      </div>

      <div style={checkboxRowStyle}>
        <input
          id="time-unknown"
          type="checkbox"
          checked={timeUnknown}
          onChange={(e) => setTimeUnknown(e.target.checked)}
        />
        <label htmlFor="time-unknown">I don't know the exact birth time</label>
      </div>

      {!timeUnknown && (
        <div style={fieldStyle}>
          <label htmlFor="birth-time">Birth time (local time at birthplace)</label>
          <input id="birth-time" type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
        </div>
      )}

      <div style={fieldStyle}>
        <label htmlFor="birth-location">Birth location</label>
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
          <button type="button" onClick={searchLocation} disabled={searching}>
            {searching ? 'Searching…' : 'Search'}
          </button>
        </div>

        {locationResults.length > 0 && (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {locationResults.map((loc, i) => (
              <li key={i}>
                <button type="button" onClick={() => pickLocation(loc)} style={{ textAlign: 'left', width: '100%' }}>
                  {loc.label}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {!timeUnknown && (
        <div style={fieldStyle}>
          <label htmlFor="house-system">House system</label>
          <select
            id="house-system"
            value={houseSystem}
            onChange={(e) => setHouseSystem(e.target.value as 'whole-sign' | 'equal')}
          >
            <option value="whole-sign">Whole Sign</option>
            <option value="equal">Equal</option>
          </select>
        </div>
      )}

      {error && (
        <p role="alert" style={{ marginBottom: '1rem' }}>
          {error}
        </p>
      )}
      {savedChart && <p style={{ marginBottom: '1rem' }}>Chart saved (id: {savedChart.id})</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Calculate chart'}
      </button>
    </form>
  );
}

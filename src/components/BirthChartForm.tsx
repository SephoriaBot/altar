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
      // Convert local wall-clock birth time to UTC before sending —
      // buildNatalChart on the server expects UTC.
      const utcDate = timeUnknown
        ? null
        : localBirthTimeToUtc(birthDate, birthTime, selectedLocation.lat, selectedLocation.lng);

      const res = await fetch('/api/charts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: label || undefined,
          // Server expects UTC. When time is known, use the UTC-corrected
          // date/time (crossing midnight can shift the calendar date).
          // When time is unknown, we can't correct for timezone at all, so
          // we send the local calendar date as-is — this is an inherent
          // limitation of not knowing the birth time.
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
        throw new Error(body.error ?? 'Failed to save chart.');
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
    <form onSubmit={handleSubmit}>
      <label>
        Chart label (optional)
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="My chart" />
      </label>

      <label>
        Birth date
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} required />
      </label>

      <label>
        <input type="checkbox" checked={timeUnknown} onChange={(e) => setTimeUnknown(e.target.checked)} />
        I don't know the exact birth time
      </label>

      {!timeUnknown && (
        <label>
          Birth time (local time at birthplace)
          <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
        </label>
      )}

      <label>
        Birth location
        <input
          value={locationQuery}
          onChange={(e) => {
            setLocationQuery(e.target.value);
            setSelectedLocation(null);
          }}
          placeholder="City, State/Country"
        />
      </label>
      <button type="button" onClick={searchLocation} disabled={searching}>
        {searching ? 'Searching…' : 'Search'}
      </button>

      {locationResults.length > 0 && (
        <ul>
          {locationResults.map((loc, i) => (
            <li key={i}>
              <button type="button" onClick={() => pickLocation(loc)}>
                {loc.label}
              </button>
            </li>
          ))}
        </ul>
      )}

      {!timeUnknown && (
        <label>
          House system
          <select value={houseSystem} onChange={(e) => setHouseSystem(e.target.value as 'whole-sign' | 'equal')}>
            <option value="whole-sign">Whole Sign</option>
            <option value="equal">Equal</option>
          </select>
        </label>
      )}

      {error && <p role="alert">{error}</p>}
      {savedChart && <p>Chart saved (id: {savedChart.id})</p>}

      <button type="submit" disabled={submitting}>
        {submitting ? 'Saving…' : 'Calculate chart'}
      </button>
    </form>
  );
}

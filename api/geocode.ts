import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getUserId } from './_lib/auth.js';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

// Best-effort per-user throttle (resets when the server instance restarts).
// Nominatim's policy is strict, so this keeps one account from hammering it.
const hits = new Map<string, number[]>();
const MAX_PER_MINUTE = 20;

function throttled(userId: string): boolean {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(userId, recent);
  if (hits.size > 5000) hits.clear(); // keep memory bounded
  return recent.length > MAX_PER_MINUTE;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const userId = await getUserId(req);
  if (!userId) {
    return res.status(401).json({ error: 'Please sign in to search locations.' });
  }
  if (throttled(userId)) {
    return res.status(429).json({ error: 'Too many searches. Please wait a minute.' });
  }

  const query = req.query.q;
  if (typeof query !== 'string' || query.trim().length < 2 || query.length > 120) {
    return res.status(400).json({ error: 'Enter a location between 2 and 120 characters.' });
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query.trim())}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
      headers: {
        // Nominatim requires a real identifying User-Agent. Set GEOCODE_USER_AGENT
        // in Vercel to your own site, e.g. "altar (https://your-site.vercel.app)".
        'User-Agent': process.env.GEOCODE_USER_AGENT || 'tarot-table (https://tarot-table-pi.vercel.app)',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Geocoding service unavailable.' });
    }

    const results = (await response.json()) as NominatimResult[];
    return res.status(200).json({
      results: results.map((r) => ({
        label: r.display_name,
        lat: parseFloat(r.lat),
        lng: parseFloat(r.lon),
      })),
    });
  } catch (err) {
    console.error('Geocode error:', err);
    return res.status(502).json({ error: 'Geocoding service unavailable.' });
  }
}

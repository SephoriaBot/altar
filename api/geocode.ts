import type { VercelRequest, VercelResponse } from '@vercel/node';

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const query = req.query.q;
  if (!query || typeof query !== 'string' || query.trim().length < 2) {
    return res.status(400).json({ error: 'Query parameter "q" is required (min 2 characters).' });
  }

  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      // Nominatim's usage policy requires a real identifying User-Agent —
      // replace tarot-table.vercel.app if your deployed domain differs.
      'User-Agent': 'tarot-table (https://tarot-table.vercel.app)',
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
}

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { buildNatalChart } from '../src/lib/chart';
import { getDbClient } from '../src/lib/db/client';

interface CreateChartBody {
  label?: string;
  birthDate: string;        // 'YYYY-MM-DD'
  birthTime?: string;       // 'HH:MM', omit if unknown
  birthLat: number;
  birthLng: number;
  birthLocationLabel?: string;
  houseSystem?: 'whole-sign' | 'equal';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    return handleCreate(req, res);
  }
  if (req.method === 'GET') {
    return handleList(req, res);
  }
  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const body = req.body as CreateChartBody;

  if (!body?.birthDate || body.birthLat == null || body.birthLng == null) {
    return res.status(400).json({ error: 'birthDate, birthLat, and birthLng are required.' });
  }

  const birthTimeKnown = Boolean(body.birthTime);
  const houseSystem = body.houseSystem ?? 'whole-sign';

  // Build a Date from the birth date/time. Assumes birthDate/birthTime are
  // already in UTC — if you collect local birth time, convert to UTC before
  // this point using the birth location's timezone.
  const isoDateTime = birthTimeKnown
    ? `${body.birthDate}T${body.birthTime}:00Z`
    : `${body.birthDate}T12:00:00Z`; // noon placeholder when time is unknown — angles/houses are skipped anyway
  const date = new Date(isoDateTime);

  if (Number.isNaN(date.getTime())) {
    return res.status(400).json({ error: 'Invalid birthDate/birthTime.' });
  }

  const chart = buildNatalChart(date, body.birthLat, body.birthLng, birthTimeKnown, houseSystem);
  const chartId = randomUUID();

  const db = getDbClient();

  await db.execute({
    sql: `INSERT INTO natal_charts
      (id, label, birth_date, birth_time, birth_time_known, birth_lat, birth_lng, birth_location_label, house_system, ascendant, midheaven, ramc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      chartId,
      body.label ?? null,
      body.birthDate,
      body.birthTime ?? null,
      birthTimeKnown ? 1 : 0,
      body.birthLat,
      body.birthLng,
      body.birthLocationLabel ?? null,
      houseSystem,
      chart.angles?.ascendant ?? null,
      chart.angles?.midheaven ?? null,
      chart.angles?.ramc ?? null,
    ],
  });

  for (const placement of chart.placements) {
    await db.execute({
      sql: `INSERT INTO chart_placements
        (chart_id, body, sign, degree, longitude, house, retrograde)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        chartId,
        placement.body,
        placement.sign,
        placement.degree,
        placement.longitude,
        placement.house,
        placement.retrograde ? 1 : 0,
      ],
    });
  }

  return res.status(201).json({ id: chartId, chart });
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  const db = getDbClient();
  const result = await db.execute('SELECT * FROM natal_charts ORDER BY created_at DESC');
  return res.status(200).json({ charts: result.rows });
}

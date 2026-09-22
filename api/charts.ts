import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { getDbClient } from '../src/lib/db/client';
import type { NatalChart } from '../src/lib/chart';

interface CreateChartBody {
  label?: string;
  birthDate: string;
  birthTime?: string;
  birthLat: number;
  birthLng: number;
  birthLocationLabel?: string;
  houseSystem?: 'whole-sign' | 'equal';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method === 'POST') {
      return await handleCreate(req, res);
    }

    if (req.method === 'GET') {
      return await handleList(req, res);
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Charts API error:', error);

    return res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

async function handleCreate(req: VercelRequest, res: VercelResponse) {
  const body = req.body as CreateChartBody;

  if (!body?.birthDate || body.birthLat == null || body.birthLng == null) {
    return res.status(400).json({
      error: 'birthDate, birthLat, and birthLng are required.',
    });
  }

  const birthTimeKnown = Boolean(body.birthTime);
  const houseSystem = body.houseSystem ?? 'whole-sign';

  const isoDateTime = birthTimeKnown
    ? `${body.birthDate}T${body.birthTime}:00Z`
    : `${body.birthDate}T12:00:00Z`;

  const date = new Date(isoDateTime);

  if (Number.isNaN(date.getTime())) {
    return res.status(400).json({
      error: 'Invalid birthDate/birthTime.',
    });
  }

  // Dynamic import keeps astronomy-engine on the ESM side of the
  // serverless runtime instead of loading it as CommonJS.
  const { buildNatalChart } = await import('../src/lib/chart');

  const chart: NatalChart = buildNatalChart(
    date,
    body.birthLat,
    body.birthLng,
    birthTimeKnown,
    houseSystem,
  );

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

  return res.status(201).json({
    id: chartId,
    chart,
  });
}

async function handleList(req: VercelRequest, res: VercelResponse) {
  const db = getDbClient();

  const result = await db.execute(
    'SELECT * FROM natal_charts ORDER BY created_at DESC',
  );

  return res.status(200).json({
    charts: result.rows,
  });
}
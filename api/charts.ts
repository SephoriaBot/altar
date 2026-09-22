import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { createClient } from '@libsql/client';

const Astronomy = require('astronomy-engine');

type HouseSystem = 'whole-sign' | 'equal';

const SIGNS = [
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
] as const;

type Sign = (typeof SIGNS)[number];

interface PlanetPlacement {
  sign: Sign;
  degree: number;
  longitude: number;
  retrograde: boolean;
}

interface ChartPlacement extends PlanetPlacement {
  body: string;
  house: number | null;
}

interface Angles {
  ascendant: number;
  midheaven: number;
  ramc: number;
  obliquity: number;
}

interface NatalChart {
  angles: Angles | null;
  houseCusps: number[] | null;
  placements: ChartPlacement[];
}

interface CreateChartBody {
  label?: string;
  birthDate: string;
  birthTime?: string;
  birthLat: number;
  birthLng: number;
  birthLocationLabel?: string;
  houseSystem?: HouseSystem;
}

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function longitudeToPlacement(
  lon: number,
  retrograde: boolean,
): PlanetPlacement {
  const longitude = norm360(lon);
  const signIndex = Math.floor(longitude / 30);

  return {
    sign: SIGNS[signIndex],
    degree: longitude - signIndex * 30,
    longitude,
    retrograde,
  };
}

function getPlanetPositions(date: Date): Record<string, PlanetPlacement> {
  const time = Astronomy.MakeTime(date);
  const results: Record<string, PlanetPlacement> = {};

  const bodies = [
    Astronomy.Body.Sun,
    Astronomy.Body.Moon,
    Astronomy.Body.Mercury,
    Astronomy.Body.Venus,
    Astronomy.Body.Mars,
    Astronomy.Body.Jupiter,
    Astronomy.Body.Saturn,
    Astronomy.Body.Uranus,
    Astronomy.Body.Neptune,
    Astronomy.Body.Pluto,
  ];

  for (const body of bodies) {
    const vec = Astronomy.GeoVector(body, time, true);
    const lon = Astronomy.Ecliptic(vec).elon;

    const laterVec = Astronomy.GeoVector(
      body,
      time.AddDays(1),
      true,
    );
    const laterLon = Astronomy.Ecliptic(laterVec).elon;

    let delta = laterLon - lon;

    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    results[body.toLowerCase()] = longitudeToPlacement(
      lon,
      delta < 0,
    );
  }

  return results;
}

function obliquity(time: any): number {
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  const T = time.tt / 36525.0;

  return (
    23.4392911 -
    0.0130042 * T -
    0.00000016 * T * T +
    0.000000504 * T * T * T
  ) * DEG * RAD;
}

function getAngles(
  date: Date,
  latitude: number,
  longitude: number,
): Angles {
  const DEG = Math.PI / 180;
  const RAD = 180 / Math.PI;

  const time = Astronomy.MakeTime(date);
  const epsDegrees = obliquity(time);
  const eps = epsDegrees * DEG;

  const gstHours = Astronomy.SiderealTime(time);
  const lstHours = gstHours + longitude / 15;
  const lstDeg = norm360(lstHours * 15);

  const ramc = lstDeg * DEG;
  const phi = latitude * DEG;

  const mc =
    Math.atan2(
      Math.sin(ramc),
      Math.cos(ramc) * Math.cos(eps),
    ) * RAD;

  const ascY = -Math.cos(ramc);

  const ascX =
    Math.sin(ramc) * Math.cos(eps) +
    Math.tan(phi) * Math.sin(eps);

  const asc =
    Math.atan2(ascY, ascX) * RAD;

  return {
    ascendant: norm360(asc),
    midheaven: norm360(mc),
    ramc: lstDeg,
    obliquity: epsDegrees,
  };
}

function getHouseCusps(
  ascendant: number,
  system: HouseSystem,
): number[] {
  if (system === 'whole-sign') {
    const ascSignIndex =
      Math.floor(norm360(ascendant) / 30);

    return Array.from(
      { length: 12 },
      (_, i) =>
        norm360((ascSignIndex + i) * 30),
    );
  }

  return Array.from(
    { length: 12 },
    (_, i) =>
      norm360(ascendant + i * 30),
  );
}

function assignHouse(
  longitude: number,
  cusps: number[],
): number {
  const lon = norm360(longitude);

  for (let i = 0; i < 12; i++) {
    const start = norm360(cusps[i]);

    const arcLength = norm360(
      cusps[(i + 1) % 12] - start,
    );

    const offset = norm360(lon - start);

    if (offset < arcLength || arcLength === 0) {
      return i + 1;
    }
  }

  throw new Error(
    `Could not assign house for longitude ${longitude}`,
  );
}

function buildNatalChart(
  date: Date,
  latitude: number,
  longitude: number,
  birthTimeKnown: boolean,
  houseSystem: HouseSystem,
): NatalChart {
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid chart date.');
  }

  if (
    Number.isNaN(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error('Latitude is out of range.');
  }

  if (
    Number.isNaN(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error('Longitude is out of range.');
  }

  const positions = getPlanetPositions(date);

  if (!birthTimeKnown) {
    return {
      angles: null,
      houseCusps: null,
      placements: Object.entries(positions).map(
        ([body, placement]) => ({
          body,
          house: null,
          ...placement,
        }),
      ),
    };
  }

  const angles = getAngles(
    date,
    latitude,
    longitude,
  );

  const houseCusps = getHouseCusps(
    angles.ascendant,
    houseSystem,
  );

  const placements = Object.entries(
    positions,
  ).map(([body, placement]) => ({
    body,
    house: assignHouse(
      placement.longitude,
      houseCusps,
    ),
    ...placement,
  }));

  return {
    angles,
    houseCusps,
    placements,
  };
}

function getDbClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    throw new Error(
      'Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN environment variables.',
    );
  }

  return createClient({
    url,
    authToken,
  });
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    if (req.method === 'POST') {
      return await handleCreate(req, res);
    }

    if (req.method === 'GET') {
      return await handleList(req, res);
    }

    res.setHeader('Allow', 'GET, POST');

    return res.status(405).json({
      error: 'Method not allowed',
    });
  } catch (error) {
    console.error('Charts API error:', error);

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}

async function handleCreate(
  req: VercelRequest,
  res: VercelResponse,
) {
  const body = req.body as CreateChartBody;

  if (
    !body?.birthDate ||
    body.birthLat == null ||
    body.birthLng == null
  ) {
    return res.status(400).json({
      error:
        'birthDate, birthLat, and birthLng are required.',
    });
  }

  const birthTimeKnown = Boolean(body.birthTime);
  const houseSystem =
    body.houseSystem ?? 'whole-sign';

  const isoDateTime = birthTimeKnown
    ? `${body.birthDate}T${body.birthTime}:00Z`
    : `${body.birthDate}T12:00:00Z`;

  const date = new Date(isoDateTime);

  if (Number.isNaN(date.getTime())) {
    return res.status(400).json({
      error: 'Invalid birthDate/birthTime.',
    });
  }

  const chart = buildNatalChart(
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

async function handleList(
  req: VercelRequest,
  res: VercelResponse,
) {
  const db = getDbClient();

  const result = await db.execute(
    'SELECT * FROM natal_charts ORDER BY created_at DESC',
  );

  return res.status(200).json({
    charts: result.rows,
  });
}
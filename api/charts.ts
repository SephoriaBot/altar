import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { createClient } from '@libsql/client';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
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

interface HouseInterpretation {
  house: number;
  name: string;
  sign: Sign;
  title: string;
  description: string;
}

interface NatalChart {
  angles: Angles | null;
  houseCusps: number[] | null;
  placements: ChartPlacement[];
  houseInterpretations: HouseInterpretation[];
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

/* ================================================================
   ASTROLOGY INTERPRETATION DATA
   ================================================================ */

const HOUSE_NAMES = [
  'Self & Identity',
  'Money & Values',
  'Communication & Learning',
  'Home & Family',
  'Creativity & Pleasure',
  'Work & Wellness',
  'Partnerships',
  'Intimacy & Transformation',
  'Beliefs & Expansion',
  'Career & Public Life',
  'Friends & Community',
  'Inner World & Spirituality',
] as const;

const HOUSE_THEMES = [
  'identity, appearance, self-expression, and how you approach life',
  'money, possessions, personal values, security, and self-worth',
  'communication, learning, siblings, short trips, and everyday thinking',
  'home, family, roots, emotional foundations, and private life',
  'creativity, romance, pleasure, hobbies, play, and personal expression',
  'work routines, health habits, service, responsibilities, and daily life',
  'one-to-one relationships, marriage, contracts, and close partnerships',
  'shared resources, intimacy, vulnerability, transformation, and deep bonds',
  'beliefs, higher education, travel, philosophy, spirituality, and meaning',
  'career, reputation, achievement, authority, and public life',
  'friendships, groups, community, hopes, and long-term aspirations',
  'the subconscious, solitude, dreams, spirituality, closure, and inner life',
] as const;

const SIGN_THEMES: Record<Sign, string> = {
  Aries:
    'initiative, independence, courage, action, and self-direction',

  Taurus:
    'stability, comfort, loyalty, resources, and patience',

  Gemini:
    'communication, curiosity, learning, adaptability, and ideas',

  Cancer:
    'emotional security, home, family, nurturing, and belonging',

  Leo:
    'creativity, confidence, self-expression, warmth, and recognition',

  Virgo:
    'organization, discernment, service, practicality, and improvement',

  Libra:
    'partnership, harmony, fairness, beauty, and cooperation',

  Scorpio:
    'depth, transformation, intimacy, trust, and emotional intensity',

  Sagittarius:
    'exploration, truth, meaning, optimism, and personal freedom',

  Capricorn:
    'responsibility, ambition, structure, achievement, and long-term goals',

  Aquarius:
    'independence, originality, community, innovation, and unconventional thinking',

  Pisces:
    'intuition, imagination, compassion, sensitivity, and spirituality',
};

/*
 * Shorter, more natural interpretations for each sign.
 * These are used to create the house reading shown to the user.
 */

const SIGN_HOUSE_OPENERS: Record<Sign, string> = {
  Aries:
    'You tend to approach this area of life directly, independently, and with a willingness to take the first step.',

  Taurus:
    'You tend to seek stability, comfort, and something dependable in this area of life.',

  Gemini:
    'You tend to approach this area of life with curiosity, flexibility, and a desire to understand or exchange ideas.',

  Cancer:
    'You tend to approach this area of life emotionally, intuitively, and with a strong need for security or belonging.',

  Leo:
    'You tend to bring warmth, creativity, confidence, and a desire for genuine self-expression to this area of life.',

  Virgo:
    'You tend to approach this area of life thoughtfully, practically, and with an instinct to improve or refine things.',

  Libra:
    'You tend to seek harmony, balance, beauty, and cooperation in this area of life.',

  Scorpio:
    'You tend to experience this area of life deeply, with an emphasis on trust, honesty, intimacy, and transformation.',

  Sagittarius:
    'You tend to approach this area of life with optimism, curiosity, independence, and a desire for greater meaning.',

  Capricorn:
    'You tend to approach this area of life seriously, patiently, and with an eye toward building something lasting.',

  Aquarius:
    'You tend to approach this area of life independently and unconventionally, often wanting the freedom to do things your own way.',

  Pisces:
    'You tend to experience this area of life intuitively, imaginatively, and with a strong sensitivity to people and surroundings.',
};

const SIGN_HOUSE_CLOSERS: Record<Sign, string> = {
  Aries:
    'You may feel most comfortable here when you have room to act on your own instincts and create momentum.',

  Taurus:
    'Consistency matters here, and you may prefer gradual progress over unnecessary disruption.',

  Gemini:
    'Variety and mental stimulation can help keep this part of your life feeling alive.',

  Cancer:
    'A sense of emotional safety can make it easier for you to fully engage with this part of your life.',

  Leo:
    'This area can become especially meaningful when you feel free to create, express yourself, and let your personality show.',

  Virgo:
    'You may feel most fulfilled here when your efforts have a practical purpose or make something noticeably better.',

  Libra:
    'You may feel most at ease here when there is mutual respect, fairness, and room for different perspectives.',

  Scorpio:
    'Surface-level answers may not satisfy you here; depth and authenticity tend to matter.',

  Sagittarius:
    'Growth can come through exploration, new experiences, and allowing your perspective to expand.',

  Capricorn:
    'You may become particularly determined here once you have a clear goal and something meaningful to work toward.',

  Aquarius:
    'You may thrive here when you are allowed to question conventions and make choices that genuinely feel like your own.',

  Pisces:
    'This area may benefit from quiet reflection, imagination, and trusting your intuition alongside practical considerations.',
};

/* ================================================================
   MATH / ASTROLOGY CALCULATIONS
   ================================================================ */

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

function getPlanetPositions(
  date: Date,
): Record<string, PlanetPlacement> {
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
    const vec = Astronomy.GeoVector(
      body,
      time,
      true,
    );

    const lon = Astronomy.Ecliptic(vec).elon;

    const laterVec = Astronomy.GeoVector(
      body,
      time.AddDays(1),
      true,
    );

    const laterLon =
      Astronomy.Ecliptic(laterVec).elon;

    let delta = laterLon - lon;

    if (delta > 180) {
      delta -= 360;
    }

    if (delta < -180) {
      delta += 360;
    }

    results[body.toLowerCase()] =
      longitudeToPlacement(
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

  const gstHours =
    Astronomy.SiderealTime(time);

  const lstHours =
    gstHours + longitude / 15;

  const lstDeg =
    norm360(lstHours * 15);

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
    Math.atan2(
      ascY,
      ascX,
    ) * RAD;

  return {
    ascendant: norm360(asc),
    midheaven: norm360(mc),
    ramc: lstDeg,
    obliquity: epsDegrees,
  };
}

/* ================================================================
   HOUSE CALCULATIONS
   ================================================================ */

function getHouseCusps(
  ascendant: number,
  system: HouseSystem,
): number[] {
  if (system === 'whole-sign') {
    const ascSignIndex =
      Math.floor(
        norm360(ascendant) / 30,
      );

    return Array.from(
      { length: 12 },
      (_, i) =>
        norm360(
          (ascSignIndex + i) * 30,
        ),
    );
  }

  return Array.from(
    { length: 12 },
    (_, i) =>
      norm360(
        ascendant + i * 30,
      ),
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

    const offset = norm360(
      lon - start,
    );

    if (
      offset < arcLength ||
      arcLength === 0
    ) {
      return i + 1;
    }
  }

  throw new Error(
    `Could not assign house for longitude ${longitude}`,
  );
}

/* ================================================================
   HOUSE INTERPRETATIONS
   ================================================================ */

function buildHouseInterpretations(
  ascendant: number,
  houseSystem: HouseSystem,
): HouseInterpretation[] {
  const cusps = getHouseCusps(
    ascendant,
    houseSystem,
  );

  return cusps.map(
    (cusp, index) => {
      const house = index + 1;

      const signIndex = Math.floor(
        norm360(cusp) / 30,
      );

      const sign = SIGNS[signIndex];

      const name =
        HOUSE_NAMES[index];

      const houseTheme =
        HOUSE_THEMES[index];

      const opener =
        SIGN_HOUSE_OPENERS[sign];

      const closer =
        SIGN_HOUSE_CLOSERS[sign];

      return {
        house,
        name,
        sign,

        title:
          `${sign} in the ${name} House`,

        description:
          `${opener} ` +
          `This placement colors your ${houseTheme}. ` +
          `${closer}`,
      };
    },
  );
}

/* ================================================================
   BUILD NATAL CHART
   ================================================================ */

function buildNatalChart(
  date: Date,
  latitude: number,
  longitude: number,
  birthTimeKnown: boolean,
  houseSystem: HouseSystem,
): NatalChart {
  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    throw new Error(
      'Invalid chart date.',
    );
  }

  if (
    Number.isNaN(latitude) ||
    latitude < -90 ||
    latitude > 90
  ) {
    throw new Error(
      'Latitude is out of range.',
    );
  }

  if (
    Number.isNaN(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new Error(
      'Longitude is out of range.',
    );
  }

  const positions =
    getPlanetPositions(date);

  /*
   * Without a known birth time, planets can still
   * be calculated, but houses and angles cannot be
   * reliably calculated.
   */

  if (!birthTimeKnown) {
    return {
      angles: null,
      houseCusps: null,
      houseInterpretations: [],

      placements:
        Object.entries(
          positions,
        ).map(
          ([body, placement]) => ({
            body,
            house: null,
            ...placement,
          }),
        ),
    };
  }

  const angles =
    getAngles(
      date,
      latitude,
      longitude,
    );

  const houseCusps =
    getHouseCusps(
      angles.ascendant,
      houseSystem,
    );

  const placements =
    Object.entries(
      positions,
    ).map(
      ([body, placement]) => ({
        body,

        house:
          assignHouse(
            placement.longitude,
            houseCusps,
          ),

        ...placement,
      }),
    );

  const houseInterpretations =
    buildHouseInterpretations(
      angles.ascendant,
      houseSystem,
    );

  return {
    angles,
    houseCusps,
    placements,
    houseInterpretations,
  };
}

/* ================================================================
   DATABASE
   ================================================================ */

function getDbClient() {
  const url =
    process.env.TURSO_DATABASE_URL;

  const authToken =
    process.env.TURSO_AUTH_TOKEN;

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

/* ================================================================
   API HANDLER
   ================================================================ */

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  try {
    if (req.method === 'POST') {
      return await handleCreate(
        req,
        res,
      );
    }

    if (req.method === 'GET') {
      return await handleList(
        req,
        res,
      );
    }

    res.setHeader(
      'Allow',
      'GET, POST',
    );

    return res.status(405).json({
      error:
        'Method not allowed',
    });
  } catch (error) {
    console.error(
      'Charts API error:',
      error,
    );

    return res.status(500).json({
      error:
        error instanceof Error
          ? error.message
          : String(error),
    });
  }
}

/* ================================================================
   CREATE CHART
   ================================================================ */

async function handleCreate(
  req: VercelRequest,
  res: VercelResponse,
) {
  const body =
    req.body as CreateChartBody;

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

  const birthTimeKnown =
    Boolean(body.birthTime);

  const houseSystem =
    body.houseSystem ??
    'whole-sign';

  const isoDateTime =
    birthTimeKnown
      ? `${body.birthDate}T${body.birthTime}:00Z`
      : `${body.birthDate}T12:00:00Z`;

  const date =
    new Date(isoDateTime);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return res.status(400).json({
      error:
        'Invalid birthDate/birthTime.',
    });
  }

  const chart =
    buildNatalChart(
      date,
      body.birthLat,
      body.birthLng,
      birthTimeKnown,
      houseSystem,
    );

  const chartId =
    randomUUID();

  const db =
    getDbClient();

  await db.execute({
    sql: `INSERT INTO natal_charts
      (
        id,
        label,
        birth_date,
        birth_time,
        birth_time_known,
        birth_lat,
        birth_lng,
        birth_location_label,
        house_system,
        ascendant,
        midheaven,
        ramc
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      chartId,

      body.label ?? null,

      body.birthDate,

      body.birthTime ??
        null,

      birthTimeKnown
        ? 1
        : 0,

      body.birthLat,

      body.birthLng,

      body.birthLocationLabel ??
        null,

      houseSystem,

      chart.angles
        ?.ascendant ??
        null,

      chart.angles
        ?.midheaven ??
        null,

      chart.angles
        ?.ramc ??
        null,
    ],
  });

  for (
    const placement of
    chart.placements
  ) {
    await db.execute({
      sql: `INSERT INTO chart_placements
        (
          chart_id,
          body,
          sign,
          degree,
          longitude,
          house,
          retrograde
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [
        chartId,

        placement.body,

        placement.sign,

        placement.degree,

        placement.longitude,

        placement.house,

        placement.retrograde
          ? 1
          : 0,
      ],
    });
  }

  return res.status(201).json({
    id: chartId,
    chart,
  });
}

/* ================================================================
   LIST CHARTS
   ================================================================ */

async function handleList(
  req: VercelRequest,
  res: VercelResponse,
) {
  const db =
    getDbClient();

  const result =
    await db.execute(
      'SELECT * FROM natal_charts ORDER BY created_at DESC',
    );

  return res.status(200).json({
    charts:
      result.rows,
  });
}
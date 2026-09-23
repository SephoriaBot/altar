import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { createClient } from '@libsql/client';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const Astronomy = require('astronomy-engine');

/* ================================================================
   TYPES
   ================================================================ */

type HouseSystem = 'whole-sign' | 'equal';

type ZodiacSystem = 'tropical' | 'sidereal';

type Ayanamsha = 'lahiri';

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

  /*
   * The original astronomical longitude is preserved.
   * This is useful if the frontend ever wants to display
   * both tropical and sidereal coordinates.
   */
  tropicalLongitude: number;
  zodiacLongitude: number;
}

interface Angles {
  ascendant: number;
  midheaven: number;
  ramc: number;
  obliquity: number;

  /*
   * Zodiac-adjusted angles.
   * The physical Ascendant/MC calculation itself does not change.
   */
  zodiacAscendant: number;
  zodiacMidheaven: number;
}

interface HouseInterpretation {
  house: number;
  name: string;
  sign: Sign;
  title: string;
  description: string;
  cusp: number;
}

interface NatalChart {
  zodiac: ZodiacSystem;
  ayanamsha: Ayanamsha | null;
  ayanamshaDegrees: number | null;

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

  /*
   * Defaults to tropical so existing charts continue
   * behaving the same way unless the frontend explicitly
   * requests sidereal.
   */
  zodiac?: ZodiacSystem;

  /*
   * Currently Lahiri is supported.
   * Keeping this as a setting makes it easy to add
   * Fagan/Bradley or another ayanamsha later.
   */
  ayanamsha?: Ayanamsha;
}

/* ================================================================
   INTERPRETATION DATA
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
   BASIC MATH
   ================================================================ */

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

/* ================================================================
   SIDEREAL / AYANAMSHA
   ================================================================ */

/*
 * Lahiri ayanamsha.
 *
 * Lahiri is a commonly used sidereal reference. The published
 * Lahiri value at 2000-01-01 is approximately:
 *
 * 23°51'11"
 *
 * We calculate its date-dependent value using the mean precession
 * rate of approximately 50.29 arcseconds per year.
 *
 * This is intentionally isolated in its own function so that a
 * more exact ephemeris-based ayanamsha implementation can be
 * substituted later without changing the rest of the chart code.
 */

function getLahiriAyanamsha(
  date: Date,
): number {
  const referenceDate =
    Date.UTC(
      2000,
      0,
      1,
      0,
      0,
      0,
    );

  const millisecondsPerYear =
    365.2425 *
    24 *
    60 *
    60 *
    1000;

  const years =
    (date.getTime() -
      referenceDate) /
    millisecondsPerYear;

  const baseDegrees =
    23 +
    51 / 60 +
    11 / 3600;

  const precessionDegreesPerYear =
    50.29 / 3600;

  return (
    baseDegrees +
    years *
      precessionDegreesPerYear
  );
}

function getAyanamsha(
  date: Date,
  zodiac: ZodiacSystem,
  ayanamsha: Ayanamsha,
): number {
  if (zodiac === 'tropical') {
    return 0;
  }

  if (ayanamsha === 'lahiri') {
    return getLahiriAyanamsha(
      date,
    );
  }

  return 0;
}

/*
 * Convert a tropical longitude into the selected zodiac.
 *
 * Tropical:
 *   longitude stays unchanged.
 *
 * Sidereal:
 *   ayanamsha is subtracted.
 */
function convertLongitudeToZodiac(
  tropicalLongitude: number,
  zodiac: ZodiacSystem,
  ayanamshaDegrees: number,
): number {
  if (zodiac === 'tropical') {
    return norm360(
      tropicalLongitude,
    );
  }

  return norm360(
    tropicalLongitude -
      ayanamshaDegrees,
  );
}

/* ================================================================
   PLANET POSITIONS
   ================================================================ */

function longitudeToPlacement(
  lon: number,
  retrograde: boolean,
): PlanetPlacement {
  const longitude = norm360(lon);

  const signIndex =
    Math.floor(
      longitude / 30,
    );

  return {
    sign: SIGNS[signIndex],
    degree:
      longitude -
      signIndex * 30,
    longitude,
    retrograde,
  };
}

function getPlanetPositions(
  date: Date,
): Record<string, PlanetPlacement> {
  const time =
    Astronomy.MakeTime(date);

  const results:
    Record<
      string,
      PlanetPlacement
    > = {};

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

  for (
    const body of bodies
  ) {
    const vec =
      Astronomy.GeoVector(
        body,
        time,
        true,
      );

    /*
     * Astronomy Engine's ecliptic coordinates account for the
     * date-dependent orientation of the ecliptic/equinox system.
     * We preserve this as the tropical longitude and then apply
     * the selected zodiac conversion afterward.
     */
    const tropicalLongitude =
      norm360(
        Astronomy.Ecliptic(
          vec,
        ).elon,
      );

    const laterVec =
      Astronomy.GeoVector(
        body,
        time.AddDays(1),
        true,
      );

    const laterLongitude =
      norm360(
        Astronomy.Ecliptic(
          laterVec,
        ).elon,
      );

    let delta =
      laterLongitude -
      tropicalLongitude;

    if (delta > 180) {
      delta -= 360;
    }

    if (delta < -180) {
      delta += 360;
    }

    results[
      body.toLowerCase()
    ] =
      longitudeToPlacement(
        tropicalLongitude,
        delta < 0,
      );
  }

  return results;
}

/* ================================================================
   ANGLES
   ================================================================ */

function obliquity(
  time: any,
): number {
  const DEG =
    Math.PI / 180;

  const RAD =
    180 / Math.PI;

  const T =
    time.tt / 36525.0;

  return (
    23.4392911 -
    0.0130042 * T -
    0.00000016 *
      T *
      T +
    0.000000504 *
      T *
      T *
      T
  ) * DEG * RAD;
}

function getAngles(
  date: Date,
  latitude: number,
  longitude: number,
  zodiac: ZodiacSystem,
  ayanamshaDegrees: number,
): Angles {
  const DEG =
    Math.PI / 180;

  const RAD =
    180 / Math.PI;

  const time =
    Astronomy.MakeTime(date);

  const epsDegrees =
    obliquity(time);

  const eps =
    epsDegrees * DEG;

  const gstHours =
    Astronomy.SiderealTime(
      time,
    );

  const lstHours =
    gstHours +
    longitude / 15;

  const lstDeg =
    norm360(
      lstHours * 15,
    );

  const ramc =
    lstDeg * DEG;

  const phi =
    latitude * DEG;

  const mc =
    Math.atan2(
      Math.sin(ramc),
      Math.cos(ramc) *
        Math.cos(eps),
    ) * RAD;

  const ascY =
    -Math.cos(ramc);

  const ascX =
    Math.sin(ramc) *
      Math.cos(eps) +
    Math.tan(phi) *
      Math.sin(eps);

  const asc =
    Math.atan2(
      ascY,
      ascX,
    ) * RAD;

  const tropicalAscendant =
    norm360(asc);

  const tropicalMidheaven =
    norm360(mc);

  const zodiacAscendant =
    convertLongitudeToZodiac(
      tropicalAscendant,
      zodiac,
      ayanamshaDegrees,
    );

  const zodiacMidheaven =
    convertLongitudeToZodiac(
      tropicalMidheaven,
      zodiac,
      ayanamshaDegrees,
    );

  return {
    ascendant:
      tropicalAscendant,

    midheaven:
      tropicalMidheaven,

    ramc:
      lstDeg,

    obliquity:
      epsDegrees,

    zodiacAscendant,

    zodiacMidheaven,
  };
}

/* ================================================================
   HOUSE CUSPS
   ================================================================ */

function getHouseCusps(
  ascendant: number,
  system: HouseSystem,
): number[] {
  if (
    system === 'whole-sign'
  ) {
    const ascSignIndex =
      Math.floor(
        norm360(
          ascendant,
        ) / 30,
      );

    return Array.from(
      { length: 12 },
      (_, i) =>
        norm360(
          (ascSignIndex + i) *
            30,
        ),
    );
  }

  return Array.from(
    { length: 12 },
    (_, i) =>
      norm360(
        ascendant +
          i * 30,
      ),
  );
}

function assignHouse(
  longitude: number,
  cusps: number[],
): number {
  const lon =
    norm360(longitude);

  for (
    let i = 0;
    i < 12;
    i++
  ) {
    const start =
      norm360(cusps[i]);

    const arcLength =
      norm360(
        cusps[
          (i + 1) % 12
        ] - start,
      );

    const offset =
      norm360(
        lon - start,
      );

    if (
      offset <
        arcLength ||
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
  zodiac: ZodiacSystem,
  ayanamshaDegrees: number,
): HouseInterpretation[] {
  /*
   * House geometry is calculated from the physical Ascendant.
   * Then each cusp is converted into the selected zodiac before
   * deciding which sign rules that house.
   */
  const tropicalCusps =
    getHouseCusps(
      ascendant,
      houseSystem,
    );

  return tropicalCusps.map(
    (tropicalCusp, index) => {
      const house =
        index + 1;

      const zodiacCusp =
        convertLongitudeToZodiac(
          tropicalCusp,
          zodiac,
          ayanamshaDegrees,
        );

      const signIndex =
        Math.floor(
          zodiacCusp / 30,
        );

      const sign =
        SIGNS[signIndex];

      const name =
        HOUSE_NAMES[index];

      const houseTheme =
        HOUSE_THEMES[index];

      const opener =
        SIGN_HOUSE_OPENERS[
          sign
        ];

      const closer =
        SIGN_HOUSE_CLOSERS[
          sign
        ];

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

        cusp:
          zodiacCusp,
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
  zodiac: ZodiacSystem,
  ayanamsha: Ayanamsha,
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

  const ayanamshaDegrees =
    getAyanamsha(
      date,
      zodiac,
      ayanamsha,
    );

  const positions =
    getPlanetPositions(date);

  /*
   * Without a birth time, planets can still be calculated.
   * Houses and angles cannot reliably be calculated.
   */
  if (!birthTimeKnown) {
    const placements =
      Object.entries(
        positions,
      ).map(
        ([body, placement]) => {
          const tropicalLongitude =
            placement.longitude;

          const zodiacLongitude =
            convertLongitudeToZodiac(
              tropicalLongitude,
              zodiac,
              ayanamshaDegrees,
            );

          const zodiacPlacement =
            longitudeToPlacement(
              zodiacLongitude,
              placement.retrograde,
            );

          return {
            body,

            house: null,

            sign:
              zodiacPlacement.sign,

            degree:
              zodiacPlacement.degree,

            longitude:
              zodiacPlacement.longitude,

            retrograde:
              placement.retrograde,

            tropicalLongitude,

            zodiacLongitude,
          };
        },
      );

    return {
      zodiac,

      ayanamsha:
        zodiac === 'sidereal'
          ? ayanamsha
          : null,

      ayanamshaDegrees:
        zodiac === 'sidereal'
          ? ayanamshaDegrees
          : null,

      angles: null,

      houseCusps: null,

      houseInterpretations: [],

      placements,
    };
  }

  const angles =
    getAngles(
      date,
      latitude,
      longitude,
      zodiac,
      ayanamshaDegrees,
    );

  /*
   * House geometry stays tied to the physical/tropical
   * Ascendant calculation.
   */
  const tropicalHouseCusps =
    getHouseCusps(
      angles.ascendant,
      houseSystem,
    );

  /*
   * For planetary house assignment, the physical longitude
   * and physical house cusps are used. The zodiac system
   * determines the sign labels, not which physical house
   * a planet occupies.
   */
  const placements =
    Object.entries(
      positions,
    ).map(
      ([body, placement]) => {
        const tropicalLongitude =
          placement.longitude;

        const zodiacLongitude =
          convertLongitudeToZodiac(
            tropicalLongitude,
            zodiac,
            ayanamshaDegrees,
          );

        const zodiacPlacement =
          longitudeToPlacement(
            zodiacLongitude,
            placement.retrograde,
          );

        return {
          body,

          house:
            assignHouse(
              tropicalLongitude,
              tropicalHouseCusps,
            ),

          sign:
            zodiacPlacement.sign,

          degree:
            zodiacPlacement.degree,

          longitude:
            zodiacPlacement.longitude,

          retrograde:
            placement.retrograde,

          tropicalLongitude,

          zodiacLongitude,
        };
      },
    );

  const houseInterpretations =
    buildHouseInterpretations(
      angles.ascendant,
      houseSystem,
      zodiac,
      ayanamshaDegrees,
    );

  /*
   * Expose house cusps in the selected zodiac so the frontend
   * does not accidentally label sidereal charts with tropical
   * cusp degrees.
   */
  const zodiacHouseCusps =
    tropicalHouseCusps.map(
      (cusp) =>
        convertLongitudeToZodiac(
          cusp,
          zodiac,
          ayanamshaDegrees,
        ),
    );

  return {
    zodiac,

    ayanamsha:
      zodiac === 'sidereal'
        ? ayanamsha
        : null,

    ayanamshaDegrees:
      zodiac === 'sidereal'
        ? ayanamshaDegrees
        : null,

    angles,

    houseCusps:
      zodiacHouseCusps,

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
    if (
      req.method === 'POST'
    ) {
      return await handleCreate(
        req,
        res,
      );
    }

    if (
      req.method === 'GET'
    ) {
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

  /*
   * Tropical remains the default so existing frontend
   * requests continue producing the same zodiac system.
   */
  const zodiac =
    body.zodiac ??
    'tropical';

  /*
   * Lahiri is currently the only supported sidereal
   * ayanamsha.
   */
  const ayanamsha =
    body.ayanamsha ??
    'lahiri';

  if (
    zodiac !== 'tropical' &&
    zodiac !== 'sidereal'
  ) {
    return res.status(400).json({
      error:
        'zodiac must be tropical or sidereal.',
    });
  }

  if (
    ayanamsha !== 'lahiri'
  ) {
    return res.status(400).json({
      error:
        'Currently only the Lahiri ayanamsha is supported.',
    });
  }

  const isoDateTime =
    birthTimeKnown
      ? `${body.birthDate}T${body.birthTime}:00Z`
      : `${body.birthDate}T12:00:00Z`;

  const date =
    new Date(
      isoDateTime,
    );

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
      zodiac,
      ayanamsha,
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
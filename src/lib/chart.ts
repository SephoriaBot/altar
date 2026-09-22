import { getPlanetPositions, type PlanetPlacement } from './positions.js';
import { getAngles, getHouseCusps, assignHouse, type HouseSystem, type Angles } from './houses.js';

export interface ChartPlacement extends PlanetPlacement {
  body: string;
  house: number | null; // null when birth time is unknown
}

export interface NatalChart {
  angles: Angles | null;   // null when birth time is unknown
  houseCusps: number[] | null;
  placements: ChartPlacement[];
}

function wrapStep<T>(step: string, fn: () => T): T {
  try {
    return fn();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`buildNatalChart failed at "${step}": ${message}`);
  }
}

/**
 * Build a full natal chart. If birthTimeKnown is false, angles and houses
 * are skipped (they're meaningless without an exact birth time) — planets
 * still get their sign/degree/retrograde.
 */
export function buildNatalChart(
  date: Date,
  latitude: number,
  longitude: number,
  birthTimeKnown: boolean,
  houseSystem: HouseSystem = 'whole-sign',
): NatalChart {
  if (Number.isNaN(date.getTime())) {
    throw new Error(`buildNatalChart failed at "input validation": date is invalid (${date}).`);
  }
  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw new Error(`buildNatalChart failed at "input validation": latitude out of range (${latitude}).`);
  }
  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    throw new Error(`buildNatalChart failed at "input validation": longitude out of range (${longitude}).`);
  }

  const positions = wrapStep('getPlanetPositions', () => getPlanetPositions(date));

  if (!birthTimeKnown) {
    return {
      angles: null,
      houseCusps: null,
      placements: Object.entries(positions).map(([body, placement]) => ({
        body,
        house: null,
        ...placement,
      })),
    };
  }

  const angles = wrapStep('getAngles', () => getAngles(date, latitude, longitude));
  const houseCusps = wrapStep('getHouseCusps', () => getHouseCusps(angles.ascendant, houseSystem));

  const placements: ChartPlacement[] = Object.entries(positions).map(([body, placement]) =>
    wrapStep(`assignHouse (${body})`, () => ({
      body,
      house: assignHouse(placement.longitude, houseCusps),
      ...placement,
    })),
  );

  return { angles, houseCusps, placements };
}

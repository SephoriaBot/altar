import { getPlanetPositions, type PlanetPlacement } from './positions';
import { getAngles, getHouseCusps, assignHouse, type HouseSystem, type Angles } from './houses';

export interface ChartPlacement extends PlanetPlacement {
  body: string;
  house: number | null; // null when birth time is unknown
}

export interface NatalChart {
  angles: Angles | null;   // null when birth time is unknown
  houseCusps: number[] | null;
  placements: ChartPlacement[];
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
  const positions = getPlanetPositions(date);

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

  const angles = getAngles(date, latitude, longitude);
  const houseCusps = getHouseCusps(angles.ascendant, houseSystem);

  const placements: ChartPlacement[] = Object.entries(positions).map(([body, placement]) => ({
    body,
    house: assignHouse(placement.longitude, houseCusps),
    ...placement,
  }));

  return { angles, houseCusps, placements };
}

import * as Astronomy from 'astronomy-engine';

export const SIGNS = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export type Sign = (typeof SIGNS)[number];

export interface PlanetPlacement {
  sign: Sign;
  degree: number;      // 0-30, position within the sign
  longitude: number;    // 0-360, absolute ecliptic longitude
  retrograde: boolean;
}

const BODIES = [
  'Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter',
  'Saturn', 'Uranus', 'Neptune', 'Pluto',
] as const;

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

function longitudeToPlacement(lon: number, retrograde: boolean): PlanetPlacement {
  const longitude = norm360(lon);
  const signIndex = Math.floor(longitude / 30);
  return {
    sign: SIGNS[signIndex],
    degree: longitude - signIndex * 30,
    longitude,
    retrograde,
  };
}

/**
 * Calculate ecliptic longitude, sign, degree, and retrograde status
 * for the Sun through Pluto at a given UTC date.
 *
 * Retrograde is determined by comparing longitude to longitude 1 day later —
 * cheap and accurate enough outside of exact stations.
 */
export function getPlanetPositions(date: Date): Record<string, PlanetPlacement> {
  const time = Astronomy.MakeTime(date);
  const results: Record<string, PlanetPlacement> = {};

  for (const body of BODIES) {
    const vec = Astronomy.GeoVector(body, time, true);
    const lon = Astronomy.Ecliptic(vec).elon;

    const laterVec = Astronomy.GeoVector(body, time.AddDays(1), true);
    const laterLon = Astronomy.Ecliptic(laterVec).elon;

    let delta = laterLon - lon;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    results[body.toLowerCase()] = longitudeToPlacement(lon, delta < 0);
  }

  return results;
}

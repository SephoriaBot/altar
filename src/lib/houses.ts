import * as Astronomy from 'astronomy-engine';

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

function norm360(x: number): number {
  return ((x % 360) + 360) % 360;
}

/** Obliquity of the ecliptic (degrees) at a given date. */
function obliquity(time: Astronomy.AstroTime): number {
  // time.tt is already Julian centuries' worth of *days* since J2000 (TT) in astronomy-engine
  const T = time.tt / 36525.0;
  return 23.4392911 - 0.0130042 * T - 0.00000016 * T * T + 0.000000504 * T * T * T;
}

/** Local sidereal time in degrees for a given date and longitude (east positive). */
function localSiderealTimeDeg(time: Astronomy.AstroTime, longitude: number): number {
  const gstHours = Astronomy.SiderealTime(time);
  const lstHours = gstHours + longitude / 15;
  return norm360(lstHours * 15);
}

export interface Angles {
  ascendant: number;  // ecliptic longitude, 0-360
  midheaven: number;
  ramc: number;        // right ascension of MC, degrees
  obliquity: number;   // degrees
}

/**
 * Ascendant and Midheaven for a birth date/time/location.
 * Requires a known birth time — these are meaningless without one.
 */
export function getAngles(date: Date, latitude: number, longitude: number): Angles {
  const time = Astronomy.MakeTime(date);
  const eps = obliquity(time) * DEG;
  const lstDeg = localSiderealTimeDeg(time, longitude);
  const ramc = lstDeg * DEG;
  const phi = latitude * DEG;

  const mc = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps)) * RAD;

  const ascY = -Math.cos(ramc);
  const ascX = Math.sin(ramc) * Math.cos(eps) + Math.tan(phi) * Math.sin(eps);
  const asc = Math.atan2(ascY, ascX) * RAD;

  return {
    ascendant: norm360(asc),
    midheaven: norm360(mc),
    ramc: lstDeg,
    obliquity: eps * RAD,
  };
}

export type HouseSystem = 'whole-sign' | 'equal';

/** House cusps as 12 ecliptic longitudes, index 0 = house 1 cusp. */
export function getHouseCusps(ascendant: number, system: HouseSystem): number[] {
  if (system === 'whole-sign') {
    const ascSignIndex = Math.floor(norm360(ascendant) / 30);
    return Array.from({ length: 12 }, (_, i) => norm360((ascSignIndex + i) * 30));
  }
  // equal
  return Array.from({ length: 12 }, (_, i) => norm360(ascendant + i * 30));
}

/**
 * Given a planet's ecliptic longitude and a set of 12 house cusps (in house
 * order, index 0 = house 1), return which house (1-12) it falls in.
 *
 * Works for any house system where cusps progress around the circle in
 * order — whole-sign, equal, or (once fixed) Placidus/Koch/etc. Handles the
 * 360°→0° wraparound.
 */
export function assignHouse(longitude: number, cusps: number[]): number {
  const lon = norm360(longitude);
  for (let i = 0; i < 12; i++) {
    const start = norm360(cusps[i]);
    const arcLength = norm360(cusps[(i + 1) % 12] - start);
    const offset = norm360(lon - start);
    if (offset < arcLength || arcLength === 0) {
      return i + 1;
    }
  }
  // Should never happen if cusps form a valid partition of the circle.
  throw new Error(`Could not assign house for longitude ${longitude}`);
}

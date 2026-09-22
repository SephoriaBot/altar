import tzlookup from 'tz-lookup';
import { fromZonedTime } from 'date-fns-tz';

/**
 * Given a birth date/time as entered by the person (local wall-clock time —
 * "what the clock on the wall said at birth") and the birth coordinates,
 * return the equivalent UTC Date.
 *
 * Uses the IANA tz database via `tz-lookup` + `date-fns-tz`, so historical
 * DST rules and timezone boundary changes are handled correctly — this is
 * NOT hand-rolled offset math.
 */
export function localBirthTimeToUtc(
  birthDate: string, // 'YYYY-MM-DD'
  birthTime: string, // 'HH:MM', 24-hour
  latitude: number,
  longitude: number,
): Date {
  const zone = tzlookup(latitude, longitude);
  const wallTime = `${birthDate}T${birthTime}:00`;
  return fromZonedTime(wallTime, zone);
}

/** Resolve just the IANA timezone name for a location — useful for display. */
export function timezoneForLocation(latitude: number, longitude: number): string {
  return tzlookup(latitude, longitude);
}

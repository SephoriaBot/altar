// Pure input checks for creating a natal chart. Returns an error string, or null if OK.
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function validateChartBody(b: any): string | null {
  if (!b || typeof b !== 'object') return 'Invalid request.';

  if (typeof b.birthDate !== 'string' || !DATE_RE.test(b.birthDate)) {
    return 'birthDate must look like YYYY-MM-DD.';
  }
  const year = Number(b.birthDate.slice(0, 4));
  if (year < 1800 || year > 2100) return 'birthDate is out of range.';

  if (b.birthTime != null && b.birthTime !== '') {
    if (typeof b.birthTime !== 'string' || !TIME_RE.test(b.birthTime)) {
      return 'birthTime must look like HH:MM.';
    }
  }

  const lat = b.birthLat;
  const lng = b.birthLng;
  if (typeof lat !== 'number' || !Number.isFinite(lat) || lat < -90 || lat > 90) {
    return 'birthLat must be a number between -90 and 90.';
  }
  if (typeof lng !== 'number' || !Number.isFinite(lng) || lng < -180 || lng > 180) {
    return 'birthLng must be a number between -180 and 180.';
  }

  if (b.label != null && (typeof b.label !== 'string' || b.label.length > 80)) {
    return 'label must be text up to 80 characters.';
  }
  if (
    b.birthLocationLabel != null &&
    (typeof b.birthLocationLabel !== 'string' || b.birthLocationLabel.length > 200)
  ) {
    return 'birthLocationLabel must be text up to 200 characters.';
  }

  if (b.houseSystem != null && b.houseSystem !== 'whole-sign' && b.houseSystem !== 'equal') {
    return 'houseSystem must be whole-sign or equal.';
  }
  return null;
}

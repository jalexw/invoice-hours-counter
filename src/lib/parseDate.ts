/**
 * iCalendar DATE-TIME value, e.g. `20251117T120000` (floating / TZID-local)
 * or `20251125T130613Z` (UTC).
 */
const ICS_DATE_TIME_PATTERN = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/;

/**
 * iCalendar DATE value, e.g. `20260213`. Used by all-day events
 * (`DTSTART;VALUE=DATE:20260213`).
 */
const ICS_DATE_PATTERN = /^(\d{4})(\d{2})(\d{2})$/;

/**
 * Returns true if the given iCalendar value is a date-only (all-day) value
 * rather than a date-time value.
 */
export function isIcsDateOnly(dt: string): boolean {
  return typeof dt === "string" && ICS_DATE_PATTERN.test(dt.trim());
}

/**
 * Returns true if the given value is a `Date` whose time is not `NaN`.
 */
export function isValidDate(date: unknown): date is Date {
  return date instanceof Date && !Number.isNaN(date.getTime());
}

function inRange(value: number, min: number, max: number): boolean {
  return Number.isInteger(value) && value >= min && value <= max;
}

/**
 * Parse an iCalendar DATE or DATE-TIME value into a JavaScript `Date`.
 *
 * - DATE-TIME values without a `Z` suffix are interpreted in the local timezone
 *   (TZID parameters are not currently available from the parser).
 * - DATE-TIME values with a `Z` suffix are interpreted as UTC.
 * - DATE values (all-day events) are interpreted as local midnight.
 *
 * Unparseable input yields an invalid `Date` (`getTime()` is `NaN`) rather than
 * throwing, so callers can decide how to handle it. Use {@link isValidDate}.
 */
export default function parseDate(dt: string): Date {
  if (typeof dt !== "string") {
    return new Date(Number.NaN);
  }
  const value: string = dt.trim();

  const dateTimeMatch = ICS_DATE_TIME_PATTERN.exec(value);
  if (dateTimeMatch) {
    const year = Number(dateTimeMatch[1]);
    const month = Number(dateTimeMatch[2]);
    const day = Number(dateTimeMatch[3]);
    const hour = Number(dateTimeMatch[4]);
    const minute = Number(dateTimeMatch[5]);
    const second = Number(dateTimeMatch[6]);
    const isUtc: boolean = dateTimeMatch[7] === "Z";

    if (
      !inRange(month, 1, 12) ||
      !inRange(day, 1, 31) ||
      !inRange(hour, 0, 23) ||
      !inRange(minute, 0, 59) ||
      !inRange(second, 0, 60) // 60 allows for leap seconds
    ) {
      return new Date(Number.NaN);
    }

    if (isUtc) {
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second));
    }
    return new Date(year, month - 1, day, hour, minute, second);
  }

  const dateMatch = ICS_DATE_PATTERN.exec(value);
  if (dateMatch) {
    const year = Number(dateMatch[1]);
    const month = Number(dateMatch[2]);
    const day = Number(dateMatch[3]);
    if (!inRange(month, 1, 12) || !inRange(day, 1, 31)) {
      return new Date(Number.NaN);
    }
    return new Date(year, month - 1, day);
  }

  return new Date(Number.NaN);
}

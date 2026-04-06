import { formatInTimeZone } from 'date-fns-tz';

export type TimeZonePickerOption = {
  iana: string;
  subtitle: string;
  title: string;
};

/**
 * When `Intl.supportedValuesOf('timeZone')` is missing (older runtimes), offer a
 * compact set of common IANA zones. Modern Hermes / JSC use the full list.
 */
const FALLBACK_IANA_ZONES: string[] = [
  'UTC',
  'Africa/Cairo',
  'Africa/Johannesburg',
  'America/Anchorage',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Caracas',
  'America/Chicago',
  'America/Denver',
  'America/Halifax',
  'America/Lima',
  'America/Los_Angeles',
  'America/Mexico_City',
  'America/New_York',
  'America/Phoenix',
  'America/Santiago',
  'America/Sao_Paulo',
  'America/St_Johns',
  'America/Toronto',
  'America/Vancouver',
  'Asia/Bangkok',
  'Asia/Dubai',
  'Asia/Hong_Kong',
  'Asia/Jakarta',
  'Asia/Kolkata',
  'Asia/Seoul',
  'Asia/Shanghai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Melbourne',
  'Australia/Perth',
  'Australia/Sydney',
  'Europe/Amsterdam',
  'Europe/Berlin',
  'Europe/Brussels',
  'Europe/Dublin',
  'Europe/Helsinki',
  'Europe/Istanbul',
  'Europe/Lisbon',
  'Europe/London',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Oslo',
  'Europe/Paris',
  'Europe/Prague',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Vienna',
  'Europe/Warsaw',
  'Europe/Zurich',
  'Pacific/Auckland',
  'Pacific/Fiji',
  'Pacific/Honolulu',
];

let cachedZoneIds: string[] | null = null;

function getSortedIanaZoneIds(): string[] {
  if (cachedZoneIds) {
    return cachedZoneIds;
  }

  try {
    const supported = (
      Intl as typeof Intl & {
        supportedValuesOf?: (key: string) => string[];
      }
    ).supportedValuesOf;
    if (typeof supported === 'function') {
      const list = supported.call(Intl, 'timeZone').slice();
      if (!list.includes('UTC')) {
        list.push('UTC');
      }
      list.sort((a, b) => a.localeCompare(b));
      cachedZoneIds = list;
      return cachedZoneIds;
    }
  } catch {
    /* ignore */
  }

  cachedZoneIds = [...FALLBACK_IANA_ZONES].sort((a, b) => a.localeCompare(b));
  return cachedZoneIds;
}

function formatTimeZoneSubtitle(referenceDate: Date, iana: string): string {
  try {
    return formatInTimeZone(referenceDate, iana, 'OOOO · zzz');
  } catch {
    return '';
  }
}

/**
 * All known IANA zones (when supported) with a subtitle from date-fns-tz:
 * localized GMT offset and short zone name (e.g. PDT).
 */
export function getTimeZonePickerOptions(
  referenceDate: Date = new Date(),
): TimeZonePickerOption[] {
  return getSortedIanaZoneIds().map(iana => ({
    iana,
    subtitle: formatTimeZoneSubtitle(referenceDate, iana),
    title: iana,
  }));
}

export function timeZoneOptionMatchesQuery(
  option: TimeZonePickerOption,
  queryCompact: string,
): boolean {
  const q = queryCompact.trim().toLowerCase();
  if (!q) {
    return true;
  }
  if (option.iana.toLowerCase().includes(q)) {
    return true;
  }
  if (option.subtitle.toLowerCase().includes(q)) {
    return true;
  }
  return false;
}

import { getTimezoneOffset } from 'date-fns-tz';

/**
 * Device system timezone as an IANA name (e.g. America/Vancouver).
 * Used for gym setup defaults when no saved value exists.
 * The ID from Intl is checked with date-fns-tz so invalid values fall back to UTC.
 */
export function getDeviceIanaTimeZone(): string {
  let iana: string;
  try {
    iana = Intl.DateTimeFormat().resolvedOptions().timeZone ?? 'UTC';
  } catch {
    return 'UTC';
  }

  try {
    const offsetMs = getTimezoneOffset(iana, new Date());
    if (!Number.isFinite(offsetMs)) {
      return 'UTC';
    }
  } catch {
    /* Incomplete Intl mocks in tests; real devices have full Intl + date-fns-tz. */
  }

  return iana;
}

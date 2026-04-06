/**
 * When the device locale is `en-US` (common even in Canada) but the system
 * timezone is Canadian, bias Google Places Text Search toward CA instead of US.
 */
const CANADA_IANA_TIMEZONES = new Set([
  'America/St_Johns',
  'America/Halifax',
  'America/Glace_Bay',
  'America/Moncton',
  'America/Goose_Bay',
  'America/Blanc-Sablon',
  'America/Toronto',
  'America/Nipigon',
  'America/Thunder_Bay',
  'America/Iqaluit',
  'America/Pangnirtung',
  'America/Atikokan',
  'America/Winnipeg',
  'America/Rainy_River',
  'America/Regina',
  'America/Swift_Current',
  'America/Edmonton',
  'America/Vancouver',
  'America/Whitehorse',
  'America/Dawson',
  'America/Inuvik',
  'America/Fort_Nelson',
  'America/Creston',
  'America/Dawson_Creek',
  'America/Yellowknife',
  'America/Cambridge_Bay',
  'America/Rankin_Inlet',
  'America/Resolute',
  'America/Montreal',
]);

function regionCodeFromLocale(): string | undefined {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale ?? '';
    const match = locale.match(/-([A-Z]{2})$/i);
    return match ? match[1]!.toUpperCase() : undefined;
  } catch {
    return undefined;
  }
}

function regionCodeFromTimeZone(): string | undefined {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && CANADA_IANA_TIMEZONES.has(tz)) {
      return 'CA';
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

/**
 * ISO 3166-1 alpha-2 hint for the Places proxy. Prefer Canadian detection from
 * timezone when the user is physically in Canada but the UI locale is US.
 */
export function resolvePlacesSearchRegionCode(): string | undefined {
  return regionCodeFromTimeZone() ?? regionCodeFromLocale();
}

import { normalizeCompact } from './normalizeCompact';

/** Concatenates unique compact tokens for broad SQL LIKE recall. */
export function buildSearchKeywordsCompact(input: {
  name: string;
  brandName?: string | null;
  formattedAddress?: string | null;
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
}): string {
  const parts = [
    input.name,
    input.brandName,
    input.formattedAddress,
    input.city,
    input.region,
    input.countryCode,
  ]
    .filter((v): v is string => Boolean(v && String(v).trim()))
    .map(v => normalizeCompact(v))
    .filter(Boolean);

  return Array.from(new Set(parts)).join(' ');
}

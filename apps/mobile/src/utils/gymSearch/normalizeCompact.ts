/**
 * Single pipeline for cache keys, dedupe keys, and compact matching.
 * "Club 16", "club-16", "CLUB  16" → "club16"
 */
export function normalizeCompact(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '');
}

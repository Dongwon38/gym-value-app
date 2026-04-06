/** Display-oriented normalization: lowercase, trim, collapse inner spaces. */
export function normalizeSpacedLower(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const s = value
    .normalize('NFKC')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');

  return s.length > 0 ? s : null;
}

/**
 * Optional HTTPS endpoint for gym text search (POST JSON body, JSON array response).
 * Point this at your Places proxy; leave null to run local-only search in development.
 */
export const PLACES_SEARCH_HTTP_URL: string | null = 'https://gym-places-proxy.rororrk.workers.dev/places/search';

/**
 * Optional HTTPS endpoint for autocomplete suggestions.
 * Leave null until the proxy route is available; search UI will degrade gracefully.
 */
export const PLACES_AUTOCOMPLETE_HTTP_URL: string | null = null;

/**
 * Optional HTTPS endpoint for place details lookup after suggestion selection.
 * Leave null until the proxy route is available; suggestion taps will fall back to text search.
 */
export const PLACES_PLACE_DETAILS_HTTP_URL: string | null = null;

/**
 * Optional HTTPS endpoint for nearby gym browse.
 * Leave null until the proxy route is available; empty-query nearby browse will degrade gracefully.
 */
export const PLACES_NEARBY_HTTP_URL: string | null = null;

/**
 * When true, enforces `placesDailyLimit` in search config and records usage in SQLite.
 * Set to `false` until release; turn on before production.
 */
export const PLACES_SEARCH_QUOTA_ENABLED = false;

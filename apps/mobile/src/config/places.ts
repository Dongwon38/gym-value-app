/**
 * Optional HTTPS endpoint for gym text search (POST JSON body, JSON array response).
 * Point this at your Places proxy; leave null to run local-only search in development.
 */
export const PLACES_SEARCH_HTTP_URL: string | null = 'https://gym-places-proxy.rororrk.workers.dev/places/search';

/**
 * When true, enforces `placesDailyLimit` in search config and records usage in SQLite.
 * Set to `false` until release; turn on before production.
 */
export const PLACES_SEARCH_QUOTA_ENABLED = false;

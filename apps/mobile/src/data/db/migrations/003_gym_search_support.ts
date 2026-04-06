/**
 * Third SQLite migration — gym search corpus, Places quota, cache, and analytics.
 *
 * Additive ALTERs on `gyms`; new tables are independent. Recall-oriented indexes
 * support local candidate queries; final ranking happens in TypeScript.
 */
export const migration003GymSearchSupport = {
  version: 3,
  name: '003_gym_search_support',
  upSql: `
PRAGMA foreign_keys = ON;

ALTER TABLE gyms ADD COLUMN external_place_id TEXT;
ALTER TABLE gyms ADD COLUMN search_source TEXT;
ALTER TABLE gyms ADD COLUMN formatted_address TEXT;
ALTER TABLE gyms ADD COLUMN address_line1 TEXT;
ALTER TABLE gyms ADD COLUMN city TEXT;
ALTER TABLE gyms ADD COLUMN region TEXT;
ALTER TABLE gyms ADD COLUMN country_code TEXT;
ALTER TABLE gyms ADD COLUMN postal_code TEXT;
ALTER TABLE gyms ADD COLUMN brand_name TEXT;
ALTER TABLE gyms ADD COLUMN normalized_name TEXT;
ALTER TABLE gyms ADD COLUMN normalized_address TEXT;
ALTER TABLE gyms ADD COLUMN search_keywords TEXT;
ALTER TABLE gyms ADD COLUMN last_verified_at TEXT;
ALTER TABLE gyms ADD COLUMN name_compact TEXT;
ALTER TABLE gyms ADD COLUMN dedupe_key TEXT;

CREATE TABLE IF NOT EXISTS gym_place_search_usage (
  usage_date TEXT PRIMARY KEY NOT NULL,
  places_search_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (places_search_count >= 0)
);

CREATE TABLE IF NOT EXISTS gym_search_cache (
  query_key TEXT PRIMARY KEY NOT NULL,
  results_json TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_gym_search_cache_expires_at ON gym_search_cache(expires_at);

CREATE TABLE IF NOT EXISTS gym_search_logs (
  id TEXT PRIMARY KEY NOT NULL,
  query TEXT NOT NULL,
  selected_gym_id TEXT,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL,
  CHECK (source IN ('local', 'places'))
);

CREATE INDEX IF NOT EXISTS idx_gym_search_logs_created_at ON gym_search_logs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gyms_external_place_id ON gyms(external_place_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_gyms_external_place_id_unique
  ON gyms(external_place_id) WHERE external_place_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_gyms_dedupe_key ON gyms(dedupe_key);
CREATE INDEX IF NOT EXISTS idx_gyms_name_compact ON gyms(name_compact);
CREATE INDEX IF NOT EXISTS idx_gyms_brand_name ON gyms(brand_name);
CREATE INDEX IF NOT EXISTS idx_gyms_city_region ON gyms(city, region);
CREATE INDEX IF NOT EXISTS idx_gyms_search_source ON gyms(search_source);
`.trim(),
} as const;

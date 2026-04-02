/**
 * First SQLite migration — full DDL for v0.1 initial schema.
 *
 * Source of truth for SQL text: `docs/initial_db_schema_sql_v_0.md` §6.
 * If the doc changes, update this file to match.
 *
 * Policy (`location_prompts`): CREATE TABLE + indexes in this migration; no seed rows
 * in Phase 0/1 (see doc §7.6, §8).
 */
export const migration001InitialSchema = {
  version: 1,
  name: '001_initial_schema',
  upSql: `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS gyms (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  radius_meters INTEGER NOT NULL,
  timezone TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (radius_meters >= 30 AND radius_meters <= 500),
  CHECK (is_primary IN (0, 1)),
  CHECK (is_active IN (0, 1))
);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY NOT NULL,
  gym_id TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_minutes INTEGER,
  status TEXT NOT NULL,
  source TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'high',
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (status IN ('active', 'completed', 'cancelled')),
  CHECK (source IN ('manual', 'prompted', 'recovered')),
  CHECK (confidence IN ('high', 'medium', 'low')),
  CHECK (
    (status = 'active' AND ended_at IS NULL AND duration_minutes IS NULL) OR
    (status = 'completed' AND ended_at IS NOT NULL AND duration_minutes IS NOT NULL AND duration_minutes > 0) OR
    (status = 'cancelled')
  ),
  CHECK (
    ended_at IS NULL OR ended_at > started_at
  )
);

CREATE TABLE IF NOT EXISTS fee_items (
  id TEXT PRIMARY KEY NOT NULL,
  gym_id TEXT NOT NULL,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  amount_pre_tax REAL NOT NULL,
  cadence TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  tax_mode TEXT NOT NULL DEFAULT 'inherit_default',
  gst_rate REAL,
  pst_rate REAL,
  is_active INTEGER NOT NULL DEFAULT 1,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK (category IN (
    'monthly_membership',
    'annual_fee',
    'signup_fee',
    'locker_fee',
    'pt',
    'other'
  )),
  CHECK (cadence IN ('one_time', 'monthly', 'annual', 'custom')),
  CHECK (tax_mode IN ('inherit_default', 'custom')),
  CHECK (amount_pre_tax >= 0),
  CHECK (is_active IN (0, 1)),
  CHECK (end_date IS NULL OR end_date >= start_date),
  CHECK (
    (tax_mode = 'inherit_default') OR
    (tax_mode = 'custom' AND gst_rate IS NOT NULL AND pst_rate IS NOT NULL)
  ),
  CHECK (gst_rate IS NULL OR gst_rate >= 0),
  CHECK (pst_rate IS NULL OR pst_rate >= 0)
);

CREATE TABLE IF NOT EXISTS app_settings (
  id TEXT PRIMARY KEY NOT NULL,
  currency TEXT NOT NULL,
  locale TEXT NOT NULL,
  region_preset TEXT,
  default_gst_rate REAL NOT NULL DEFAULT 0,
  default_pst_rate REAL NOT NULL DEFAULT 0,
  home_primary_metric TEXT NOT NULL DEFAULT 'cost_per_visit',
  checkin_suggestions_enabled INTEGER NOT NULL DEFAULT 1,
  checkout_suggestions_enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (default_gst_rate >= 0),
  CHECK (default_pst_rate >= 0),
  CHECK (home_primary_metric IN ('cost_per_visit')),
  CHECK (checkin_suggestions_enabled IN (0, 1)),
  CHECK (checkout_suggestions_enabled IN (0, 1))
);

CREATE TABLE IF NOT EXISTS location_prompts (
  id TEXT PRIMARY KEY NOT NULL,
  gym_id TEXT NOT NULL,
  type TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  was_accepted INTEGER NOT NULL DEFAULT 0,
  related_visit_id TEXT,
  dismissed_permanently INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (gym_id) REFERENCES gyms(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  FOREIGN KEY (related_visit_id) REFERENCES visits(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CHECK (type IN ('enter', 'exit', 'checkin_suggested', 'checkout_suggested')),
  CHECK (was_accepted IN (0, 1)),
  CHECK (dismissed_permanently IN (0, 1))
);

CREATE INDEX IF NOT EXISTS idx_gyms_is_active ON gyms(is_active);
CREATE INDEX IF NOT EXISTS idx_gyms_is_primary ON gyms(is_primary);

CREATE UNIQUE INDEX IF NOT EXISTS idx_gyms_single_primary_active
ON gyms(is_primary)
WHERE is_primary = 1 AND is_active = 1;

CREATE INDEX IF NOT EXISTS idx_visits_gym_id ON visits(gym_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visits_started_at ON visits(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_visits_gym_status_started ON visits(gym_id, status, started_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_visits_single_active
ON visits(status)
WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_fee_items_gym_id ON fee_items(gym_id);
CREATE INDEX IF NOT EXISTS idx_fee_items_active ON fee_items(is_active);
CREATE INDEX IF NOT EXISTS idx_fee_items_range ON fee_items(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_fee_items_gym_active ON fee_items(gym_id, is_active);
CREATE INDEX IF NOT EXISTS idx_fee_items_gym_sort ON fee_items(gym_id, sort_order, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_location_prompts_gym_id ON location_prompts(gym_id);
CREATE INDEX IF NOT EXISTS idx_location_prompts_occurred_at ON location_prompts(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_location_prompts_related_visit_id ON location_prompts(related_visit_id);
`.trim(),
} as const;

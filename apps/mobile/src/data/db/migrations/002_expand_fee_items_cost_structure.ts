/**
 * Second SQLite migration — expands `fee_items` for post-MVP local cost UX.
 *
 * The original `fee_items` table uses CHECK constraints that do not allow
 * `bi_weekly`, `tax_mode = none`, or `billing_anchor_date`, so the table
 * must be rebuilt and data copied forward.
 */
export const migration002ExpandFeeItemsCostStructure = {
  version: 2,
  name: '002_expand_fee_items_cost_structure',
  upSql: `
CREATE TABLE IF NOT EXISTS fee_items_next (
  id TEXT PRIMARY KEY NOT NULL,
  gym_id TEXT NOT NULL,
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  amount_pre_tax REAL NOT NULL,
  cadence TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT,
  billing_anchor_date TEXT,
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
  CHECK (cadence IN ('one_time', 'bi_weekly', 'monthly', 'annual', 'custom')),
  CHECK (tax_mode IN ('inherit_default', 'none', 'custom')),
  CHECK (amount_pre_tax >= 0),
  CHECK (is_active IN (0, 1)),
  CHECK (end_date IS NULL OR end_date >= start_date),
  CHECK (
    billing_anchor_date IS NULL OR
    billing_anchor_date >= '0000-01-01'
  ),
  CHECK (
    ((tax_mode = 'inherit_default' OR tax_mode = 'none') AND gst_rate IS NULL AND pst_rate IS NULL) OR
    (tax_mode = 'custom' AND gst_rate IS NOT NULL AND pst_rate IS NOT NULL)
  ),
  CHECK (gst_rate IS NULL OR gst_rate >= 0),
  CHECK (pst_rate IS NULL OR pst_rate >= 0)
);

INSERT INTO fee_items_next (
  id,
  gym_id,
  category,
  label,
  amount_pre_tax,
  cadence,
  start_date,
  end_date,
  billing_anchor_date,
  tax_mode,
  gst_rate,
  pst_rate,
  is_active,
  sort_order,
  created_at,
  updated_at
)
SELECT
  id,
  gym_id,
  category,
  label,
  amount_pre_tax,
  cadence,
  start_date,
  end_date,
  NULL AS billing_anchor_date,
  tax_mode,
  gst_rate,
  pst_rate,
  is_active,
  sort_order,
  created_at,
  updated_at
FROM fee_items;

DROP TABLE fee_items;

ALTER TABLE fee_items_next RENAME TO fee_items;

CREATE INDEX IF NOT EXISTS idx_fee_items_gym_id ON fee_items(gym_id);
CREATE INDEX IF NOT EXISTS idx_fee_items_active ON fee_items(is_active);
CREATE INDEX IF NOT EXISTS idx_fee_items_range ON fee_items(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_fee_items_gym_active ON fee_items(gym_id, is_active);
CREATE INDEX IF NOT EXISTS idx_fee_items_gym_sort ON fee_items(gym_id, sort_order, created_at DESC);
`.trim(),
} as const;

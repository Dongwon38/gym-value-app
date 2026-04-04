import type { FeeItem } from '../../domain/models';
import { getDatabase } from '../db';

export type FeeItemRow = {
  amount_pre_tax: number;
  billing_anchor_date: string | null;
  cadence: FeeItem['cadence'];
  category: FeeItem['category'];
  created_at: string;
  end_date: string | null;
  gst_rate: number | null;
  gym_id: string;
  id: string;
  is_active: number;
  label: string;
  pst_rate: number | null;
  sort_order: number;
  start_date: string;
  tax_mode: FeeItem['taxMode'];
  updated_at: string;
};

export interface FeeItemWriteInput {
  amountPreTax: number;
  billingAnchorDate?: string | null;
  cadence: FeeItem['cadence'];
  category: FeeItem['category'];
  endDate?: string | null;
  gstRate?: number | null;
  gymId: string;
  isActive?: boolean;
  label: string;
  pstRate?: number | null;
  sortOrder?: number;
  startDate: string;
  taxMode: FeeItem['taxMode'];
}

function createFeeItemId() {
  return `fee_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildSelectFeeItemByIdSql() {
  return `
    SELECT
      id,
      gym_id,
      category,
      label,
      amount_pre_tax,
      billing_anchor_date,
      cadence,
      start_date,
      end_date,
      tax_mode,
      gst_rate,
      pst_rate,
      is_active,
      sort_order,
      created_at,
      updated_at
    FROM fee_items
    WHERE id = ?
    LIMIT 1
  `;
}

async function selectFeeItemById(
  executeAsync: <Row extends Record<string, unknown>>(
    query: string,
    params?: Array<string | number | null>,
  ) => Promise<{
    rows: {
      item: (index: number) => Row | undefined;
    };
  }>,
  feeItemId: string,
) {
  const result = await executeAsync<FeeItemRow>(buildSelectFeeItemByIdSql(), [
    feeItemId,
  ]);
  const row = result.rows.item(0);

  if (!row) {
    throw new Error(`Fee item "${feeItemId}" could not be loaded after write.`);
  }

  return mapFeeItemRowToModel(row);
}

async function getNextSortOrder(
  executeAsync: <Row extends Record<string, unknown>>(
    query: string,
    params?: Array<string | number | null>,
  ) => Promise<{
    rows: {
      item: (index: number) => Row | undefined;
    };
  }>,
  gymId: string,
) {
  const result = await executeAsync<{ next_sort_order: number }>(
    `
      SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_sort_order
      FROM fee_items
      WHERE gym_id = ?
    `,
    [gymId],
  );

  return result.rows.item(0)?.next_sort_order ?? 0;
}

export function mapFeeItemRowToModel(row: FeeItemRow): FeeItem {
  return {
    amountPreTax: row.amount_pre_tax,
    billingAnchorDate: row.billing_anchor_date,
    cadence: row.cadence,
    category: row.category,
    createdAt: row.created_at,
    endDate: row.end_date,
    gstRate: row.gst_rate,
    gymId: row.gym_id,
    id: row.id,
    isActive: row.is_active === 1,
    label: row.label,
    pstRate: row.pst_rate,
    sortOrder: row.sort_order,
    startDate: row.start_date,
    taxMode: row.tax_mode,
    updatedAt: row.updated_at,
  };
}

export async function listFeeItems() {
  const db = getDatabase();
  const result = await db.executeAsync<FeeItemRow>(
    `
      SELECT
        id,
        gym_id,
        category,
        label,
        amount_pre_tax,
        billing_anchor_date,
        cadence,
        start_date,
        end_date,
        tax_mode,
        gst_rate,
        pst_rate,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM fee_items
      ORDER BY is_active DESC, sort_order ASC, created_at DESC
    `,
  );

  return result.rows._array.map(mapFeeItemRowToModel);
}

export async function createFeeItem(input: FeeItemWriteInput) {
  const db = getDatabase();
  const feeItemId = createFeeItemId();
  const timestamp = new Date().toISOString();
  const isActive = input.isActive ?? true;

  return db.transaction(async tx => {
    const sortOrder =
      input.sortOrder ?? (await getNextSortOrder(tx.executeAsync, input.gymId));

    await tx.executeAsync(
      `
        INSERT INTO fee_items (
          id,
          gym_id,
          category,
          label,
          amount_pre_tax,
          billing_anchor_date,
          cadence,
          start_date,
          end_date,
          tax_mode,
          gst_rate,
          pst_rate,
          is_active,
          sort_order,
          created_at,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        feeItemId,
        input.gymId,
        input.category,
        input.label,
        input.amountPreTax,
        input.billingAnchorDate ?? null,
        input.cadence,
        input.startDate,
        input.endDate ?? null,
        input.taxMode,
        input.gstRate ?? null,
        input.pstRate ?? null,
        isActive ? 1 : 0,
        sortOrder,
        timestamp,
        timestamp,
      ],
    );

    return selectFeeItemById(tx.executeAsync, feeItemId);
  });
}

export async function updateFeeItem(feeItemId: string, input: FeeItemWriteInput) {
  const db = getDatabase();
  const timestamp = new Date().toISOString();
  const isActive = input.isActive ?? true;

  return db.transaction(async tx => {
    const result = await tx.executeAsync(
      `
        UPDATE fee_items
        SET
          gym_id = ?,
          category = ?,
          label = ?,
          amount_pre_tax = ?,
          billing_anchor_date = ?,
          cadence = ?,
          start_date = ?,
          end_date = ?,
          tax_mode = ?,
          gst_rate = ?,
          pst_rate = ?,
          is_active = ?,
          sort_order = COALESCE(?, sort_order),
          updated_at = ?
        WHERE id = ?
      `,
      [
        input.gymId,
        input.category,
        input.label,
        input.amountPreTax,
        input.billingAnchorDate ?? null,
        input.cadence,
        input.startDate,
        input.endDate ?? null,
        input.taxMode,
        input.gstRate ?? null,
        input.pstRate ?? null,
        isActive ? 1 : 0,
        input.sortOrder ?? null,
        timestamp,
        feeItemId,
      ],
    );

    if (result.rowsAffected === 0) {
      throw new Error(`Fee item "${feeItemId}" could not be updated.`);
    }

    return selectFeeItemById(tx.executeAsync, feeItemId);
  });
}

export async function setFeeItemActiveState(
  feeItemId: string,
  isActive: boolean,
) {
  const db = getDatabase();
  const timestamp = new Date().toISOString();

  return db.transaction(async tx => {
    const result = await tx.executeAsync(
      `
        UPDATE fee_items
        SET
          is_active = ?,
          updated_at = ?
        WHERE id = ?
      `,
      [isActive ? 1 : 0, timestamp, feeItemId],
    );

    if (result.rowsAffected === 0) {
      throw new Error(`Fee item "${feeItemId}" could not update active state.`);
    }

    return selectFeeItemById(tx.executeAsync, feeItemId);
  });
}

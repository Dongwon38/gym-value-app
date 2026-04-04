import type { NitroSQLiteConnection } from 'react-native-nitro-sqlite';

import { migration001InitialSchema } from './001_initial_schema';
import { migration002ExpandFeeItemsCostStructure } from './002_expand_fee_items_cost_structure';

export interface AppMigration {
  version: number;
  name: string;
  upSql: string;
}

type MigrationVersionRow = {
  version: number;
};

const schemaMigrationsTableSql = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
)
`.trim();

const appMigrations = [
  migration001InitialSchema,
  migration002ExpandFeeItemsCostStructure,
] satisfies readonly AppMigration[];

function logMigrationInfo(message: string) {
  console.info(`[db:migrations] ${message}`);
}

function logMigrationError(message: string, error: unknown) {
  console.error(`[db:migrations] ${message}`, error);
}

export function getAppMigrations() {
  return [...appMigrations].sort((left, right) => left.version - right.version);
}

export function splitSqlStatements(sql: string) {
  return sql
    .split(';')
    .map(statement => statement.trim())
    .filter(Boolean);
}

async function enableForeignKeys(db: NitroSQLiteConnection) {
  await db.executeAsync('PRAGMA foreign_keys = ON');
}

async function ensureSchemaMigrationsTable(db: NitroSQLiteConnection) {
  await db.executeAsync(schemaMigrationsTableSql);
}

async function getAppliedMigrationVersions(db: NitroSQLiteConnection) {
  const result = await db.executeAsync<MigrationVersionRow>(
    'SELECT version FROM schema_migrations ORDER BY version ASC',
  );

  return new Set(result.rows._array.map(row => Number(row.version)));
}

function getExecutableStatements(migration: AppMigration) {
  return splitSqlStatements(migration.upSql).filter(statement => {
    return !/^PRAGMA\s+foreign_keys\s*=\s*ON$/i.test(statement);
  });
}

async function applyMigration(
  db: NitroSQLiteConnection,
  migration: AppMigration,
) {
  logMigrationInfo(
    `Applying migration ${migration.name} (v${migration.version}).`,
  );

  try {
    await db.transaction(async tx => {
      for (const statement of getExecutableStatements(migration)) {
        await tx.executeAsync(statement);
      }

      await tx.executeAsync(
        `
          INSERT INTO schema_migrations (version, name, applied_at)
          VALUES (?, ?, ?)
        `,
        [migration.version, migration.name, new Date().toISOString()],
      );
    });
  } catch (error) {
    logMigrationError(
      `Failed to apply migration ${migration.name} (v${migration.version}).`,
      error,
    );
    throw error;
  }

  logMigrationInfo(`Applied migration ${migration.name} (v${migration.version}).`);
}

export async function runMigrations(db: NitroSQLiteConnection) {
  await enableForeignKeys(db);
  await ensureSchemaMigrationsTable(db);

  const appliedVersions = await getAppliedMigrationVersions(db);
  const pendingMigrations = getAppMigrations().filter(
    migration => !appliedVersions.has(migration.version),
  );

  if (pendingMigrations.length === 0) {
    logMigrationInfo('No pending migrations.');
    return;
  }

  for (const migration of pendingMigrations) {
    await applyMigration(db, migration);
  }
}

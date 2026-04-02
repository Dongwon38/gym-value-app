import {
  open,
  type NitroSQLiteConnection,
  type NitroSQLiteConnectionOptions,
} from 'react-native-nitro-sqlite';

import { runMigrations } from './migrations';
import { ensureDefaultAppSettings } from './settingsBootstrap';

const databaseConfig = {
  name: 'gym-value.sqlite',
} satisfies NitroSQLiteConnectionOptions;

let appDatabase: NitroSQLiteConnection | null = null;
let openDatabasePromise: Promise<NitroSQLiteConnection> | null = null;
let bootstrapDatabasePromise: Promise<NitroSQLiteConnection> | null = null;

function logDatabaseInfo(message: string) {
  console.info(`[db] ${message}`);
}

function logDatabaseError(message: string, error: unknown) {
  console.error(`[db] ${message}`, error);
}

export function getDatabaseConfig() {
  return databaseConfig;
}

export function hasDatabaseConnection() {
  return appDatabase !== null;
}

export function getDatabase() {
  if (!appDatabase) {
    throw new Error('Database has not been opened yet.');
  }

  return appDatabase;
}

export async function openAppDatabase() {
  if (appDatabase) {
    return appDatabase;
  }

  if (openDatabasePromise) {
    return openDatabasePromise;
  }

  openDatabasePromise = Promise.resolve().then(() => {
    const connection = open(databaseConfig);

    appDatabase = connection;
    logDatabaseInfo(`Opened SQLite database "${databaseConfig.name}".`);

    return connection;
  });

  try {
    return await openDatabasePromise;
  } catch (error) {
    openDatabasePromise = null;
    logDatabaseError(
      `Failed to open SQLite database "${databaseConfig.name}".`,
      error,
    );
    throw error;
  }
}

export async function bootstrapDatabase() {
  if (bootstrapDatabasePromise) {
    return bootstrapDatabasePromise;
  }

  bootstrapDatabasePromise = openAppDatabase()
    .then(async connection => {
      await runMigrations(connection);
      await ensureDefaultAppSettings(connection);
      logDatabaseInfo('Database bootstrap completed.');
      return connection;
    })
    .catch(error => {
      bootstrapDatabasePromise = null;
      throw error;
    });

  return bootstrapDatabasePromise;
}

export async function closeAppDatabase() {
  if (!appDatabase) {
    return;
  }

  const databaseName = databaseConfig.name;

  appDatabase.close();
  appDatabase = null;
  openDatabasePromise = null;
  bootstrapDatabasePromise = null;

  logDatabaseInfo(`Closed SQLite database "${databaseName}".`);
}

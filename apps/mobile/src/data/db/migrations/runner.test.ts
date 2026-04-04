import { migration002ExpandFeeItemsCostStructure } from './002_expand_fee_items_cost_structure';
import { getAppMigrations, runMigrations, splitSqlStatements } from './runner';

function createQueryResult<Row extends Record<string, unknown>>(rows: Row[] = []) {
  return {
    rowsAffected: 0,
    results: rows,
    rows: {
      _array: rows,
      length: rows.length,
      item: (idx: number) => rows[idx],
    },
  };
}

function createDatabaseMock(appliedVersions: number[] = []) {
  const txExecuteAsync = jest.fn().mockResolvedValue(createQueryResult());
  const executeAsync = jest
    .fn()
    .mockResolvedValueOnce(createQueryResult())
    .mockResolvedValueOnce(createQueryResult())
    .mockResolvedValueOnce(
      createQueryResult(appliedVersions.map(version => ({ version }))),
    );
  const transaction = jest.fn(async callback => {
    return callback({
      commit: jest.fn(),
      rollback: jest.fn(),
      execute: jest.fn(),
      executeAsync: txExecuteAsync,
    });
  });

  return {
    db: {
      executeAsync,
      transaction,
    },
    executeAsync,
    transaction,
    txExecuteAsync,
  };
}

describe('runMigrations', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('applies pending migrations and records them', async () => {
    const { db, executeAsync, transaction, txExecuteAsync } = createDatabaseMock(
      [],
    );

    await runMigrations(db as never);

    const appMigrations = getAppMigrations();
    const executableStatementsCount = appMigrations.reduce(
      (total, migration) =>
        total +
        splitSqlStatements(migration.upSql).filter(
          statement => !/^PRAGMA\s+foreign_keys\s*=\s*ON$/i.test(statement),
        ).length,
      0,
    );

    expect(executeAsync).toHaveBeenCalledTimes(3);
    expect(executeAsync).toHaveBeenNthCalledWith(1, 'PRAGMA foreign_keys = ON');
    expect(executeAsync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('CREATE TABLE IF NOT EXISTS schema_migrations'),
    );
    expect(executeAsync).toHaveBeenNthCalledWith(
      3,
      'SELECT version FROM schema_migrations ORDER BY version ASC',
    );
    expect(transaction).toHaveBeenCalledTimes(appMigrations.length);
    expect(txExecuteAsync).toHaveBeenCalledTimes(
      executableStatementsCount + appMigrations.length,
    );
    expect(txExecuteAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO schema_migrations'),
      [1, '001_initial_schema', expect.any(String)],
    );
    expect(txExecuteAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO schema_migrations'),
      [2, '002_expand_fee_items_cost_structure', expect.any(String)],
    );
  });

  it('skips already applied migrations', async () => {
    const { db, transaction } = createDatabaseMock([1, 2]);

    await runMigrations(db as never);

    expect(transaction).not.toHaveBeenCalled();
  });

  it('applies only missing later migrations when earlier versions already exist', async () => {
    const { db, transaction, txExecuteAsync } = createDatabaseMock([1]);

    await runMigrations(db as never);

    const executableStatements = splitSqlStatements(
      migration002ExpandFeeItemsCostStructure.upSql,
    );

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(txExecuteAsync).toHaveBeenCalledTimes(executableStatements.length + 1);
    expect(txExecuteAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO schema_migrations'),
      [2, '002_expand_fee_items_cost_structure', expect.any(String)],
    );
  });
});

import { mkdirSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

export function openDatabase(path: string, migrationsDirectory: string) {
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }

  const database = new DatabaseSync(path, { timeout: 5000 });
  try {
    database.exec('PRAGMA journal_mode = WAL');
    migrate(database, migrationsDirectory);
    return database;
  } catch (error) {
    database.close();
    throw error;
  }
}

function migrate(database: DatabaseSync, directory: string) {
  const files = readdirSync(directory)
    .filter((file) => /^\d{3}_[a-z0-9_]+\.sql$/.test(file))
    .sort((left, right) => left.localeCompare(right, 'en'));
  if (files.length === 0 || new Set(files.map((file) => file.slice(0, 3))).size !== files.length) {
    throw new Error('Expected at least one migration with unique migration numbers.');
  }

  database.exec('BEGIN IMMEDIATE');
  try {
    database.exec('CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY NOT NULL) STRICT');
    const migrations = database.prepare('SELECT filename FROM schema_migrations').all();
    const applied = new Set(migrations.map((migration) => migration.filename));
    if (migrations.some(({ filename }) => typeof filename !== 'string' || !files.includes(filename))) {
      throw new Error('A migration already in the database is missing from the app.');
    }

    const record = database.prepare('INSERT INTO schema_migrations (filename) VALUES (?)');
    for (const file of files.filter((file) => !applied.has(file))) {
      database.exec(readFileSync(join(directory, file), 'utf8'));
      record.run(file);
    }
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

import { readFile } from 'node:fs/promises';
import { readConfig } from '../dist/server/src/config.js';
import { createLibraryService } from '../dist/server/src/features/library/application/library-service.js';
import { sqliteLibraryRepository } from '../dist/server/src/features/library/infrastructure/sqlite-library-repository.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const file = process.argv[2];
if (!file) throw new Error('Usage: npm run import:library -- <file.json>');

const input = JSON.parse(await readFile(file, 'utf8'));
const config = readConfig(process.env);
const database = openDatabase(config.dbPath, config.migrationsDirectory);
try {
  const count = createLibraryService(sqliteLibraryRepository(database)).import(input);
  console.log(`Imported ${count} library resources.`);
} finally {
  database.close();
}

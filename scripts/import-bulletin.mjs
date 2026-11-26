import { readFile } from 'node:fs/promises';
import { readConfig } from '../dist/server/src/config.js';
import { createBulletinService } from '../dist/server/src/features/bulletins/application/bulletin-service.js';
import { sqliteBulletinRepository } from '../dist/server/src/features/bulletins/infrastructure/sqlite-bulletin-repository.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const file = process.argv[2];
if (!file) throw new Error('Usage: npm run import:bulletin -- <file.json>');

const input = JSON.parse(await readFile(file, 'utf8'));
const config = readConfig(process.env);
const database = openDatabase(config.dbPath, config.migrationsDirectory);
try {
  const service = createBulletinService(sqliteBulletinRepository(database));
  const imported = service.import(input);
  console.log(`Imported bulletin ${imported.date} with ${imported.stories} stories.`);
} finally {
  database.close();
}

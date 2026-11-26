import { readFile } from 'node:fs/promises';
import { readConfig } from '../dist/server/src/config.js';
import { createRankingService } from '../dist/server/src/features/rankings/application/ranking-service.js';
import { sqliteRankingRepository } from '../dist/server/src/features/rankings/infrastructure/sqlite-ranking-repository.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const file = process.argv[2];
if (!file) throw new Error('Usage: npm run import:ranking -- <file.json>');

const input = JSON.parse(await readFile(file, 'utf8'));
const config = readConfig(process.env);
const database = openDatabase(config.dbPath, config.migrationsDirectory);
try {
  const service = createRankingService(sqliteRankingRepository(database));
  const report = service.import(input);
  console.log(`Imported ranking ${report.date}: ${report.industries} industries and ${report.niches} niches.`);
} finally {
  database.close();
}

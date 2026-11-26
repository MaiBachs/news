import { readFile } from 'node:fs/promises';
import { readConfig } from '../dist/server/src/config.js';
import { createServiceProfiles } from '../dist/server/src/features/services/application/service-profiles.js';
import { sqliteServiceProfiles } from '../dist/server/src/features/services/infrastructure/sqlite-service-profiles.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const file = process.argv[2];
if (!file) throw new Error('Cách chạy: npm run import:services -- <tệp JSON>');
const input = JSON.parse(await readFile(file, 'utf8'));
const config = readConfig(process.env);
const database = openDatabase(config.dbPath, config.migrationsDirectory);
try {
  const count = createServiceProfiles(sqliteServiceProfiles(database)).import(input);
  console.log(`Đã nhập ${count} hồ sơ nghề dịch vụ.`);
} finally {
  database.close();
}

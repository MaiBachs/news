import { readFile } from 'node:fs/promises';
import { readConfig } from '../dist/server/src/config.js';
import { createFarmCatalog } from '../dist/server/src/features/farming/application/farm-catalog.js';
import { sqliteFarmCatalog } from '../dist/server/src/features/farming/infrastructure/sqlite-farm-catalog.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const file = process.argv[2];
if (!file) throw new Error('Cách chạy: npm run import:farming -- <tệp JSON>');
const input = JSON.parse(await readFile(file, 'utf8'));
const config = readConfig(process.env);
const database = openDatabase(config.dbPath, config.migrationsDirectory);
try {
  const result = createFarmCatalog(sqliteFarmCatalog(database)).import(input);
  console.log(`Đã cập nhật ${result.models} mô hình và ${result.evidence} mục số liệu nông nghiệp.`);
} finally {
  database.close();
}

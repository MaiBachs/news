import { readFile } from 'node:fs/promises';
import { readConfig } from '../dist/server/src/config.js';
import { createAiotCatalogService } from '../dist/server/src/features/aiot/application/aiot-catalog-service.js';
import { sqliteAiotCatalog } from '../dist/server/src/features/aiot/infrastructure/sqlite-aiot-catalog.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const file = process.argv[2];
if (!file) throw new Error('Cách chạy: npm run import:aiot -- <tệp JSON>');
const input = JSON.parse(await readFile(file, 'utf8'));
const config = readConfig(process.env);
const database = openDatabase(config.dbPath, config.migrationsDirectory);
try {
  const catalog = createAiotCatalogService(sqliteAiotCatalog(database)).import(input);
  console.log(`Đã nhập danh mục AIoT ngày ${catalog.date} với ${catalog.solutions.length} giải pháp và ${catalog.parts.length} linh kiện.`);
} finally {
  database.close();
}

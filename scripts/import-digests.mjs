import { readFile } from 'node:fs/promises';
import { readConfig } from '../dist/server/src/config.js';
import { createBulletinService } from '../dist/server/src/features/bulletins/application/bulletin-service.js';
import { sqliteBulletinRepository } from '../dist/server/src/features/bulletins/infrastructure/sqlite-bulletin-repository.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const file = process.argv[2];
if (!file) throw new Error('Cách chạy: npm run import:digests -- <file.json>');
const input = JSON.parse(await readFile(file, 'utf8'));
const config = readConfig(process.env);
const database = openDatabase(config.dbPath, config.migrationsDirectory);
try {
  const service = createBulletinService(sqliteBulletinRepository(database));
  console.log(`Đã nhập tóm tắt của ${service.importDigests(input)} tin.`);
} finally {
  database.close();
}

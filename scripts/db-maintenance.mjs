import { mkdir, stat } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { backup, DatabaseSync } from 'node:sqlite';
import { readConfig } from '../dist/server/src/config.js';

const args = process.argv.slice(2);
if (args.length > 1 || args.some((option) => option !== '--backup' && option !== '--compact')) {
  throw new Error('Cách chạy: npm run db:maintenance -- [--backup | --compact]');
}
const { dbPath } = readConfig(process.env);
const initialSize = (await stat(dbPath)).size;
const db = new DatabaseSync(dbPath, { timeout: 5000 });
try {
  assertHealthy(db);
  if (args.length) {
    const directory = join(dirname(dbPath), 'backups');
    await mkdir(directory, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const copyPath = join(directory, `${basename(dbPath, '.sqlite')}-${stamp}-${process.pid}.sqlite`);
    await backup(db, copyPath);
    const copy = new DatabaseSync(copyPath, { readOnly: true });
    try { assertHealthy(copy); } finally { copy.close(); }
    console.log(`Bản sao SQLite đã kiểm tra tại ${copyPath}`);
  }
  if (args[0] === '--compact') db.exec('VACUUM');
  db.exec('PRAGMA optimize');
  const checkpoint = db.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get();
  console.log(JSON.stringify({ dbPath, initialBytes: initialSize, finalBytes: (await stat(dbPath)).size, checkpoint }));
} finally {
  db.close();
}

function assertHealthy(database) {
  const rows = database.prepare('PRAGMA quick_check').all();
  if (rows.length !== 1 || rows[0].quick_check !== 'ok') throw new Error('SQLite báo lỗi khi kiểm tra dữ liệu.');
}

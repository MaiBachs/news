import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../dist/server/src/app.js';
import { readConfig } from '../dist/server/src/config.js';
import { sqliteBulletinRepository } from '../dist/server/src/features/bulletins/infrastructure/sqlite-bulletin-repository.js';
import { createFarmCatalog } from '../dist/server/src/features/farming/application/farm-catalog.js';
import { sqliteFarmCatalog } from '../dist/server/src/features/farming/infrastructure/sqlite-farm-catalog.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

test('archive pages cap payload and preserve full filtered totals, translated search and URLs', async (context) => {
  const config = readConfig({});
  const database = openDatabase(':memory:', config.migrationsDirectory);
  const rows = Array.from({ length: 35 }, (_, index) => ({
    url: `https://example.com/news/${index}`, title: `ESP32 test ${index}`, summary: 'Board', topic: 'aiot',
    market: 'GLOBAL', source: 'Example', publishedOn: index < 10 ? null : `2026-11-${String(index - 9).padStart(2, '0')}`, fromFeed: true,
    translation: { title: `Thiết bị ESP32 số ${index}`, summary: 'Bản dịch' },
  }));
  sqliteBulletinRepository(database).saveCollected(rows);
  assert.equal(database.prepare("SELECT count(*) AS count FROM collected_stories WHERE json_type(content, '$.url') IS NOT NULL").get().count, 0);
  const server = createApp(database, config).listen(0, '127.0.0.1');
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    database.close();
  });
  await once(server, 'listening');
  const url = `http://127.0.0.1:${server.address().port}/api/bulletins/archive`;
  const preview = await fetch(url).then((response) => response.json());
  assert.equal(preview.groups[0].stories.length, 3);
  assert.equal(preview.chart.undatedCount, 10);
  assert.equal(preview.chart.olderCount, 18);
  const page = await fetch(`${url}?topic=aiot&offset=20&market=GLOBAL&search=thiet+bi`).then((response) => response.json());
  assert.equal(page.selectedTotal, 35);
  assert.equal(page.groups[0].stories.length, 15);
  assert.equal(page.groups[0].stories[0].url, 'https://example.com/news/14');
  assert.deepEqual(page.chart, preview.chart);
  assert.equal((await fetch(`${url}?offset=-1`)).status, 400);
  assert.equal((await fetch(`${url}?topic=x&topic=y`)).status, 400);
});

test('farming catalog starts with the existing strategy and imports evidence by stable ID', (context) => {
  const db = openDatabase(':memory:', 'server/migrations');
  context.after(() => db.close());
  const catalog = createFarmCatalog(sqliteFarmCatalog(db));
  const current = catalog.catalog();
  assert.equal(current.models.length, 7);
  assert.equal(current.evidence.length, 9);
  assert.equal(current.plan.gardenArea, 300);
  const entry = { ...current.evidence[0], id: 'new-case', observed: 'Một kết quả đã đọc.' };
  catalog.import({ evidence: [entry] });
  catalog.import({ evidence: [{ ...entry, observed: 'Bản cập nhật.' }] });
  assert.equal(catalog.catalog().evidence.length, 10);
  assert.equal(catalog.catalog().evidence.find(({ id }) => id === entry.id).observed, 'Bản cập nhật.');
  assert.throws(() => catalog.import({ evidence: [{ ...entry, source: { label: 'Sai', url: 'javascript:alert(1)' } }] }), /HTTPS/);
  assert.equal(catalog.catalog().evidence.length, 10);
});

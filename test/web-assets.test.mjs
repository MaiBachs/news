import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createApp } from '../dist/server/src/app.js';
import { readConfig } from '../dist/server/src/config.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const migrations = fileURLToPath(new URL('../server/migrations', import.meta.url));

test('production caches built assets and separates missing files from SPA routes', async (context) => {
  const web = mkdtempSync(join(tmpdir(), 'radar-web-'));
  const assets = join(web, 'assets');
  mkdirSync(assets);
  writeFileSync(join(web, 'index.html'), '<main>Radar</main>');
  writeFileSync(join(assets, 'app-hashed.js'), 'const radar = true;');

  const database = openDatabase(':memory:', migrations);
  const server = createApp(database, { ...readConfig({}), webDirectory: web }).listen(0, '127.0.0.1');
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    database.close();
    rmSync(web, { recursive: true, force: true });
  });
  await once(server, 'listening');

  const base = `http://127.0.0.1:${server.address().port}`;
  const asset = await fetch(`${base}/assets/app-hashed.js`);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('cache-control'), /max-age=31536000.*immutable/);
  assert.match(asset.headers.get('content-type'), /javascript/);

  const missing = await fetch(`${base}/assets/missing.js`);
  assert.equal(missing.status, 404);
  assert.equal(missing.headers.get('cache-control'), 'no-store');
  assert.match(missing.headers.get('content-type'), /text\/plain/);

  const page = await fetch(`${base}/kho-tin`);
  assert.equal(page.status, 200);
  assert.equal(await page.text(), '<main>Radar</main>');
});

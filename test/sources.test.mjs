import assert from 'node:assert/strict';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createApp } from '../dist/server/src/app.js';
import { readConfig } from '../dist/server/src/config.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const migrations = fileURLToPath(new URL('../server/migrations', import.meta.url));

test('local source management works without a session and still checks write requests', async (context) => {
  const directory = mkdtempSync(join(tmpdir(), 'radar-test-'));
  const file = join(directory, 'test.sqlite');
  const database = openDatabase(file, migrations);
  const app = createApp(database, readConfig({}));
  const server = app.listen(0, '127.0.0.1');
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    database.close();
    rmSync(directory, { recursive: true, force: true });
  });
  await once(server, 'listening');

  const base = `http://127.0.0.1:${server.address().port}/api`;
  const read = (path) => fetch(base + path);
  const write = (method, path, payload, withHeader = true) => fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(withHeader ? { 'X-Radar-Request': '1' } : {}),
    },
    body: JSON.stringify(payload),
  });

  assert.equal((await read('/session')).status, 404);
  assert.deepEqual(await (await read('/sources')).json(), []);
  assert.equal(await (await read('/bulletins/latest')).json(), null);

  const feed = { name: ' Blog kỹ thuật ', feedUrl: 'https://EXAMPLE.COM/feed', market: 'VIETNAM', purpose: 'NEWS' };
  assert.equal((await write('POST', '/sources', feed, false)).status, 403);
  assert.equal((await write('POST', '/sources', { ...feed, feedUrl: 'javascript:alert(1)' })).status, 400);
  const created = await write('POST', '/sources', feed);
  assert.equal(created.status, 201);
  const source = await created.json();
  assert.equal(source.name, 'Blog kỹ thuật');
  assert.equal(source.feedUrl, 'https://example.com/feed');
  assert.equal(source.enabled, true);
  assert.equal((await write('POST', '/sources', feed)).status, 409);
  assert.equal((await write('POST', '/sources', { ...feed, purpose: 'LIBRARY' })).status, 201);
  assert.equal((await write('PATCH', '/sources/missing', { enabled: false })).status, 404);
  assert.equal((await write('PATCH', `/sources/${source.id}`, { enabled: 'false' })).status, 400);
  assert.equal((await write('PATCH', `/sources/${source.id}`, { enabled: false })).status, 204);
  assert.equal((await write('PATCH', `/sources/${source.id}`, { enabled: false })).status, 204);

  const reopened = openDatabase(file, migrations);
  try {
    assert.equal(reopened.prepare('SELECT enabled FROM feed_sources WHERE id = ?').get(source.id).enabled, 0);
    assert.equal(reopened.prepare('SELECT count(*) AS count FROM schema_migrations WHERE filename = ?')
      .get('001_create_sources.sql').count, 1);
  } finally {
    reopened.close();
  }
});

import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createApp } from '../dist/server/src/app.js';
import { readConfig } from '../dist/server/src/config.js';
import { createConnectionService } from '../dist/server/src/features/ai/application/connection-service.js';
import { openAiResponses } from '../dist/server/src/features/ai/infrastructure/openai-responses.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const migrations = fileURLToPath(new URL('../server/migrations', import.meta.url));
const fixtureKey = 'fixture-value';
const config = readConfig({ RADAR_AI_PROFILE: 'codex', OPENAI_API_KEY: fixtureKey });

test('AI check protects the key and limits repeated model calls on the local web app', async (context) => {
  const localFetch = fetch;
  const upstream = context.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://api.openai.com/v1/responses');
    assert.equal(options.headers.Authorization, `Bearer ${fixtureKey}`);
    assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), {
      model: 'gpt-6-luna', input: 'Reply with exactly one word: OK.', max_output_tokens: 128, store: false,
    });
    return Response.json({ status: 'completed' });
  });

  const database = openDatabase(':memory:', migrations);
  const server = createApp(database, config).listen(0, '127.0.0.1');
  context.after(async () => {
    await new Promise((resolve) => server.close(resolve));
    database.close();
  });
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const status = await localFetch(`${base}/ai`);
  assert.equal(status.status, 200);
  assert.deepEqual(await status.json(), { ...config.ai, connection: 'ready' });
  assert.equal((await localFetch(`${base}/ai/check`, { method: 'POST' })).status, 403);

  const check = () => localFetch(`${base}/ai/check`, { method: 'POST', headers: { 'X-Radar-Request': '1' } });
  assert.equal((await check()).status, 204);
  assert.equal((await check()).status, 429);
  assert.equal(upstream.mock.callCount(), 1);
});

test('connection availability depends on selected profile and server API key', async () => {
  const missingKey = createConnectionService(config.ai);
  assert.equal(missingKey.status().connection, 'missing-key');
  assert.equal(await missingKey.check(), 'unavailable');

  const claude = readConfig({}).ai;
  const check = async () => assert.fail('Claude must not call OpenAI');
  const unsupported = createConnectionService(claude, { check });
  assert.equal(unsupported.status().connection, 'unavailable');
  assert.equal(await unsupported.check(), 'unavailable');
});

test('OpenAI client handles API denials, rate limits, and incomplete or broken responses', async () => {
  const checkWith = (request) => openAiResponses(fixtureKey, request).check('gpt-6-luna');
  assert.equal(await checkWith(async () => new Response('denied', { status: 401 })), 'unauthorized');
  assert.equal(await checkWith(async () => new Response('limited', { status: 429 })), 'rate-limited');
  assert.equal(await checkWith(async () => Response.json({ status: 'incomplete' })), 'failed');
  assert.equal(await checkWith(async () => new Response('not-json')), 'failed');
  assert.equal(await checkWith(async () => { throw new Error('timed out'); }), 'failed');
});

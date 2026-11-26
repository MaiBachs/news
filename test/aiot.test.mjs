import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../dist/server/src/app.js';
import { readConfig } from '../dist/server/src/config.js';
import { createAiotCatalogService } from '../dist/server/src/features/aiot/application/aiot-catalog-service.js';
import { parseAiotCatalog } from '../dist/server/src/features/aiot/domain/aiot-catalog.js';
import { sqliteAiotCatalog } from '../dist/server/src/features/aiot/infrastructure/sqlite-aiot-catalog.js';
import { resolveStoryTopic } from '../dist/server/src/features/bulletins/domain/story-topic.js';
import { sqliteBulletinRepository } from '../dist/server/src/features/bulletins/infrastructure/sqlite-bulletin-repository.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const fakeSource = { id: 'demo', label: 'Nguồn giả dùng kiểm thử', url: 'https://example.com/demo' };
const fakePart = {
  id: 'fake-board', name: 'Bo mạch giả', kind: 'BOARD', capability: 'Đọc cảm biến giả', sourceId: 'demo',
  signal: 'ENABLER',
  price: { value: 123, currency: 'VND', observedOn: '2026-01-01' },
};
const fakeSolution = {
  id: 'fake-solution', title: 'Giải pháp giả', problem: 'Bài toán giả', customer: 'Khách giả', market: 'VIETNAM', partIds: ['fake-board'],
  bomCost: 'Chi phí giả', chatbot: { channels: ['ZALO_OA'], role: 'Vai trò giả', model: 'Model giả' },
  pricing: { setup: 'Phí lắp giả' }, competitors: [], decision: 'VALIDATE', pilot: 'Phép thử giả', risks: 'Rủi ro giả', sources: [fakeSource],
};
const fakeCatalog = { date: '2026-11-24', sources: [fakeSource], parts: [fakePart], solutions: [fakeSolution] };

test('AIoT catalog validates sources, parts, unique IDs, prices and required solution fields', () => {
  assert.deepEqual(parseAiotCatalog(fakeCatalog), fakeCatalog);
  assert.throws(() => parseAiotCatalog({ ...fakeCatalog, parts: [fakePart, fakePart] }), /Mã linh kiện bị trùng/);
  assert.throws(() => parseAiotCatalog({ ...fakeCatalog, parts: [{ ...fakePart, sourceId: 'missing' }] }), /Mã nguồn missing/);
  assert.throws(() => parseAiotCatalog({ ...fakeCatalog, sources: [{ ...fakeSource, url: 'http://example.com/demo' }] }), /HTTPS/);
  for (const price of [{ ...fakePart.price, currency: 'EUR' }, { ...fakePart.price, observedOn: '2026-02-30' }]) {
    assert.throws(() => parseAiotCatalog({ ...fakeCatalog, parts: [{ ...fakePart, price }] }));
  }
  for (const [fields, message] of [
    [{ partIds: ['missing'] }, /Mã linh kiện missing/], [{ sources: [] }, /ít nhất một nguồn/],
    [{ problem: ' ' }, /Bài toán/], [{ customer: '' }, /Khách hàng/], [{ pilot: '' }, /Phép thử/],
    [{ competitors: [{ name: 'Giả', type: 'SPECIALIST', overlap: 'DIRECT', coverage: 'Giả', sourceId: 'missing' }] }, /Mã nguồn đối thủ missing/],
  ]) {
    assert.throws(() => parseAiotCatalog({ ...fakeCatalog, solutions: [{ ...fakeSolution, ...fields }] }), message);
  }
});

test('AIoT latest returns null, replaces the same date and filters scored signals through the archive', async (context) => {
  const database = openDatabase(':memory:', 'server/migrations');
  const server = createApp(database, readConfig({})).listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => { server.close(); database.close(); });
  const base = `http://127.0.0.1:${server.address().port}`;
  const get = async (path) => {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    return response.json();
  };
  assert.equal(await get('/api/aiot/latest'), null);
  const service = createAiotCatalogService(sqliteAiotCatalog(database));
  service.import(fakeCatalog);
  service.import(fakeCatalog);
  const revised = { ...fakeCatalog, solutions: [{ ...fakeSolution, title: 'Giải pháp giả đã sửa' }] };
  service.import(revised);
  service.import({ ...fakeCatalog, date: '2026-11-23' });
  assert.equal(database.prepare('SELECT count(*) AS total FROM aiot_catalogs').get().total, 2);
  assert.deepEqual(await get('/api/aiot/latest'), revised);

  const story = { market: 'GLOBAL', source: 'Nguồn giả', summary: 'Tin giả', publishedOn: '2026-11-24' };
  sqliteBulletinRepository(database).saveCollected([
    { ...story, url: 'https://example.com/lower', title: 'Một chatbot giả khác', score: 3 },
    { ...story, url: 'https://example.com/qualified', title: 'Chatbot giả đạt điểm', score: 4 },
    { ...story, url: 'https://example.com/unscored', title: 'Trợ lý ảo giả chưa chấm' },
  ]);
  const archive = await get('/api/bulletins/archive?topic=chatbot&minScore=4');
  assert.deepEqual(archive.groups[0].stories.map(({ url }) => url), ['https://example.com/qualified']);
  assert.equal((await get('/api/bulletins/archive?topic=chatbot')).selectedTotal, 3);
  assert.equal((await fetch(base + '/api/bulletins/archive?minScore=13')).status, 400);
});

test('chatbot topics recognize Vietnamese, English and Chinese while keeping AIoT and voice priority', () => {
  const topic = (title) => resolveStoryTopic({ title, summary: '', source: 'Nguồn giả' });
  assert.equal(topic('Zalo OA triển khai trợ lý ảo'), 'chatbot');
  assert.equal(topic('Virtual assistant for a store'), 'chatbot');
  assert.equal(topic('发布在线客服机器人'), 'chatbot');
  assert.equal(topic('ESP32 kết nối chatbot cho thiết bị'), 'aiot');
  assert.equal(topic('Voice agent hỗ trợ chatbot'), 'giong-noi');
  assert.equal(topic('智能家居的聊天机器人'), 'aiot');
  assert.equal(resolveStoryTopic({ title: 'Chatbot mới', summary: 'Bo ESP32', source: 'Nguồn giả' }), 'aiot');
});

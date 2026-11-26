import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp } from '../dist/server/src/app.js';
import { readConfig } from '../dist/server/src/config.js';
import { createServiceProfiles } from '../dist/server/src/features/services/application/service-profiles.js';
import { parseServiceProfiles } from '../dist/server/src/features/services/domain/service-profile.js';
import { sqliteServiceProfiles } from '../dist/server/src/features/services/infrastructure/sqlite-service-profiles.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const fakeSource = { id: 'fake', label: 'Nguồn giả', url: 'https://example.com/service' };
const fakePrice = { item: 'Đơn hàng giả', low: 100, high: 200, currency: 'VND', unit: 'gói', market: 'VIETNAM', observedOn: '2026-11-24', sourceId: 'fake' };
const fakeProfile = {
  id: 'CODING', date: '2026-11-24', decision: 'VALIDATE', sources: [fakeSource],
  demand: { assessment: 'Nhu cầu giả', sourceIds: ['fake'] }, prices: [fakePrice],
  aiShift: { automated: 'Việc AI giả', stillHuman: 'Việc người duyệt giả', replacementRisk: 'MEDIUM' },
  tools: [{ name: 'Công cụ giả', use: 'Cách dùng giả', cost: 'Chi phí giả', sourceId: 'fake' }],
  learning: { weeks: 2, prerequisites: 'Kiến thức giả', path: 'Lộ trình giả' },
  offer: { name: 'Gói giả', deliverable: 'Bàn giao giả', price: 'Giá giả', turnaround: 'Thời gian giả' },
  competitors: [], test: 'Phép thử giả', signals30d: 0,
};
const fakeLegal = { assessment: 'Ghi chú pháp lý giả', sourceIds: ['fake'] };

test('service profiles validate price units, dates, source references, decision and legal evidence', () => {
  const bookkeeping = { ...fakeProfile, id: 'BOOKKEEPING', legal: fakeLegal };
  assert.deepEqual(parseServiceProfiles([fakeProfile, bookkeeping]), [fakeProfile, bookkeeping]);
  for (const [price, reason] of [
    [{ ...fakePrice, low: 300 }, /Giá thấp nhất/], [{ ...fakePrice, unit: '' }, /Đơn vị giá/],
    [{ ...fakePrice, observedOn: '2026-11-31' }, /Ngày ghi nhận giá/], [{ ...fakePrice, sourceId: 'missing' }, /Mã nguồn missing/],
  ]) {
    assert.throws(() => parseServiceProfiles([{ ...fakeProfile, prices: [price] }]), reason);
  }
  assert.throws(() => parseServiceProfiles([{ ...fakeProfile, decision: 'UNKNOWN' }]), /Quyết định không hợp lệ/);
  assert.throws(() => parseServiceProfiles([{ ...fakeProfile, id: 'BOOKKEEPING' }]), /kế toán cần thông tin pháp lý/);
  assert.throws(() => parseServiceProfiles([{ ...bookkeeping, legal: { ...fakeLegal, sourceIds: [] } }]), /Pháp lý|pháp lý/);
  assert.throws(() => parseServiceProfiles([fakeProfile, fakeProfile]), /trùng mã nghề và ngày/);
  assert.throws(() => parseServiceProfiles([{ ...fakeProfile, signals30d: 1.5 }]), /phải là số nguyên/);
});

test('service latest and history expose only valid records and repeated imports keep the same keys', async (context) => {
  const database = openDatabase(':memory:', 'server/migrations');
  const server = createApp(database, readConfig({})).listen(0, '127.0.0.1');
  await once(server, 'listening');
  context.after(() => { server.close(); database.close(); });
  const base = `http://127.0.0.1:${server.address().port}/api/services`;
  const get = async (path) => {
    const response = await fetch(base + path);
    assert.equal(response.status, 200);
    return response.json();
  };
  assert.deepEqual(await get('/latest'), []);
  assert.deepEqual(await get('/CODING/history'), []);
  const invalid = await fetch(base + '/NOT-A-TRADE/history');
  assert.equal(invalid.status, 400);
  assert.deepEqual(await invalid.json(), { error: 'Mã nghề không hợp lệ.' });

  const service = createServiceProfiles(sqliteServiceProfiles(database));
  const content = { ...fakeProfile, id: 'CONTENT', decision: 'PILOT' };
  const past = { ...fakeProfile, date: '2026-11-22', decision: 'EXCLUDE' };
  assert.throws(() => service.import([past, { ...fakeProfile, id: 'BOOKKEEPING' }]));
  assert.deepEqual(await get('/latest'), []);
  assert.equal(service.import([fakeProfile, past, content]), 3);
  assert.equal(service.import([fakeProfile, past, content]), 3);
  const changed = { ...fakeProfile, decision: 'PILOT', signals30d: 3 };
  service.import([changed]);
  assert.equal(database.prepare('SELECT count(*) AS total FROM service_profiles').get().total, 3);
  assert.deepEqual(await get('/latest'), [changed, content]);
  assert.deepEqual(await get('/CODING/history'), [changed, past]);
});

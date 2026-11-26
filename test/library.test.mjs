import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createLibraryService } from '../dist/server/src/features/library/application/library-service.js';
import { sqliteLibraryRepository } from '../dist/server/src/features/library/infrastructure/sqlite-library-repository.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const migrations = fileURLToPath(new URL('../server/migrations', import.meta.url));
const resource = {
  url: 'https://example.com/resource', title: 'Tài liệu', publisher: 'Tác giả', kind: 'BLOG', market: 'VIETNAM',
  summary: 'Tóm tắt.', takeaway: 'Bài học.', topics: ['AI'],
};

test('library imports are idempotent and preserve saved state on updates', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createLibraryService(sqliteLibraryRepository(database));
  assert.deepEqual(service.list(), []);
  assert.equal(service.import([resource]), 1);
  assert.equal(service.setSaved(resource.url, true), true);
  assert.equal(service.setSaved(resource.url, true), true);
  service.import([{ ...resource, title: 'Đã cập nhật' }]);
  assert.deepEqual(service.list(), [{ ...resource, title: 'Đã cập nhật', saved: true }]);
  assert.equal(service.setSaved(resource.url, false), true);
  assert.equal(service.list()[0].saved, false);
  assert.equal(service.setSaved('https://example.com/absent', true), false);
});

test('library validates all resources before writing and requires case-study metadata', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createLibraryService(sqliteLibraryRepository(database));
  assert.throws(() => service.import([resource, { ...resource, url: 'javascript:alert(1)' }]), /Invalid library resource URL/);
  assert.throws(() => service.import([resource, resource]), /Duplicate library URL/);
  assert.throws(() => service.import([{ ...resource, kind: 'CASE_STUDY' }]), /library data object/);
  assert.deepEqual(service.list(), []);

  const caseStudy = { product: 'Công cụ', customer: 'Khách hàng', pricing: 'Phí năm' };
  service.import([{ ...resource, kind: 'CASE_STUDY', caseStudy }]);
  assert.deepEqual(service.list()[0].caseStudy, caseStudy);
});

test('library groups legacy resources and keeps curated themes and starting points', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createLibraryService(sqliteLibraryRepository(database));
  const channel = {
    ...resource,
    kind: 'YOUTUBE',
    theme: 'IOT',
    startHere: { label: 'Video nhập môn', url: 'https://example.com/lesson' },
  };
  const feed = {
    url: 'https://example.com/feed-article',
    title: 'In 3D với PrusaSlicer',
    publisher: resource.publisher,
    kind: 'BLOG',
    market: resource.market,
    summary: resource.summary,
    topics: [],
    fromFeed: true,
  };
  assert.throws(() => service.import([{ ...channel, theme: 'UNKNOWN' }]), /Invalid library theme/);
  assert.throws(() => service.import([{ ...channel, startHere: { ...channel.startHere, url: 'javascript:alert(1)' } }]), /Invalid starting-point URL/);
  assert.deepEqual(service.list(), []);

  service.import([channel, { ...resource, url: 'https://example.com/legacy', title: 'Làm vườn với trùn quế' }]);
  const promptArticle = { ...feed, url: 'https://example.com/images', title: 'Sửa ảnh bằng prompt cho tài liệu kỹ thuật' };
  const medusaArticle = { ...feed, url: 'https://example.com/medusa', title: 'Medusa v2: hiểu module và workflow' };
  sqliteLibraryRepository(database).saveCollected([feed, promptArticle, medusaArticle]);
  const items = new Map(service.list().map((item) => [item.url, item]));
  assert.deepEqual(items.get(channel.url), { ...channel, saved: false });
  assert.equal(items.get(feed.url).theme, 'MAKING');
  assert.equal(items.get('https://example.com/legacy').theme, 'FARMING');
  assert.equal(items.get(promptArticle.url).theme, 'AI');
  assert.equal(items.get(medusaArticle.url).theme, 'TOOLS');
});

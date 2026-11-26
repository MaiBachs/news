import assert from 'node:assert/strict';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createBulletinService } from '../dist/server/src/features/bulletins/application/bulletin-service.js';
import { resolveStoryTopic } from '../dist/server/src/features/bulletins/domain/story-topic.js';
import { sqliteBulletinRepository } from '../dist/server/src/features/bulletins/infrastructure/sqlite-bulletin-repository.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const migrations = fileURLToPath(new URL('../server/migrations', import.meta.url));
const example = {
  date: '2026-11-21',
  headline: 'Bản tổng hợp',
  summary: 'Một ghi chú ngắn.',
  opportunity: { title: 'Giả thuyết', evidence: 'Cần kiểm chứng.', experiment: 'Phỏng vấn người dùng.' },
  stories: [{
    title: 'Tin mới', summary: 'Tóm tắt ngắn.', market: 'VIETNAM', source: 'Nguồn',
    url: 'https://example.com/story', publishedOn: null, fullText: 'Không lưu trường ngoài hợp đồng.',
  }],
};

test('topic classification keeps specific evidence before its business source fallback', () => {
  const story = { ...example.stories[0], source: 'VietNamNet Kinh doanh', fromFeed: true };
  assert.equal(resolveStoryTopic({ ...story, title: 'Báo cáo thị trường tuần này' }), 'kinh-doanh');
  assert.equal(resolveStoryTopic({ ...story, title: 'Dự án mới', summary: 'Trang trại phục vụ khách tham quan.' }), 'nong-nghiep');
  assert.equal(resolveStoryTopic({ ...story, title: 'Lãi suất ngân hàng thay đổi' }), 'tai-chinh');
});

test('manual bulletin import validates source links and keeps the latest version for each date', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createBulletinService(sqliteBulletinRepository(database));
  assert.equal(service.latest(), null);

  assert.deepEqual(service.import(example), { date: example.date, stories: 1 });
  assert.equal('fullText' in service.latest().stories[0], false);
  service.import({ ...example, date: '2026-11-20', headline: 'Bản cũ' });
  service.import({ ...example, headline: 'Bản cập nhật' });
  assert.equal(service.latest().headline, 'Bản cập nhật');
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM bulletins').get().count, 2);

  assert.throws(() => service.import({ ...example, date: '2026-02-30' }), /calendar date/);
  assert.throws(() => service.import({ ...example, stories: [...example.stories, ...example.stories] }), /unique/);
  const invalidLink = { ...example.stories[0], url: 'javascript:alert(1)' };
  assert.throws(() => service.import({ ...example, stories: [invalidLink] }), /public HTTPS source/);
  assert.equal(service.latest().headline, 'Bản cập nhật');
});

test('opportunity activity counts distinct titles per month and includes bulletin replacements', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createBulletinService(sqliteBulletinRepository(database));
  assert.deepEqual(service.opportunityActivity(), []);

  service.import(example);
  service.import({ ...example, date: '2026-11-20' });
  service.import({ ...example, date: '2026-10-07' });
  assert.deepEqual(service.opportunityActivity(), [{ month: '2026-10', count: 1 }, { month: '2026-11', count: 1 }]);

  service.import({ ...example, opportunity: { ...example.opportunity, title: 'Giả thuyết khác' } });
  assert.deepEqual(service.opportunityActivity(), [{ month: '2026-10', count: 1 }, { month: '2026-11', count: 2 }]);
});

test('archive includes older articles, deduplicates links, and preserves the source snapshot for a specific bulletin', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createBulletinService(sqliteBulletinRepository(database));
  assert.deepEqual(service.archivedStories(null), []);

  const shared = { ...example.stories[0], title: 'Tóm tắt ban đầu', publishedOn: '2026-11-18' };
  const olderOnly = { ...shared, url: 'https://example.com/old-only', title: 'Tin từ bản cũ', publishedOn: '2026-11-17' };
  service.import({ ...example, date: '2026-11-20', stories: [shared, olderOnly] });
  const updated = { ...shared, title: 'Tóm tắt mới nhất' };
  const undated = { ...shared, url: 'https://example.com/undated', title: 'Tin chưa rõ ngày', publishedOn: null };
  service.import({ ...example, stories: [undated, updated] });

  assert.deepEqual(service.archivedStories(null).map(({ title }) => title), [updated.title, olderOnly.title, undated.title]);
  assert.deepEqual(service.archivedStories('2026-11-20').map(({ title }) => title), [shared.title, olderOnly.title]);
  assert.deepEqual(service.archivedStories(example.date).map(({ title }) => title), [updated.title, undated.title]);
  assert.deepEqual(service.archivedStories('2026-11-19'), []);
});

test('story digests follow the article URL without rewriting archived editions or feed excerpts', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createBulletinService(sqliteBulletinRepository(database));
  service.import(example);
  const collected = { ...example.stories[0], url: 'https://example.com/feed', summary: 'Original RSS excerpt', fromFeed: true };
  service.saveCollected([collected]);
  const first = { url: example.stories[0].url, basis: 'ARTICLE', keyPoints: ['Tóm tắt biên tập.'] };
  const second = { url: collected.url, basis: 'SOURCE_PREVIEW', keyPoints: ['Ý chính từ nguồn.'] };
  assert.equal(service.importDigests([first, second]), 2);
  assert.equal(service.latest().stories[0].digest, undefined);
  assert.deepEqual(service.archivedStories(example.date)[0].digest, { basis: first.basis, keyPoints: first.keyPoints });
  const fromFeed = () => service.archivedStories(null).find(({ url }) => url === second.url);
  assert.equal(fromFeed().summary, collected.summary);
  assert.deepEqual(fromFeed().digest, { basis: second.basis, keyPoints: second.keyPoints });

  const update = { ...second, keyPoints: ['Bản cập nhật.'] };
  assert.throws(() => service.importDigests([update, { ...first, keyPoints: ['a', ' a '] }]), /Duplicate story digest key point/);
  assert.throws(() => service.importDigests([update, update]), /Duplicate story digest URL/);
  assert.deepEqual(fromFeed().digest.keyPoints, second.keyPoints);
  service.importDigests([update]);
  assert.deepEqual(fromFeed().digest.keyPoints, update.keyPoints);
  assert.equal(database.prepare('SELECT COUNT(*) AS count FROM story_digests').get().count, 2);
});

test('detailed sections stay out of archive responses and remain available by original URL', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createBulletinService(sqliteBulletinRepository(database));
  service.import(example);
  const { url } = example.stories[0];
  const sections = [
    { heading: 'Bối cảnh', paragraphs: ['Nội dung chi tiết của bài.'] },
    { heading: 'Kết quả', paragraphs: ['Kết quả được bài gốc công bố.'] },
  ];
  const detail = { url, basis: 'ARTICLE', keyPoints: ['Một ý chính.'], sections };
  assert.equal(service.digestSections(url), null);
  assert.throws(() => service.importDigests([{ ...detail, basis: 'SOURCE_PREVIEW' }]), /original article/);
  assert.throws(() => service.importDigests([{ ...detail, sections: sections.slice(0, 1) }]), /two to ten/);
  service.importDigests([detail]);
  assert.deepEqual(service.digestSections(url), sections);
  assert.deepEqual(service.archivedStories(example.date)[0].digest, {
    basis: detail.basis, keyPoints: detail.keyPoints, hasDetails: true,
  });
});

test('news topics work for curated and old stories, with one primary topic per story', (context) => {
  const database = openDatabase(':memory:', migrations);
  context.after(() => database.close());
  const service = createBulletinService(sqliteBulletinRepository(database));
  const base = example.stories[0];
  const stories = [
    { ...base, title: 'Gateway nhận lệnh bằng giọng nói', summary: 'Thử nghiệm mạng Wi-Fi.' },
    { ...base, url: 'https://example.com/curated', title: 'Cổ phiếu ngành phần mềm', topic: 'kinh-doanh' },
    { ...base, url: 'https://example.com/voice', title: 'Bản cập nhật mới', summary: 'Tự động nhận dạng giọng nói.' },
    { ...base, url: 'https://example.com/unknown', title: 'Ai sẽ được lợi?' },
  ];
  service.import({ ...example, stories });
  service.saveCollected([{ ...base, url: 'https://example.com/feed-topic', title: '客户数据泄露', fromFeed: true }]);
  assert.deepEqual(service.latest().stories.map(({ topic }) => topic), ['aiot', 'kinh-doanh', 'giong-noi', undefined]);
  const topicsByUrl = (items) => new Map(items.map(({ url, topic }) => [url, topic]));
  assert.deepEqual(topicsByUrl(service.archivedStories(example.date)), topicsByUrl(service.latest().stories));
  assert.equal(service.archivedStories(null).find(({ fromFeed }) => fromFeed).topic, 'bao-mat');
  assert.throws(() => service.import({ ...example, stories: [{ ...base, topic: 'unknown' }] }), /Unknown story topic/);
  assert.equal(service.latest().stories.length, 4);
});

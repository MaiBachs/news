import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createBulletinService } from '../dist/server/src/features/bulletins/application/bulletin-service.js';
import { sqliteBulletinRepository } from '../dist/server/src/features/bulletins/infrastructure/sqlite-bulletin-repository.js';
import { createCollection } from '../dist/server/src/features/collection/application/collect-feeds.js';
import { selectBackfillEntries } from '../dist/server/src/features/collection/domain/feed-entry.js';
import { parseFeed } from '../dist/server/src/features/collection/infrastructure/parse-feed.js';
import { publicFeedClient } from '../dist/server/src/features/collection/infrastructure/public-feed-client.js';
import { createLibraryService } from '../dist/server/src/features/library/application/library-service.js';
import { sqliteLibraryRepository } from '../dist/server/src/features/library/infrastructure/sqlite-library-repository.js';
import { sqliteCommunityLocalization } from '../dist/server/src/features/library/infrastructure/sqlite-community-localization.js';
import { SourceService } from '../dist/server/src/features/sources/application/source-service.js';
import { sqliteSourceRepository } from '../dist/server/src/features/sources/infrastructure/sqlite-source-repository.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const base = new URL('https://example.com/rss');
const item = `<item><title>AI &amp; SaaS</title><link>/one?utm_source=feed#top</link>
  <description><![CDATA[<p>Trích &nbsp; đoạn</p><script>bỏ</script>]]></description>
  <pubDate>Sat, 21 Nov 2026 20:00:00 GMT</pubDate></item>`;
const rss = `<rss><channel>${item.repeat(2)}<item><title>Unsafe</title><link>javascript:alert(1)</link></item></channel></rss>`;
const news = { url: 'https://example.com/one', title: 'AI & SaaS', excerpt: 'Trích đoạn', publishedOn: '2026-11-22' };

test('RSS and Atom extract public links, short plain text and Vietnam publication dates', () => {
  assert.deepEqual(parseFeed(rss, base), [news]);
  const atom = `<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Video</title>
    <link rel="self" href="/api/123"/><link rel="alternate" href="https://www.youtube.com/watch?v=123"/>
    <content type="html">&lt;b&gt;${'水'.repeat(400)}&lt;/b&gt;</content></entry></feed>`;
  assert.deepEqual(parseFeed(atom, base), [{
    url: 'https://www.youtube.com/watch?v=123', title: 'Video', excerpt: `${'水'.repeat(179)}…`, publishedOn: null,
  }]);
  assert.throws(() => parseFeed('<!DOCTYPE rss SYSTEM "https://example.com/test"><rss/>', base), /DOCTYPE/);
  assert.throws(() => parseFeed('<html></html>', base), /RSS hoặc Atom/);
});

test('backfill selects recent dated news and keeps useful evergreen library articles', () => {
  const now = Date.parse('2026-11-21T22:00:00Z');
  const baseEntry = { ...news, title: 'A useful engineering article', excerpt: 'A substantive introduction to the original article.' };
  const old = { ...baseEntry, publishedOn: '2026-01-01' };
  const timeless = { ...baseEntry, publishedOn: null };
  const recent = { ...baseEntry, publishedOn: '2026-11-21' };
  const entries = [
    old, timeless, recent, baseEntry, { ...baseEntry, title: 'Sponsored: paywall advertorial' },
    { ...baseEntry, publishedOn: '2026-11-23' }, { ...baseEntry, excerpt: 'Short' },
  ];
  assert.deepEqual(selectBackfillEntries(entries, 'NEWS', now), [baseEntry, recent]);
  assert.deepEqual(selectBackfillEntries(entries, 'LIBRARY', now), [baseEntry, recent, old, timeless]);
  assert.equal(selectBackfillEntries(Array(120).fill(recent), 'NEWS', now).length, 100);
  assert.equal(selectBackfillEntries(Array(120).fill(recent), 'LIBRARY', now).length, 80);
});

test('feed redirects honor destination robots and stop retrying rate-limited origins', async () => {
  const visits = [];
  const reader = publicFeedClient(async (url) => {
    visits.push(url.href);
    const replies = {
      'https://example.com/robots.txt': { status: 404 },
      'https://example.com/rss': { status: 301, location: 'https://redirect.example.com/rss' },
      'https://redirect.example.com/robots.txt': { status: 200, body: 'User-agent: RadarFeedReader\nDisallow: /rss' },
      'https://example.com/retry': { status: 429 },
    };
    return { body: '', ...replies[url.href] };
  }, async () => {});
  await assert.rejects(reader(base.href), /robots.txt không cho phép/);
  assert.deepEqual(visits, [
    'https://example.com/robots.txt', 'https://example.com/rss', 'https://redirect.example.com/robots.txt',
  ]);
  await assert.rejects(reader('https://example.com/retry'), /429/);
  await assert.rejects(reader('https://example.com/retry'), /429/);
  assert.equal(visits.length, 4);
  await assert.rejects(publicFeedClient()('http://127.0.0.1/rss'), /tên miền công khai/);
});

test('collection skips disabled and failing feeds and keeps archive editions and bookmarks intact', async () => {
  const database = openDatabase(':memory:', 'server/migrations');
  try {
    const bulletins = createBulletinService(sqliteBulletinRepository(database));
    const library = createLibraryService(sqliteLibraryRepository(database));
    const entries = [
      ['news', 'NEWS', true], ['disabled', 'NEWS', false], ['offline', 'NEWS', true], ['library', 'LIBRARY', true],
    ].map(([id, purpose, enabled]) => ({ name: id, id, feedUrl: `https://example.com/${id}`, purpose, enabled, market: 'GLOBAL' }));
    const edited = { url: news.url, title: 'Bài biên tập', summary: 'Tóm tắt', publishedOn: '2026-11-01', source: 'Radar', market: 'GLOBAL' };
    bulletins.import({
      date: '2026-11-02', headline: 'Bản tin', summary: 'Tóm tắt', stories: [edited],
      opportunity: { title: 'Cơ hội', evidence: 'Dữ liệu', experiment: 'Thử' },
    });
    const collect = createCollection({
      listSources: () => entries,
      readFeed: async (url) => {
        if (url.endsWith('/offline')) throw new Error('Offline');
        assert.ok(!url.endsWith('/disabled'));
        return [news, { ...news, url: 'https://example.com/two', title: 'Tin mới' }];
      },
      saveStories: bulletins.saveCollected, saveResources: library.saveCollected,
    });
    assert.deepEqual((await collect()).map((result) => result.added ?? result.error), [2, 'Offline', 2]);
    assert.equal(library.setSaved(news.url, true), true);
    assert.deepEqual((await collect()).map((result) => result.added ?? result.error), [0, 'Offline', 0]);
    assert.deepEqual(bulletins.archivedStories('2026-11-02'), [edited]);
    const [collected, curated] = bulletins.archivedStories(null);
    assert.equal(collected.fromFeed, true);
    assert.deepEqual(curated, edited);
    assert.equal(library.list().find(({ url }) => url === news.url).saved, true);
  } finally {
    database.close();
  }
});

test('China community collection selects public discussions and preserves translations and saved status on retry', async (context) => {
  const database = openDatabase(':memory:', 'server/migrations');
  context.after(() => database.close());
  const sources = new SourceService(sqliteSourceRepository(database));
  const library = createLibraryService(sqliteLibraryRepository(database));
  const localization = sqliteCommunityLocalization(database);
  const raw = { name: 'Diễn đàn', feedUrl: 'https://example.com/forum.xml', market: 'CHINA', purpose: 'LIBRARY', libraryKind: 'COMMUNITY' };
  const enabled = sources.add(raw);
  const disabled = sources.add({ ...raw, feedUrl: 'https://example.com/disabled.xml' });
  assert.ok(sources.setEnabled(disabled.id, false));
  sources.add({ name: 'Blog', feedUrl: 'https://example.com/blog.xml', market: 'CHINA', purpose: 'LIBRARY' });
  assert.throws(() => sources.add({ ...raw, market: 'GLOBAL' }), /thị trường Trung Quốc/);

  const post = { ...news, title: '独立开发：给 SaaS 定价', excerpt: '这篇文章分享通过客户访谈验证产品定价以及获得第一批订阅用户的方法。' };
  const visits = [];
  const collect = createCollection({
    listSources: () => sources.list(),
    readFeed: async (url) => {
      visits.push(url);
      return [post, { ...post, url: 'https://example.com/giveaway', title: '抽奖：免费领取 SaaS 订阅' }];
    },
    saveStories: () => { throw new Error('Discussion must be saved to the library.'); },
    saveResources: library.saveCollected,
  });
  assert.deepEqual((await collect({ chinaCommunityOnly: true })).map(({ source, selected, added }) => [source.id, selected, added]), [[enabled.id, 1, 1]]);
  const [original] = localization.untranslated();
  assert.deepEqual(original, { url: post.url, title: post.title, summary: post.excerpt });
  const translation = { title: 'Định giá SaaS', summary: 'Dùng phỏng vấn để kiểm chứng giá.' };
  assert.equal(localization.save([{ original, translation }]), 1);
  assert.equal(library.setSaved(post.url, true), true);
  assert.equal((await collect({ chinaCommunityOnly: true }))[0].added, 0);
  assert.deepEqual(visits, [raw.feedUrl, raw.feedUrl]);
  assert.deepEqual(localization.untranslated(), []);
  assert.deepEqual(library.list(), [{
    ...original, translation, kind: 'COMMUNITY', fromFeed: true, saved: true, publishedOn: post.publishedOn,
    publisher: raw.name, market: 'CHINA', theme: 'BUSINESS', topics: ['Kiếm tiền & tìm khách'],
  }]);
});

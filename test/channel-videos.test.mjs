import assert from 'node:assert/strict';
import { once } from 'node:events';
import { test } from 'node:test';
import { createApp, createChannelVideos } from '../dist/server/src/app.js';
import { readConfig } from '../dist/server/src/config.js';
import { createLibraryService } from '../dist/server/src/features/library/application/library-service.js';
import { sqliteLibraryRepository } from '../dist/server/src/features/library/infrastructure/sqlite-library-repository.js';
import { youtubeDataClient } from '../dist/server/src/features/library/infrastructure/youtube-data-client.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

const channelUrl = 'https://www.youtube.com/@radar-example';
const originalUrl = 'https://www.youtube.com/watch?v=abcdefghijk';
const seed = { channelUrl, url: originalUrl, title: 'Video chọn lọc', summary: 'Giới thiệu.', keyPoints: ['Ý chính.'] };

test('YouTube collection keeps editorial notes and refreshes the channel snapshot', async (context) => {
  const database = openDatabase(':memory:', 'server/migrations');
  context.after(() => database.close());
  createLibraryService(sqliteLibraryRepository(database)).import([{
    url: channelUrl, kind: 'YOUTUBE', market: 'GLOBAL', title: 'Kênh mẫu', publisher: 'Kênh mẫu',
    summary: 'Tóm tắt.', takeaway: 'Việc cần học.', topics: ['AI'],
  }]);
  const service = createChannelVideos(database);
  assert.throws(() => service.import([seed, { ...seed, url: originalUrl + '&t=14' }]), /Video trùng/);
  assert.throws(() => service.import([seed, { ...seed, channelUrl: 'https://www.youtube.com/@absent' }]), /Không tìm thấy kênh/);
  assert.deepEqual(service.list(channelUrl), []);
  assert.equal(service.import([seed]), 1);
  const item = (videoId, privacyStatus) => ({
    snippet: { title: 'Title from YouTube', description: 'a'.repeat(500) },
    contentDetails: { videoId, videoPublishedAt: '2026-10-15T10:00:00Z' }, status: { privacyStatus },
  });
  let requests = 0;
  const reader = youtubeDataClient('fixture-key', async (url) => {
    requests++;
    assert.equal(url.origin, 'https://www.googleapis.com');
    if (url.pathname.endsWith('/channels')) {
      assert.equal(url.searchParams.get('forHandle'), '@radar-example');
      return Response.json({ items: [{ contentDetails: { relatedPlaylists: { uploads: 'UUfixture' } } }] });
    }
    assert.equal(url.searchParams.get('playlistId'), 'UUfixture');
    assert.equal(url.searchParams.get('maxResults'), '15');
    return Response.json({ items: [item('abcdefghijk', 'public'), item('abcdefghij2', 'public'), item('abcdefghij3', 'private')] });
  });
  await service.collect(reader);
  assert.equal(requests, 2);
  const [recent, editorial] = service.list(channelUrl);
  assert.equal(recent.url, 'https://www.youtube.com/watch?v=abcdefghij2');
  assert.equal(recent.publishedOn, '2026-10-15');
  assert.equal(recent.summary.length, 480);
  assert.equal(recent.basis, 'DESCRIPTION');
  assert.equal(editorial.title, seed.title);
  assert.deepEqual(editorial.keyPoints, seed.keyPoints);
  assert.equal(service.list(channelUrl).length, 2);

  await service.collect(async () => { throw new Error('Không kết nối được.'); });
  assert.equal(service.list(channelUrl).length, 2);
  await service.collect(async () => []);
  assert.deepEqual(service.list(channelUrl).map(({ url }) => url), [originalUrl]);
  await service.collect(reader, Date.now() - 30 * 86_400_000);
  assert.deepEqual(service.list(channelUrl).map(({ url }) => url), [originalUrl]);

  const server = createApp(database, readConfig({})).listen(0, '127.0.0.1');
  context.after(() => new Promise((resolve) => server.close(resolve)));
  await once(server, 'listening');
  const endpoint = `http://127.0.0.1:${server.address().port}/api/library/channel-videos`;
  const response = await fetch(`${endpoint}?${new URLSearchParams({ channelUrl })}`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), service.list(channelUrl));
  assert.equal((await fetch(`${endpoint}?${new URLSearchParams({ channelUrl: originalUrl })}`)).status, 400);
  assert.equal((await fetch(`${endpoint}?${new URLSearchParams({ channelUrl: 'https://www.youtube.com/@absent' })}`)).status, 404);
});

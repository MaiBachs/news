import type { DatabaseSync } from 'node:sqlite';
import type { ChannelVideo } from '../../../../../shared/library.js';
import type { ChannelVideoRepository } from '../application/channel-video-service.js';

export function sqliteChannelVideoRepository(database: DatabaseSync): ChannelVideoRepository {
  const list = database.prepare(`
    SELECT content FROM channel_videos WHERE channel_url = ? AND (expires_at IS NULL OR expires_at > ?)
    ORDER BY json_extract(content, '$.publishedOn') DESC NULLS LAST, json_extract(content, '$.title'), url
  `);
  const upsert = database.prepare(`
    INSERT INTO channel_videos (channel_url, url, content, expires_at) VALUES (?, ?, ?, ?)
    ON CONFLICT (channel_url, url) DO UPDATE SET content = excluded.content, expires_at = excluded.expires_at
    WHERE channel_videos.expires_at IS NOT NULL OR excluded.expires_at IS NULL
  `);
  const deleteCollected = database.prepare('DELETE FROM channel_videos WHERE channel_url = ? AND expires_at IS NOT NULL');
  const deleteExpired = database.prepare('DELETE FROM channel_videos WHERE expires_at <= ?');

  function transaction(write: () => void) {
    database.exec('BEGIN IMMEDIATE');
    try {
      write();
      database.exec('COMMIT');
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }

  return {
    list: (channelUrl, now) => list.all(channelUrl, now).map(({ content }) => JSON.parse(String(content)) as ChannelVideo),
    saveEditorial(entries) {
      transaction(() => {
        for (const { channelUrl, video } of entries) upsert.run(channelUrl, video.url, JSON.stringify(video), null);
      });
    },
    replaceCollected(channelUrl, videos, expiresAt) {
      transaction(() => {
        deleteCollected.run(channelUrl);
        for (const video of videos) upsert.run(channelUrl, video.url, JSON.stringify(video), expiresAt);
      });
    },
    deleteExpired: (now) => { deleteExpired.run(now); },
  };
}

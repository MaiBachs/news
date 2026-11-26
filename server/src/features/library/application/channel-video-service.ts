import type { ChannelVideo, LibraryItem } from '../../../../../shared/library.js';
import type { ChannelVideoEntry } from '../domain/channel-video.js';
import { isYouTubeChannel, parseEditorialVideos } from '../domain/channel-video.js';

export interface ChannelVideoRepository {
  list(channelUrl: string, now: number): ChannelVideo[];
  saveEditorial(entries: ChannelVideoEntry[]): void;
  replaceCollected(channelUrl: string, videos: ChannelVideo[], expiresAt: number): void;
  deleteExpired(now: number): void;
}

const collectedLifetime = 29 * 24 * 60 * 60 * 1000;

export function createChannelVideoService(repository: ChannelVideoRepository, listLibrary: () => LibraryItem[]) {
  const channels = () => listLibrary().filter(isYouTubeChannel);
  return {
    list(channelUrl: string) {
      return channels().some(({ url }) => url === channelUrl) ? repository.list(channelUrl, Date.now()) : null;
    },
    import(input: unknown) {
      const entries = parseEditorialVideos(input);
      const urls = new Set(channels().map(({ url }) => url));
      if (entries.some(({ channelUrl }) => !urls.has(channelUrl))) throw new Error('Không tìm thấy kênh YouTube trong Thư viện.');
      repository.saveEditorial(entries);
      return entries.length;
    },
    async collect(readVideos: (channelUrl: string) => Promise<ChannelVideo[]>, now = Date.now()) {
      repository.deleteExpired(now);
      const results = [];
      for (const channel of channels()) {
        let videos;
        try {
          videos = await readVideos(channel.url);
        } catch (error) {
          results.push({ channel, error: error instanceof Error ? error.message : 'Không tải được video.' });
          continue;
        }
        repository.replaceCollected(channel.url, videos, now + collectedLifetime);
        results.push({ channel, count: videos.length });
      }
      return results;
    },
  };
}

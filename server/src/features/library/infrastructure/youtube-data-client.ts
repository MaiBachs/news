import type { ChannelVideo } from '../../../../../shared/library.js';
import { calendarDate, youtubeVideoUrl } from '../domain/channel-video.js';

const apiBase = 'https://www.googleapis.com/youtube/v3/';

export function youtubeDataClient(apiKey: string, request = fetch) {
  async function read(endpoint: 'channels' | 'playlistItems', params: Record<string, string>) {
    const url = new URL(endpoint, apiBase);
    url.search = new URLSearchParams({ ...params, key: apiKey }).toString();
    let response;
    try {
      response = await request(url, { signal: AbortSignal.timeout(12_000), redirect: 'error' });
    } catch {
      throw new Error('Không kết nối được với YouTube Data API.');
    }
    if (!response.ok) throw new Error(`YouTube Data API trả về HTTP ${response.status}.`);
    const body = await response.json().catch(() => null);
    const items = object(body)?.items;
    if (!Array.isArray(items)) throw new Error('YouTube Data API trả về dữ liệu không hợp lệ.');
    return items as unknown[];
  }

  return async (channelUrl: string): Promise<ChannelVideo[]> => {
    const channelPath = new URL(channelUrl).pathname.replace(/\/$/, '').split('/').at(-1) ?? '';
    const [channel] = await read('channels', {
      part: 'contentDetails',
      ...(channelPath.startsWith('@') ? { forHandle: channelPath } : { id: channelPath }),
      fields: 'items(contentDetails/relatedPlaylists/uploads)',
    });
    const playlistId = object(object(object(channel)?.contentDetails)?.relatedPlaylists)?.uploads;
    if (typeof playlistId !== 'string' || !/^[\w-]+$/.test(playlistId)) throw new Error('Không tìm thấy danh sách video của kênh.');
    const items = await read('playlistItems', {
      part: 'snippet,contentDetails,status', playlistId, maxResults: '15',
      fields: 'items(snippet(title,description),contentDetails(videoId,videoPublishedAt),status(privacyStatus))',
    });
    return items.flatMap((item) => {
      const data = object(item);
      if (object(data?.status)?.privacyStatus !== 'public') return [];
      const details = object(data?.contentDetails);
      const snippet = object(data?.snippet);
      const url = youtubeVideoUrl(details?.videoId);
      const title = excerpt(snippet?.title, 200);
      if (!url || !title) return [];
      return [{
        url, title, summary: excerpt(snippet?.description, 480),
        publishedOn: calendarDate(typeof details?.videoPublishedAt === 'string' ? details.videoPublishedAt.slice(0, 10) : null),
        basis: 'DESCRIPTION',
      }];
    });
  };
}

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === 'object' ? value as Record<string, unknown> : undefined;
}

function excerpt(value: unknown, limit: number) {
  if (typeof value !== 'string') return '';
  const text = Array.from(value.replace(/\s+/g, ' ').trim());
  return text.length <= limit ? text.join('') : `${text.slice(0, limit - 1).join('').trimEnd()}…`;
}

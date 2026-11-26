import type { ChannelVideo, LibraryResource } from '../../../../../shared/library.js';
import { youtubeChannelUrlPattern } from '../../../../../shared/library.js';
import { parseLibraryUrl } from './library-resource.js';

export function isYouTubeChannel(resource: LibraryResource) {
  return resource.kind === 'YOUTUBE' && !resource.fromFeed && youtubeChannelUrlPattern.test(resource.url);
}

export interface ChannelVideoEntry {
  channelUrl: string;
  video: ChannelVideo;
}

export function youtubeVideoUrl(id: unknown) {
  return typeof id === 'string' && /^[\w-]{11}$/.test(id) ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function parseEditorialVideos(input: unknown): ChannelVideoEntry[] {
  if (!Array.isArray(input) || !input.length) throw new Error('Tệp cần có ít nhất một video.');
  const entries = input.map((item) => {
    if (!item || typeof item !== 'object') throw new Error('Dữ liệu video không hợp lệ.');
    const raw = item as Record<string, unknown>;
    const channelUrl = parseLibraryUrl(raw.channelUrl);
    const sourceUrl = parseLibraryUrl(raw.url);
    const original = sourceUrl ? new URL(sourceUrl) : null;
    const url = original?.origin === 'https://www.youtube.com' && original.pathname === '/watch'
      ? youtubeVideoUrl(original.searchParams.get('v')) : null;
    if (!channelUrl || !youtubeChannelUrlPattern.test(channelUrl) || !url) throw new Error('Link kênh hoặc video YouTube không hợp lệ.');
    const publishedOn = raw.publishedOn == null ? null : calendarDate(raw.publishedOn);
    if (raw.publishedOn != null && !publishedOn) throw new Error('Ngày đăng video không hợp lệ.');
    if (!Array.isArray(raw.keyPoints) || raw.keyPoints.length < 1 || raw.keyPoints.length > 5) {
      throw new Error('Mỗi video cần từ một đến năm ý chính.');
    }
    const video: ChannelVideo = {
      url, publishedOn, title: requiredText(raw.title, 200), summary: requiredText(raw.summary, 260),
      keyPoints: raw.keyPoints.map((point) => requiredText(point, 260)), basis: 'EDITORIAL',
    };
    return { channelUrl, video };
  });
  if (new Set(entries.map(({ channelUrl, video }) => `${channelUrl} ${video.url}`)).size !== entries.length) {
    throw new Error('Video trùng trong cùng kênh.');
  }
  return entries;
}

export function calendarDate(value: unknown) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null;
}

function requiredText(value: unknown, max: number) {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text || text.length > max) throw new Error('Nội dung giới thiệu hoặc ý chính của video không hợp lệ.');
  return text;
}

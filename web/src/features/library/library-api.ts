import type { ChannelVideo, LibraryItem } from '../../../../shared/library';
import { requestJson } from '../../shared/http';

export function getLibraryItems(signal: AbortSignal) {
  return requestJson<LibraryItem[]>('/api/library', { signal });
}

export function getChannelVideos(channelUrl: string, signal: AbortSignal) {
  return requestJson<ChannelVideo[]>(`/api/library/channel-videos?${new URLSearchParams({ channelUrl })}`, { signal });
}

export function setLibrarySaved(url: string, saved: boolean) {
  return requestJson<void>('/api/library/bookmark', {
    method: 'PATCH',
    body: JSON.stringify({ url, saved }),
  });
}

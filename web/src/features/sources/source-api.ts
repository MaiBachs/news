import type { FeedSource, NewSource } from '../../../../shared/sources';
import { requestJson } from '../../shared/http';

const endpoint = '/api/sources';

export function listSources(signal?: AbortSignal) {
  return requestJson<FeedSource[]>(endpoint, { signal });
}

export function addSource(source: NewSource) {
  return requestJson<FeedSource>(endpoint, { method: 'POST', body: JSON.stringify(source) });
}

export function setSourceEnabled(id: string, enabled: boolean) {
  return requestJson<void>(`${endpoint}/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ enabled }),
  });
}

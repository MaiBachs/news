import type { ArchivePage, ArchiveQuery, Bulletin, OpportunityMonth, StoryDigestSection } from '../../../../shared/bulletins';
import { requestJson } from '../../shared/http';

export function getLatestBulletin(signal: AbortSignal) {
  return requestJson<Bulletin | null>('/api/bulletins/latest', { signal });
}

export function getArchivePage(query: ArchiveQuery, signal: AbortSignal) {
  const params = new URLSearchParams();
  if (query.bulletinDate) params.set('bulletinDate', query.bulletinDate);
  if (query.market) params.set('market', query.market);
  if (query.topic) params.set('topic', query.topic);
  if (query.search.trim()) params.set('search', query.search.trim());
  if (query.offset) params.set('offset', String(query.offset));
  if (query.minScore !== undefined) params.set('minScore', String(query.minScore));
  return requestJson<ArchivePage>(`/api/bulletins/archive?${params}`, { signal });
}

export function getOpportunityActivity(signal: AbortSignal) {
  return requestJson<OpportunityMonth[]>('/api/bulletins/opportunity-activity', { signal });
}

export function getStoryDigestSections(url: string, signal: AbortSignal) {
  return requestJson<StoryDigestSection[]>(`/api/bulletins/story-summary?${new URLSearchParams({ url })}`, { signal });
}

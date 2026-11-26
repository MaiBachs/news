import type { SourcePurpose } from '../../../../../shared/sources.js';

export interface FeedEntry {
  url: string;
  title: string;
  excerpt: string;
  publishedOn: string | null;
}

export function selectBackfillEntries(entries: FeedEntry[], purpose: SourcePurpose, now: number) {
  const earliest = new Date(now - 180 * 86_400_000).toISOString().slice(0, 10);
  const today = new Date(now + 7 * 3_600_000).toISOString().slice(0, 10);
  const explicitAds = /^(?:\[\s*)?(?:sponsored(?: content)?|advertorial|quảng cáo|bài viết tài trợ|广告|商业推广)(?:\s*[\]:：—-]|$)/iu;
  const eligible = entries.filter(({ excerpt, title, publishedOn }) => (
    Array.from(excerpt).length >= 30
    && !explicitAds.test(title)
    && (!publishedOn || publishedOn <= today)
    && (purpose === 'LIBRARY' || (publishedOn !== null && publishedOn >= earliest))
  ));
  eligible.sort((left, right) => (right.publishedOn ?? '').localeCompare(left.publishedOn ?? ''));
  return eligible.slice(0, purpose === 'NEWS' ? 100 : 80);
}

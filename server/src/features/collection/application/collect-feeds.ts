import type { BulletinStory } from '../../../../../shared/bulletins.js';
import type { LibraryResource } from '../../../../../shared/library.js';
import type { FeedSource } from '../../../../../shared/sources.js';
import { selectCommunityEntries } from '../domain/community-entry.js';
import type { FeedEntry } from '../domain/feed-entry.js';
import { selectBackfillEntries } from '../domain/feed-entry.js';

interface CollectionPorts {
  listSources(): FeedSource[];
  readFeed(url: string): Promise<FeedEntry[]>;
  saveStories(stories: BulletinStory[]): number;
  saveResources(resources: LibraryResource[]): number;
}

export type CollectionResult = {
  source: FeedSource;
} & ({ found: number; selected: number; added: number } | { error: string });

export function createCollection(ports: CollectionPorts) {
  return async ({ backfill = false, chinaCommunityOnly = false, now = Date.now() } = {}): Promise<CollectionResult[]> => {
    const results: CollectionResult[] = [];
    const sources = ports.listSources().filter((source) => source.enabled && (!chinaCommunityOnly || source.libraryKind === 'COMMUNITY'));
    for (const source of sources) {
      let entries;
      try {
        entries = await ports.readFeed(source.feedUrl);
      } catch (error) {
        results.push({ source, error: error instanceof Error ? error.message : 'Không đọc được nguồn.' });
        continue;
      }
      if (source.libraryKind === 'COMMUNITY') {
        const resources = selectCommunityEntries(entries, backfill, now);
        const added = resources.length ? ports.saveResources(resources.map((entry) => ({
          url: entry.url, title: entry.title, summary: entry.excerpt, publisher: source.name,
          market: source.market, kind: 'COMMUNITY', fromFeed: true, publishedOn: entry.publishedOn,
          theme: entry.theme, topics: entry.topics,
        }))) : 0;
        results.push({ source, found: entries.length, selected: resources.length, added });
        continue;
      }
      const news = source.purpose === 'NEWS';
      const selected = backfill
        ? selectBackfillEntries(entries, source.purpose, now)
        : entries.slice(0, news ? 12 : 4);
      const added = !selected.length ? 0 : news
        ? ports.saveStories(selected.map((entry) => ({
          url: entry.url, title: entry.title, summary: entry.excerpt, publishedOn: entry.publishedOn,
          source: source.name, market: source.market, fromFeed: true,
        })))
        : ports.saveResources(selected.map((entry) => ({
          url: entry.url, title: entry.title, summary: entry.excerpt, publisher: source.name,
          market: source.market, kind: new URL(entry.url).hostname === 'www.youtube.com' ? 'YOUTUBE' : 'BLOG',
          fromFeed: true, topics: [],
        })));
      results.push({ source, found: entries.length, selected: selected.length, added });
    }
    return results;
  };
}

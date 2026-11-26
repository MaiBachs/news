import type { ArchiveQuery, Bulletin, BulletinStory, OpportunityMonth, StoryDigestSection } from '../../../../../shared/bulletins.js';
import { buildArchivePage } from '../domain/archive-page.js';
import type { StoryDigestRecord } from '../domain/bulletin.js';
import { parseBulletin, parseStoryDigests } from '../domain/bulletin.js';
import { resolveStoryTopic } from '../domain/story-topic.js';

export interface BulletinRepository {
  latest(): Bulletin | null;
  archivedStories(bulletinDate: string | null): BulletinStory[];
  scanArchivedStories(bulletinDate: string | null): Iterable<BulletinStory>;
  opportunityActivity(): OpportunityMonth[];
  save(bulletin: Bulletin): void;
  saveCollected(stories: BulletinStory[]): number;
  digestSections(url: string): StoryDigestSection[] | null;
  saveDigests(digests: StoryDigestRecord[]): void;
}

export function createBulletinService(repository: BulletinRepository) {
  return {
    latest() {
      const bulletin = repository.latest();
      return bulletin ? { ...bulletin, stories: bulletin.stories.map(withTopic) } : null;
    },
    archivedStories: (bulletinDate: string | null) => repository.archivedStories(bulletinDate).map(withTopic),
    archivePage(query: ArchiveQuery) {
      const stories = function* () {
        for (const story of repository.scanArchivedStories(query.bulletinDate)) yield withTopic(story);
      };
      return buildArchivePage(stories(), query);
    },
    opportunityActivity: () => repository.opportunityActivity(),
    saveCollected: (stories: BulletinStory[]) => repository.saveCollected(stories),
    digestSections: (url: string) => repository.digestSections(url),
    importDigests(input: unknown) {
      const digests = parseStoryDigests(input);
      repository.saveDigests(digests);
      return digests.length;
    },
    import(input: unknown) {
      const bulletin = parseBulletin(input);
      repository.save(bulletin);
      return { date: bulletin.date, stories: bulletin.stories.length };
    },
  };
}

function withTopic(story: BulletinStory): BulletinStory {
  const topic = resolveStoryTopic(story);
  return topic ? { ...story, topic } : story;
}

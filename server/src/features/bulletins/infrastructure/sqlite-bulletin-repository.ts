import type { DatabaseSync } from 'node:sqlite';
import type { Bulletin, BulletinStory, StoryDigest, StoryDigestSection } from '../../../../../shared/bulletins.js';
import type { BulletinRepository } from '../application/bulletin-service.js';
import { translationLanguage } from '../domain/story-language.js';

export function sqliteBulletinRepository(database: DatabaseSync): BulletinRepository {
  const latest = database.prepare('SELECT content FROM bulletins ORDER BY date DESC LIMIT 1');
  const archive = database.prepare(`
    WITH editorial AS (
      SELECT item.value AS story, json_extract(item.value, '$.url') AS url, bulletins.date AS bulletin_date,
        json_extract(item.value, '$.publishedOn') AS published_on,
        ROW_NUMBER() OVER (PARTITION BY json_extract(item.value, '$.url') ORDER BY bulletins.date DESC) AS position
      FROM bulletins CROSS JOIN json_each(bulletins.content, '$.stories') AS item
      WHERE ? IS NULL OR bulletins.date = ?
    ), chosen AS (
      SELECT story, url, bulletin_date, published_on FROM editorial WHERE position = 1
      UNION ALL
      SELECT content, url, NULL, published_on FROM collected_stories
      WHERE ? IS NULL AND NOT EXISTS (SELECT 1 FROM editorial WHERE editorial.url = collected_stories.url)
    )
    SELECT story, chosen.url AS url, json_remove(story_digests.content, '$.sections') AS digest,
      json_type(story_digests.content, '$.sections') = 'array' AS has_details
    FROM chosen
    LEFT JOIN story_digests ON story_digests.url = chosen.url
    ORDER BY published_on DESC, bulletin_date DESC, chosen.url
  `);
  const activity = database.prepare(`
    SELECT substr(date, 1, 7) AS month, COUNT(DISTINCT json_extract(content, '$.opportunity.title')) AS count
    FROM bulletins
    GROUP BY month
    ORDER BY month DESC
    LIMIT 12
  `);
  const save = database.prepare(`
    INSERT INTO bulletins (date, content) VALUES (?, ?)
    ON CONFLICT (date) DO UPDATE SET content = excluded.content
  `);
  const saveCollected = database.prepare(`
    INSERT INTO collected_stories (url, content, translation_needed) VALUES (?, ?, ?) ON CONFLICT (url) DO NOTHING
  `);
  const saveDigest = database.prepare(`
    INSERT INTO story_digests (url, content) VALUES (?, ?)
    ON CONFLICT (url) DO UPDATE SET content = excluded.content
  `);
  const digestDetails = database.prepare("SELECT json_extract(content, '$.sections') AS sections FROM story_digests WHERE url = ?");

  function writeBatch<T>(write: () => T): T {
    database.exec('BEGIN IMMEDIATE');
    try {
      const result = write();
      database.exec('COMMIT');
      return result;
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }

  function* scanArchivedStories(bulletinDate: string | null) {
    for (const { story, url, digest, has_details } of archive.iterate(bulletinDate, bulletinDate, bulletinDate)) {
      const entry = { ...JSON.parse(String(story)), url: String(url) } as BulletinStory;
      if (typeof digest === 'string') {
        entry.digest = JSON.parse(digest) as StoryDigest;
        if (has_details === 1) entry.digest.hasDetails = true;
      }
      yield entry;
    }
  }

  return {
    latest() {
      const content = latest.get()?.content;
      return typeof content === 'string' ? JSON.parse(content) as Bulletin : null;
    },
    archivedStories(bulletinDate) {
      return [...scanArchivedStories(bulletinDate)];
    },
    scanArchivedStories,
    opportunityActivity() {
      return activity.all().map(({ month, count }) => ({ month: String(month), count: Number(count) })).reverse();
    },
    save(bulletin) {
      save.run(bulletin.date, JSON.stringify(bulletin));
    },
    saveCollected(stories) {
      return writeBatch(() => {
        let added = 0;
        for (const { url, ...story } of stories) {
          const needsTranslation = !story.translation && Boolean(translationLanguage(story.title) || translationLanguage(story.summary));
          added += Number(saveCollected.run(url, JSON.stringify(story), Number(needsTranslation)).changes);
        }
        return added;
      });
    },
    digestSections(url) {
      const sections = digestDetails.get(url)?.sections;
      return typeof sections === 'string' ? JSON.parse(sections) as StoryDigestSection[] : null;
    },
    saveDigests(digests) {
      writeBatch(() => {
        for (const { url, ...digest } of digests) saveDigest.run(url, JSON.stringify(digest));
      });
    },
  };
}

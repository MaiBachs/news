import type { DatabaseSync } from 'node:sqlite';
import type { StoryLocalizationRepository } from '../application/localize-stories.js';

export function sqliteStoryLocalization(database: DatabaseSync): StoryLocalizationRepository {
  const pending = database.prepare(`
    SELECT url, json_extract(content, '$.title') AS title, json_extract(content, '$.summary') AS summary
    FROM collected_stories
    WHERE translation_needed IS NOT 0 AND json_type(content, '$.translation') IS NULL
    ORDER BY published_on DESC, url
  `);
  const unprocessed = `WHERE url = ? AND translation_needed IS NOT 0 AND json_type(content, '$.translation') IS NULL
    AND json_extract(content, '$.title') = ? AND json_extract(content, '$.summary') = ?`;
  const save = database.prepare(`UPDATE collected_stories
    SET content = json_set(content, '$.translation', json(?)), translation_needed = 0 ${unprocessed}`);
  const mark = database.prepare(`UPDATE collected_stories SET translation_needed = 0 ${unprocessed}`);

  function write<T>(operation: () => T): T {
    database.exec('BEGIN IMMEDIATE');
    try {
      const result = operation();
      database.exec('COMMIT');
      return result;
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }
  return {
    untranslated: () => pending.all().map(({ url, title, summary }) => ({
      url: String(url), title: String(title), summary: typeof summary === 'string' ? summary : '',
    })),
    markLocal(rows) {
      if (rows.length) write(() => {
        for (const { url, title, summary } of rows) mark.run(url, title, summary);
      });
    },
    save(rows) {
      return write(() => {
        let changes = 0;
        for (const { original, translation } of rows) {
          changes += Number(save.run(JSON.stringify(translation), original.url, original.title, original.summary).changes);
        }
        return changes;
      });
    },
  };
}

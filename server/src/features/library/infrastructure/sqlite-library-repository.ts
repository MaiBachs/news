import type { DatabaseSync } from 'node:sqlite';
import type { LibraryResource } from '../../../../../shared/library.js';
import type { LibraryRepository } from '../application/library-service.js';

export function sqliteLibraryRepository(database: DatabaseSync): LibraryRepository {
  const list = database.prepare(`
    SELECT url, content, saved FROM library_items
    ORDER BY json_extract(content, '$.fromFeed') NULLS FIRST,
      CASE WHEN json_extract(content, '$.kind') = 'COMMUNITY' THEN json_extract(content, '$.publishedOn') END DESC NULLS LAST,
      json_extract(content, '$.title'), url
  `);
  const upsert = database.prepare(`
    INSERT INTO library_items (url, content) VALUES (?, ?)
    ON CONFLICT (url) DO UPDATE SET content = excluded.content, translation_needed = NULL
  `);
  const insert = database.prepare('INSERT INTO library_items (url, content) VALUES (?, ?) ON CONFLICT (url) DO NOTHING');
  const setSaved = database.prepare('UPDATE library_items SET saved = ? WHERE url = ?');

  function write(resources: LibraryResource[], statement: typeof insert) {
    database.exec('BEGIN IMMEDIATE');
    try {
      let changed = 0;
      for (const { url, ...resource } of resources) changed += Number(statement.run(url, JSON.stringify(resource)).changes);
      database.exec('COMMIT');
      return changed;
    } catch (error) {
      database.exec('ROLLBACK');
      throw error;
    }
  }

  return {
    list() {
      return list.all().map(({ url, content, saved }) => ({
        ...JSON.parse(String(content)) as LibraryResource,
        url: String(url),
        saved: saved === 1,
      }));
    },
    saveAll: (resources) => { write(resources, upsert); },
    saveCollected: (resources) => write(resources, insert),
    setSaved(url, saved) {
      return setSaved.run(Number(saved), url).changes === 1;
    },
  };
}

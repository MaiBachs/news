import type { DatabaseSync } from 'node:sqlite';
import type { FeedSource, Market, SourcePurpose } from '../../../../../shared/sources.js';
import type { SourceRepository } from '../application/source-repository.js';

export function sqliteSourceRepository(database: DatabaseSync): SourceRepository {
  const list = database.prepare(`
    SELECT id, name, feed_url, market, purpose, enabled, library_kind
    FROM feed_sources ORDER BY name COLLATE NOCASE, id
  `);
  const insert = database.prepare(`
    INSERT INTO feed_sources (id, name, feed_url, market, purpose, enabled, library_kind)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT (feed_url, purpose) DO NOTHING
  `);
  const setEnabled = database.prepare('UPDATE feed_sources SET enabled = ? WHERE id = ?');

  return {
    list() {
      return list.all().map((row) => ({
        id: row.id as string,
        name: row.name as string,
        feedUrl: row.feed_url as string,
        market: row.market as Market,
        purpose: row.purpose as SourcePurpose,
        enabled: row.enabled === 1,
        ...(row.library_kind === 'COMMUNITY' ? { libraryKind: 'COMMUNITY' as const } : {}),
      }));
    },
    insert(source: FeedSource) {
      return insert.run(source.id, source.name, source.feedUrl, source.market, source.purpose, Number(source.enabled), source.libraryKind ?? null)
        .changes === 1;
    },
    setEnabled(id: string, enabled: boolean) {
      return setEnabled.run(Number(enabled), id).changes === 1;
    },
  };
}

import type { DatabaseSync } from 'node:sqlite';
import type { AiotCatalog } from '../../../../../shared/aiot.js';
import type { AiotCatalogRepository } from '../application/aiot-catalog-service.js';

export function sqliteAiotCatalog(database: DatabaseSync): AiotCatalogRepository {
  const latest = database.prepare('SELECT content FROM aiot_catalogs ORDER BY date DESC LIMIT 1');
  const save = database.prepare(`INSERT INTO aiot_catalogs (date, content) VALUES (?, ?)
    ON CONFLICT (date) DO UPDATE SET content = excluded.content`);
  return {
    latest() {
      const content = latest.get()?.content;
      return typeof content === 'string' ? JSON.parse(content) as AiotCatalog : null;
    },
    save(catalog) {
      save.run(catalog.date, JSON.stringify(catalog));
    },
  };
}

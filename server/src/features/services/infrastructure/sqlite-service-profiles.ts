import type { DatabaseSync } from 'node:sqlite';
import type { ServiceProfile } from '../../../../../shared/services.js';
import type { ServiceProfileRepository } from '../application/service-profiles.js';

export function sqliteServiceProfiles(database: DatabaseSync): ServiceProfileRepository {
  const latest = database.prepare(`SELECT profile.content FROM service_profiles AS profile
    JOIN (SELECT id, max(date) AS date FROM service_profiles GROUP BY id) AS newest
    ON profile.id = newest.id AND profile.date = newest.date ORDER BY profile.id`);
  const history = database.prepare('SELECT content FROM service_profiles WHERE id = ? ORDER BY date DESC');
  const save = database.prepare(`INSERT INTO service_profiles (id, date, content) VALUES (?, ?, ?)
    ON CONFLICT (id, date) DO UPDATE SET content = excluded.content`);
  const parse = ({ content }: Record<string, unknown>) => JSON.parse(String(content)) as ServiceProfile;

  return {
    latest: () => latest.all().map(parse),
    history: (id) => history.all(id).map(parse),
    save(profiles) {
      database.exec('BEGIN IMMEDIATE');
      try {
        for (const profile of profiles) save.run(profile.id, profile.date, JSON.stringify(profile));
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

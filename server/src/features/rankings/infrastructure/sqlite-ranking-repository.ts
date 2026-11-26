import type { DatabaseSync } from 'node:sqlite';
import type { RankingAssessment } from '../../../../../shared/rankings.js';
import type { RankingRepository } from '../application/ranking-service.js';

export function sqliteRankingRepository(database: DatabaseSync): RankingRepository {
  const latest = database.prepare('SELECT content FROM ranking_assessments ORDER BY date DESC LIMIT 1');
  const save = database.prepare(`
    INSERT INTO ranking_assessments (date, content) VALUES (?, ?)
    ON CONFLICT (date) DO UPDATE SET content = excluded.content
  `);

  return {
    latest() {
      const content = latest.get()?.content;
      return typeof content === 'string' ? JSON.parse(content) as RankingAssessment : null;
    },
    save(assessment) {
      save.run(assessment.date, JSON.stringify(assessment));
    },
  };
}

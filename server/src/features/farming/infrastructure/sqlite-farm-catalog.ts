import type { DatabaseSync } from 'node:sqlite';
import type { FarmAreaId, FarmEvidence, FarmModel, FarmPlan } from '../../../../../shared/farming.js';
import type { FarmCatalogRepository } from '../application/farm-catalog.js';

export function sqliteFarmCatalog(database: DatabaseSync): FarmCatalogRepository {
  const models = records<FarmModel>('farm_models');
  const evidence = records<FarmEvidence>('farm_evidence');
  const plan = database.prepare('SELECT content FROM farm_plan WHERE id = 1');
  const savePlan = database.prepare('UPDATE farm_plan SET content = ? WHERE id = 1');

  function records<T extends { id: string; area: FarmAreaId }>(table: 'farm_models' | 'farm_evidence') {
    const select = database.prepare(`SELECT id, area, content FROM ${table} ORDER BY position, id`);
    const next = database.prepare(`SELECT coalesce(max(position) + 1, 0) AS position FROM ${table}`);
    const save = database.prepare(`INSERT INTO ${table} (id, area, position, content) VALUES (?, ?, ?, ?)
      ON CONFLICT (id) DO UPDATE SET area = excluded.area, content = excluded.content`);
    return {
      read: () => select.all().map(({ id, area, content }) => ({ ...JSON.parse(String(content)), id, area }) as T),
      save(items: T[]) {
        let position = Number(next.get()?.position);
        for (const { id, area, ...content } of items) save.run(id, area, position++, JSON.stringify(content));
      },
    };
  }

  return {
    catalog: () => ({ models: models.read(), evidence: evidence.read(), plan: JSON.parse(String(plan.get()?.content)) as FarmPlan }),
    save(update) {
      database.exec('BEGIN IMMEDIATE');
      try {
        if (update.models) models.save(update.models);
        if (update.evidence) evidence.save(update.evidence);
        if (update.plan) savePlan.run(JSON.stringify(update.plan));
        database.exec('COMMIT');
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

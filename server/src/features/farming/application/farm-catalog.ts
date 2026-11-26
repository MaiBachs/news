import type { FarmCatalog } from '../../../../../shared/farming.js';
import { readFarmUpdate } from '../domain/farm-update.js';

export interface FarmCatalogRepository {
  catalog(): FarmCatalog;
  save(update: Partial<FarmCatalog>): void;
}

export function createFarmCatalog(repository: FarmCatalogRepository) {
  return {
    catalog: () => repository.catalog(),
    import(input: unknown) {
      const update = readFarmUpdate(input);
      repository.save(update);
      return { models: update.models?.length ?? 0, evidence: update.evidence?.length ?? 0 };
    },
  };
}

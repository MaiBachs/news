import type { AiotCatalog } from '../../../../../shared/aiot.js';
import { parseAiotCatalog } from '../domain/aiot-catalog.js';

export interface AiotCatalogRepository {
  latest(): AiotCatalog | null;
  save(catalog: AiotCatalog): void;
}

export function createAiotCatalogService(repository: AiotCatalogRepository) {
  return {
    latest: () => repository.latest(),
    import(input: unknown) {
      const catalog = parseAiotCatalog(input);
      repository.save(catalog);
      return catalog;
    },
  };
}

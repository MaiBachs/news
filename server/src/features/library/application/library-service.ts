import type { LibraryItem, LibraryResource } from '../../../../../shared/library.js';
import { parseLibraryResources, resolveLibraryTheme } from '../domain/library-resource.js';

export interface LibraryRepository {
  list(): LibraryItem[];
  saveAll(resources: LibraryResource[]): void;
  saveCollected(resources: LibraryResource[]): number;
  setSaved(url: string, saved: boolean): boolean;
}

export function createLibraryService(repository: LibraryRepository) {
  return {
    list: () => repository.list().map((item) => {
      const theme = resolveLibraryTheme(item);
      return theme ? { ...item, theme } : item;
    }),
    setSaved: (url: string, saved: boolean) => repository.setSaved(url, saved),
    saveCollected: (resources: LibraryResource[]) => repository.saveCollected(resources),
    import(input: unknown) {
      const resources = parseLibraryResources(input);
      repository.saveAll(resources);
      return resources.length;
    },
  };
}

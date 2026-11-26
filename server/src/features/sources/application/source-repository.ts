import type { FeedSource } from '../../../../../shared/sources.js';

export interface SourceRepository {
  list(): FeedSource[];
  insert(source: FeedSource): boolean;
  setEnabled(id: string, enabled: boolean): boolean;
}

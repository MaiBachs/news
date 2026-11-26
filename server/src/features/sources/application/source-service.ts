import { randomUUID } from 'node:crypto';
import type { FeedSource } from '../../../../../shared/sources.js';
import { parseNewSource } from '../domain/source.js';
import type { SourceRepository } from './source-repository.js';

export class SourceService {
  constructor(private readonly repository: SourceRepository) {}

  list() {
    return this.repository.list();
  }

  add(input: unknown): FeedSource | null {
    const source = { ...parseNewSource(input), id: randomUUID(), enabled: true };
    return this.repository.insert(source) ? source : null;
  }

  setEnabled(id: string, enabled: boolean) {
    return this.repository.setEnabled(id, enabled);
  }
}

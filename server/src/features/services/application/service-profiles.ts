import type { ServiceLine, ServiceProfile } from '../../../../../shared/services.js';
import { parseServiceProfiles } from '../domain/service-profile.js';

export interface ServiceProfileRepository {
  latest(): ServiceProfile[];
  history(id: ServiceLine): ServiceProfile[];
  save(profiles: ServiceProfile[]): void;
}

export function createServiceProfiles(repository: ServiceProfileRepository) {
  return {
    latest: () => repository.latest(),
    history: (id: ServiceLine) => repository.history(id),
    import(input: unknown) {
      const profiles = parseServiceProfiles(input);
      repository.save(profiles);
      return profiles.length;
    },
  };
}

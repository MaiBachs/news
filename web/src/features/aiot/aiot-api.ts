import type { AiotCatalog } from '../../../../shared/aiot';
import { requestJson } from '../../shared/http';

export function getAiotCatalog(signal: AbortSignal) {
  return requestJson<AiotCatalog | null>('/api/aiot/latest', { signal });
}

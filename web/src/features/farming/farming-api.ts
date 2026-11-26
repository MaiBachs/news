import type { FarmCatalog } from '../../../../shared/farming';
import { requestJson } from '../../shared/http';

export function getFarmCatalog(signal: AbortSignal) {
  return requestJson<FarmCatalog>('/api/farming', { signal });
}

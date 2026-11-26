import type { ServiceProfile } from '../../../../shared/services';
import { requestJson } from '../../shared/http';

export function getServiceProfiles(signal: AbortSignal) {
  return requestJson<ServiceProfile[]>('/api/services/latest', { signal });
}

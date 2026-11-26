import type { AiStatus } from '../../../../shared/ai';
import { requestJson } from '../../shared/http';

export function getAiStatus(signal?: AbortSignal) {
  return requestJson<AiStatus>('/api/ai', { signal });
}

export function checkAiConnection() {
  return requestJson<void>('/api/ai/check', { method: 'POST' });
}

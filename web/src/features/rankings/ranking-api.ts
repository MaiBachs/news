import type { RankingReport } from '../../../../shared/rankings';
import { requestJson } from '../../shared/http';

export function getLatestRanking(signal: AbortSignal) {
  return requestJson<RankingReport | null>('/api/rankings/latest', { signal });
}

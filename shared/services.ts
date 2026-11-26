import type { RankingCompetitor, RankingDecision, RankingSignal, RankingSource } from './rankings.js';
import type { Market } from './sources.js';

export const serviceLines = ['CONTENT', 'DESIGN', 'VIDEO', 'TRANSLATION', 'CUSTOMER_CARE', 'BOOKKEEPING', 'CODING', 'MARKET_RESEARCH'] as const;
export type ServiceLine = (typeof serviceLines)[number];

export const serviceLineLabels: Record<ServiceLine, string> = {
  CONTENT: 'Viết nội dung', DESIGN: 'Thiết kế', VIDEO: 'Dựng video', TRANSLATION: 'Dịch',
  CUSTOMER_CARE: 'Chăm sóc khách', BOOKKEEPING: 'Kế toán cơ bản', CODING: 'Viết code', MARKET_RESEARCH: 'Nghiên cứu thị trường',
};

export interface ServicePrice {
  item: string;
  low: number;
  high: number;
  currency: 'VND' | 'USD';
  unit: string;
  market: Market;
  observedOn: string;
  sourceId: string;
}

export interface ServiceProfile {
  id: ServiceLine;
  date: string;
  decision: RankingDecision;
  demand: RankingSignal;
  prices: ServicePrice[];
  aiShift: { automated: string; stillHuman: string; replacementRisk: 'LOW' | 'MEDIUM' | 'HIGH' };
  tools: { name: string; use: string; cost: string; sourceId: string }[];
  learning: { weeks: number; prerequisites: string; path: string };
  offer: { name: string; deliverable: string; price: string; turnaround: string };
  competitors: RankingCompetitor[];
  legal?: RankingSignal;
  test: string;
  sources: RankingSource[];
  signals30d?: number;
}

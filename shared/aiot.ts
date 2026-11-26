import type { RankingCompetitor, RankingDecision, RankingSource } from './rankings.js';
import type { Market } from './sources.js';

export const chatbotChannels = ['ON_DEVICE_VOICE', 'ZALO_OA', 'MESSENGER', 'WEB', 'TELEGRAM'] as const;
export const aiotPartKinds = ['BOARD', 'SENSOR', 'AUDIO', 'MODEL', 'CHATBOT_PLATFORM', 'CLOUD'] as const;

export interface AiotPart {
  id: string;
  name: string;
  kind: (typeof aiotPartKinds)[number];
  capability: string;
  price?: { value: number; currency: 'VND' | 'USD'; observedOn: string };
  signal?: 'ENABLER';
  sourceId: string;
}

export interface AiotSolution {
  id: string;
  title: string;
  problem: string;
  customer: string;
  market: Market;
  partIds: string[];
  bomCost: string;
  chatbot: { channels: (typeof chatbotChannels)[number][]; role: string; model: string };
  pricing: { setup: string; monthly?: string };
  competitors: RankingCompetitor[];
  decision: RankingDecision;
  pilot: string;
  risks: string;
  sources: RankingSource[];
}

export interface AiotCatalog {
  date: string;
  parts: AiotPart[];
  solutions: AiotSolution[];
  sources: RankingSource[];
}

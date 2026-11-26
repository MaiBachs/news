import type { AiProfile, AiStatus } from '../../../../../shared/ai.js';

export type ProviderCheck = 'ok' | 'unauthorized' | 'rate-limited' | 'failed';
type ConnectionCheck = ProviderCheck | 'unavailable' | 'cooldown';

export interface ModelConnection {
  check(model: string): Promise<ProviderCheck>;
}

export function createConnectionService(profile: AiProfile, openAi?: ModelConnection) {
  const isOpenAi = profile.provider === 'openai';
  let connection: AiStatus['connection'] = 'unavailable';
  if (isOpenAi) connection = openAi ? 'ready' : 'missing-key';
  let checking = false;
  let nextCheck = 0;

  return {
    status(): AiStatus {
      return { ...profile, connection };
    },
    async check(): Promise<ConnectionCheck> {
      if (!isOpenAi || !openAi) return 'unavailable';
      const now = Date.now();
      if (checking || now < nextCheck) return 'cooldown';
      nextCheck = now + 30_000;
      checking = true;
      try {
        return await openAi.check(profile.crawlModel);
      } finally {
        checking = false;
      }
    },
  };
}

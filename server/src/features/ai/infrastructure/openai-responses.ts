import type { ModelConnection, ProviderCheck } from '../application/connection-service.js';

export function openAiResponses(apiKey: string, request: typeof fetch = fetch): ModelConnection {
  return {
    async check(model): Promise<ProviderCheck> {
      try {
        const response = await request('https://api.openai.com/v1/responses', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            input: 'Reply with exactly one word: OK.',
            max_output_tokens: 128,
            store: false,
          }),
          redirect: 'error',
          signal: AbortSignal.timeout(15_000),
        });

        if (!response.ok) {
          await response.body?.cancel();
          if (response.status === 401 || response.status === 403) return 'unauthorized';
          return response.status === 429 ? 'rate-limited' : 'failed';
        }

        const result: unknown = await response.json();
        if (typeof result === 'object' && result !== null && 'status' in result && result.status === 'completed') {
          return 'ok';
        }
        return 'failed';
      } catch {
        return 'failed';
      }
    },
  };
}

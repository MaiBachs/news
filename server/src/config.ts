import { resolve } from 'node:path';
import type { AiProfile } from '../../shared/ai.js';

const aiProfiles = {
  codex: { provider: 'openai', crawlModel: 'gpt-6-luna', analysisModel: 'gpt-6-sol' },
  claude: { provider: 'anthropic', crawlModel: 'claude-sonnet-5-5', analysisModel: 'claude-opus-5-5' },
} as const;

export function readConfig(env: NodeJS.ProcessEnv) {
  const port = Number(env.RADAR_PORT ?? '8080');
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('RADAR_PORT must be a port from 1 to 65535.');
  }

  const newsChrome = env.RADAR_NEWS_CHROME?.trim();
  return {
    port,
    host: env.HOST || '127.0.0.1',
    dbPath: resolve(env.RADAR_DB_PATH || 'data/radar.sqlite'),
    migrationsDirectory: resolve('server/migrations'),
    webDirectory: resolve('dist/web'),
    ai: readAiConfig(env),
    openAiApiKey: env.OPENAI_API_KEY?.trim() || undefined,
    youtubeApiKey: env.YOUTUBE_API_KEY?.trim() || undefined,
    newsTranslation: newsChrome ? {
      executablePath: resolve(newsChrome),
      profileDirectory: resolve(env.RADAR_NEWS_CHROME_PROFILE?.trim() || 'data/news-translation-profile'),
    } : undefined,
  };
}

function readAiConfig(env: NodeJS.ProcessEnv): AiProfile {
  const profile = env.RADAR_AI_PROFILE?.trim() || 'claude';
  if (profile !== 'codex' && profile !== 'claude') {
    throw new Error('RADAR_AI_PROFILE must be codex or claude.');
  }

  const defaults = aiProfiles[profile];
  const prefix = `RADAR_${profile.toUpperCase()}`;
  return {
    profile,
    provider: defaults.provider,
    crawlModel: env[`${prefix}_CRAWL_MODEL`]?.trim() || defaults.crawlModel,
    analysisModel: env[`${prefix}_ANALYSIS_MODEL`]?.trim() || defaults.analysisModel,
  };
}

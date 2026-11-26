export interface AiProfile {
  profile: 'codex' | 'claude';
  provider: 'openai' | 'anthropic';
  crawlModel: string;
  analysisModel: string;
}

export interface AiStatus extends AiProfile {
  connection: 'ready' | 'missing-key' | 'unavailable';
}

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readConfig } from '../dist/server/src/config.js';

test('Claude is the default AI profile', () => {
  assert.deepEqual(readConfig({}).ai, {
    profile: 'claude',
    provider: 'anthropic',
    crawlModel: 'claude-sonnet-5-5',
    analysisModel: 'claude-opus-5-5',
  });
});

test('Codex uses Luna for crawl processing and Sol for analysis', () => {
  assert.deepEqual(readConfig({ RADAR_AI_PROFILE: 'codex' }).ai, {
    profile: 'codex',
    provider: 'openai',
    crawlModel: 'gpt-6-luna',
    analysisModel: 'gpt-6-sol',
  });
});

test('only nonblank model overrides for the active profile apply', () => {
  const config = readConfig({
    RADAR_AI_PROFILE: ' codex ',
    RADAR_CODEX_CRAWL_MODEL: '  custom-luna  ',
    RADAR_CODEX_ANALYSIS_MODEL: ' ',
    RADAR_CLAUDE_ANALYSIS_MODEL: 'custom-opus',
  });
  assert.equal(config.ai.crawlModel, 'custom-luna');
  assert.equal(config.ai.analysisModel, 'gpt-6-sol');
});

test('unknown AI profiles fail configuration validation', () => {
  assert.throws(() => readConfig({ RADAR_AI_PROFILE: 'unknown' }), /RADAR_AI_PROFILE/);
});

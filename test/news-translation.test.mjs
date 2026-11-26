import assert from 'node:assert/strict';
import { test } from 'node:test';
import { localizeStories } from '../dist/server/src/features/bulletins/application/localize-stories.js';
import { translationLanguage } from '../dist/server/src/features/bulletins/domain/story-language.js';
import { protectTechnicalTerms, restoreTechnicalTerms } from '../dist/server/src/features/bulletins/domain/translation-glossary.js';
import { sqliteBulletinRepository } from '../dist/server/src/features/bulletins/infrastructure/sqlite-bulletin-repository.js';
import { sqliteStoryLocalization } from '../dist/server/src/features/bulletins/infrastructure/sqlite-story-localization.js';
import { openDatabase } from '../dist/server/src/infrastructure/sqlite.js';

test('translation detects mixed story languages and preserves terms after marker formatting', () => {
  assert.equal(translationLanguage('Tính năng mới cho AI agent và API'), null);
  assert.equal(translationLanguage('Deploy AI agents with an API'), 'en');
  assert.equal(translationLanguage('部署语音智能体'), 'zh');
  assert.equal(translationLanguage('網頁開發工具'), 'zh-Hant');
  const { protectedText, terms } = protectTechnicalTerms('部署语音智能体 using ESP32 and a KV cache');
  assert.equal(terms.length, 3);
  assert.match(protectedText, /7843200/);
  assert.equal(restoreTechnicalTerms('Dùng 784.3200 với 7843201 và 7843202', terms), 'Dùng voice agent với ESP32 và KV cache');
  assert.equal(restoreTechnicalTerms('Thiếu thuật ngữ', terms), undefined);
  assert.deepEqual(protectTechnicalTerms('零跑汽车 phát triển API').terms.map(({ text }) => text), ['Leapmotor', 'API']);
});

test('localization keeps original feed evidence and skips already translated stories on retry', async (context) => {
  const database = openDatabase(':memory:', 'server/migrations');
  context.after(() => database.close());
  const bulletins = sqliteBulletinRepository(database);
  const localizations = sqliteStoryLocalization(database);
  const foreign = {
    url: 'https://example.com/foreign', title: 'Deploy a voice agent', summary: 'Các bước triển khai.',
    market: 'GLOBAL', source: 'Example', publishedOn: '2026-11-21', fromFeed: true,
  };
  const vietnamese = { ...foreign, url: 'https://example.com/vi', title: 'Cập nhật thị trường Việt Nam' };
  bulletins.saveCollected([foreign, vietnamese]);
  assert.deepEqual(localizations.untranslated().map(({ url }) => url), [foreign.url]);
  const translate = async function* (inputs) {
    assert.equal(inputs.length, 1);
    assert.equal(inputs[0].titleLanguage, 'en');
    assert.equal(inputs[0].summaryLanguage, null);
    yield [{ index: 0, title: 'Triển khai voice agent', summary: foreign.summary }];
  };
  assert.deepEqual(await localizeStories(localizations, translate, 10, () => {}), { candidates: 1, saved: 1 });
  assert.deepEqual(await localizeStories(localizations, translate, 10, () => {}), { candidates: 0, saved: 0 });
  const rows = new Map(bulletins.archivedStories(null).map((row) => [row.url, row]));
  assert.deepEqual(rows.get(foreign.url), { ...foreign, translation: { title: 'Triển khai voice agent', summary: foreign.summary } });
  assert.deepEqual(rows.get(vietnamese.url), vietnamese);
});

import type { Page } from 'playwright-core';
import type { TranslateStories, TranslationInput } from '../application/localize-stories.js';
import type { NewsLanguage } from '../domain/story-language.js';
import { cleanTranslatedText, protectTechnicalTerms, restoreTechnicalTerms } from '../domain/translation-glossary.js';

const batchSize = 24;
const workerUrl = 'http://127.0.0.1:4/radar-news-translation';

interface LocalTranslator {
  translate(input: string): Promise<string>;
}

interface TranslationWindow {
  document: { querySelector(selector: string): { onclick: () => void } | null };
  Translator?: { create(options: { sourceLanguage: NewsLanguage; targetLanguage: 'vi' }): Promise<LocalTranslator> };
  radarTranslators?: Partial<Record<NewsLanguage, LocalTranslator>>;
  radarTranslationStatuses?: Partial<Record<NewsLanguage, string>>;
}

export function chromeNewsTranslator(options: { executablePath: string; profileDirectory: string }): TranslateStories {
  return async function* (inputs) {
    const { chromium } = await import('playwright-core');
    const browser = await chromium.launchPersistentContext(options.profileDirectory, {
      executablePath: options.executablePath,
      ignoreDefaultArgs: ['--disable-component-update', '--disable-background-networking'],
      headless: true,
    });
    try {
      const page = browser.pages()[0] ?? await browser.newPage();
      await page.route(workerUrl, (route) => route.fulfill({ contentType: 'text/html', body: '<button>Khởi tạo bộ dịch</button>' }));
      await page.goto(workerUrl);
      const groups = new Map<string, TranslationInput[]>();
      for (const input of inputs) {
        const key = `${input.titleLanguage ?? ''}/${input.summaryLanguage ?? ''}`;
        const group = groups.get(key);
        if (group) group.push(input);
        else groups.set(key, [input]);
      }
      const initialized = new Map<NewsLanguage, Error | null>();
      for (const [, group] of [...groups.entries()].sort(([left], [right]) => left.localeCompare(right))) {
        const languages = [group[0]?.titleLanguage, group[0]?.summaryLanguage];
        for (const language of languages) {
          if (!language || initialized.has(language)) continue;
          try {
            await initializeLanguage(page, language);
            initialized.set(language, null);
          } catch (error) {
            initialized.set(language, new Error(`Không mở được gói dịch ${language}–vi.`, { cause: error }));
          }
        }
        if (languages.some((language) => language && initialized.get(language))) continue;
        for (let offset = 0; offset < group.length; offset += batchSize) {
          yield await translateBatch(page, group.slice(offset, offset + batchSize));
        }
      }
      const errors = [...initialized.values()].filter((error) => error !== null);
      if (errors.length) throw new AggregateError(errors, 'Một số tin chưa dịch được. Các bản dịch đã lưu sẽ được giữ khi chạy lại.');
    } finally {
      await browser.close();
    }
  };
}

async function initializeLanguage(page: Page, language: NewsLanguage) {
  await page.evaluate((code) => {
    const scope = globalThis as unknown as TranslationWindow;
    const factory = scope.Translator;
    if (!factory) throw new Error('Chrome hiện tại chưa hỗ trợ bộ dịch cục bộ.');
    const button = scope.document.querySelector('button');
    if (!button) throw new Error('Không khởi tạo được bộ dịch.');
    const statuses = scope.radarTranslationStatuses ??= {};
    statuses[code] = '';
    const translators = scope.radarTranslators ??= {};
    button.onclick = () => {
      factory.create({ sourceLanguage: code, targetLanguage: 'vi' }).then((translator) => {
        translators[code] = translator;
        statuses[code] = 'ready';
      }).catch((error: unknown) => {
        statuses[code] = error instanceof Error ? error.message : String(error);
      });
    };
  }, language);
  await page.locator('button').click();
  await page.waitForFunction((code) => (globalThis as unknown as TranslationWindow).radarTranslationStatuses?.[code], language, { timeout: 300_000 });
  const status = await page.evaluate((code) => (globalThis as unknown as TranslationWindow).radarTranslationStatuses?.[code], language);
  if (status !== 'ready') throw new Error(`Không mở được gói dịch ${language}–vi. ${status}`);
}

async function translateBatch(page: Page, inputs: TranslationInput[]) {
  const output = inputs.map(({ index, title, summary }) => ({ index, title, summary }));
  const fields = inputs.flatMap(({ title, summary, titleLanguage, summaryLanguage }, index) => {
    const entries = [];
    if (titleLanguage) entries.push({ index, field: 'title' as const, language: titleLanguage, original: title });
    if (summaryLanguage) entries.push({ index, field: 'summary' as const, language: summaryLanguage, original: summary });
    return entries.map((entry) => ({ ...entry, ...protectTechnicalTerms(entry.original) }));
  });
  const translated = await translateFields(page, fields.map(({ protectedText, language }) => ({ text: protectedText, language })));
  const retry = fields.filter(({ index, field, original, terms }, position) => {
    const row = output[index];
    const text = translated[position];
    if (!row || text === undefined) throw new Error('Bộ dịch trả về thiếu nội dung.');
    const restored = restoreTechnicalTerms(text, terms);
    if (!restored?.trim()) return true;
    row[field] = cleanTranslatedText(restored, original);
    return false;
  });
  if (retry.length) {
    const results = await translateFields(page, retry.map(({ original, language }) => ({ text: original, language })));
    for (const [position, { index, field, original }] of retry.entries()) {
      const row = output[index];
      const text = results[position];
      if (!row || text === undefined) throw new Error('Bộ dịch trả về thiếu nội dung.');
      row[field] = cleanTranslatedText(text, original);
    }
  }
  return output;
}

function translateFields(page: Page, inputs: { text: string; language: NewsLanguage }[]) {
  return page.evaluate(async (fields) => {
    const translators = (globalThis as unknown as TranslationWindow).radarTranslators ?? {};
    return Promise.all(fields.map(({ text, language }) => {
      const translator = translators[language];
      if (!translator) throw new Error('Gói dịch chưa được khởi tạo.');
      return translator.translate(text);
    }));
  }, inputs);
}

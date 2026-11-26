import type { BulletinStory, StoryTranslation } from '../../../../../shared/bulletins.js';
import type { NewsLanguage } from '../domain/story-language.js';
import { translationLanguage } from '../domain/story-language.js';

type SourceText = Pick<BulletinStory, 'url' | 'title' | 'summary'>;

export interface StoryLocalizationRepository {
  untranslated(): SourceText[];
  markLocal(rows: SourceText[]): void;
  save(rows: { original: SourceText; translation: StoryTranslation }[]): number;
}

export interface TranslationInput {
  index: number;
  title: string;
  summary: string;
  titleLanguage: NewsLanguage | null;
  summaryLanguage: NewsLanguage | null;
}

export type TranslateStories = (inputs: TranslationInput[]) => AsyncIterable<unknown>;

export async function localizeStories(repository: StoryLocalizationRepository, translate: TranslateStories, limit: number, onProgress: (saved: number, total: number) => void) {
  const pending = repository.untranslated().map((original) => ({
    original, titleLanguage: translationLanguage(original.title), summaryLanguage: translationLanguage(original.summary),
  }));
  repository.markLocal(pending.filter(({ titleLanguage, summaryLanguage }) => !titleLanguage && !summaryLanguage).map(({ original }) => original));
  const candidates = pending.filter(({ titleLanguage, summaryLanguage }) => titleLanguage || summaryLanguage).slice(0, limit);
  if (!candidates.length) return { candidates: 0, saved: 0 };
  const inputs = candidates.map(({ original, titleLanguage, summaryLanguage }, index) => ({
    index, title: original.title, summary: original.summary, titleLanguage, summaryLanguage,
  }));
  const originals = candidates.map(({ original }) => original);
  const received = new Set<number>();
  let saved = 0;
  for await (const data of translate(inputs)) {
    if (!Array.isArray(data)) throw new Error('Chương trình dịch trả về dữ liệu không hợp lệ.');
    const rows = data.map((value) => parseTranslation(value, originals, received));
    saved += repository.save(rows);
    onProgress(saved, candidates.length);
  }
  if (received.size !== candidates.length) throw new Error('Chương trình dịch dừng trước khi xử lý hết danh sách.');
  return { candidates: candidates.length, saved };
}

function parseTranslation(value: unknown, candidates: SourceText[], received: Set<number>) {
  if (!value || typeof value !== 'object') throw new Error('Kết quả dịch không hợp lệ.');
  const { index, title, summary } = value as Record<string, unknown>;
  if (typeof index !== 'number' || !Number.isInteger(index) || !candidates[index] || received.has(index)) {
    throw new Error('Kết quả dịch có bài trùng hoặc không đúng dữ liệu gốc.');
  }
  const original = candidates[index];
  if (typeof title !== 'string' || !title.trim() || title.length > 600
    || typeof summary !== 'string' || (original.summary && !summary.trim()) || summary.length > 900) {
    throw new Error('Nội dung bản dịch không hợp lệ.');
  }
  received.add(index);
  return { original, translation: { title: title.trim(), summary: summary.trim() } };
}

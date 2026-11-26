import type { DatabaseSync } from 'node:sqlite';

interface SourceText { url: string; title: string; summary: string }
type Translation = Omit<SourceText, 'url'>;

export function sqliteCommunityLocalization(database: DatabaseSync) {
  const pendingCommunity = `json_extract(content, '$.kind') = 'COMMUNITY'
    AND json_extract(content, '$.fromFeed') = 1 AND translation_needed IS NULL`;
  const pending = database.prepare(`SELECT url, json_extract(content, '$.title') AS title,
    json_extract(content, '$.summary') AS summary FROM library_items
    WHERE ${pendingCommunity} ORDER BY json_extract(content, '$.publishedOn') DESC, url`);
  const sameText = `WHERE url = ? AND ${pendingCommunity}
    AND json_extract(content, '$.title') = ? AND json_extract(content, '$.summary') = ?`;
  const save = database.prepare(`UPDATE library_items SET content = json_set(content, '$.translation', json(?)),
    translation_needed = 0 ${sameText}`);
  const mark = database.prepare(`UPDATE library_items SET translation_needed = 0 ${sameText}`);

  return {
    untranslated: () => pending.all().map(({ url, title, summary }) => ({
      url: String(url), title: String(title), summary: typeof summary === 'string' ? summary : '',
    })),
    markLocal(rows: SourceText[]) {
      for (const { url, title, summary } of rows) mark.run(url, title, summary);
    },
    save(rows: { original: SourceText; translation: Translation }[]) {
      return rows.reduce((count, { original, translation }) => count + Number(
        save.run(JSON.stringify(translation), original.url, original.title, original.summary).changes,
      ), 0);
    },
  };
}

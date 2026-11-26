import { decodeHTML } from 'entities';
import { SaxesParser } from 'saxes';
import type { FeedEntry } from '../domain/feed-entry.js';

const supportedRoots = ['rss', 'feed', 'rdf'];
const publicationDate = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit',
});
const textFields = new Set(['title', 'link', 'description', 'summary', 'content', 'encoded', 'published', 'updated', 'pubdate', 'date']);

export function parseFeed(xml: string, feedUrl: URL): FeedEntry[] {
  const parser = new SaxesParser();
  const entries = new Map<string, FeedEntry>();
  let depth = 0;
  let root = '';
  let itemDepth = 0;
  let item: Record<string, string> | undefined;
  let field = '';
  let value = '';
  let alternate = '';

  parser.on('doctype', () => { throw new Error('Feed XML chứa DOCTYPE.'); });
  parser.on('opentag', ({ name, attributes }) => {
    depth++;
    const localName = name.slice(name.lastIndexOf(':') + 1).toLowerCase();
    if (depth === 1) {
      root = localName;
      if (!supportedRoots.includes(root)) throw new Error('Nguồn không trả về RSS hoặc Atom.');
    }
    if ((root === 'rss' && depth === 3 && localName === 'item')
      || (root === 'rdf' && depth === 2 && localName === 'item')
      || (root === 'feed' && depth === 2 && localName === 'entry')) {
      item = Object.create(null) as Record<string, string>;
      itemDepth = depth;
      alternate = '';
    }
    if (!item || depth !== itemDepth + 1 || !textFields.has(localName)) return;
    field = localName;
    value = '';
    if (root === 'feed' && field === 'link' && !alternate && (!attributes.rel || attributes.rel === 'alternate')) {
      alternate = attributes.href ?? '';
    }
  });
  function capture(text: string) {
    if (field && value.length < 16_384) value += text.slice(0, 16_384 - value.length);
  }
  parser.on('text', capture);
  parser.on('cdata', capture);
  parser.on('closetag', () => {
    if (item && depth === itemDepth + 1 && field) {
      if (!item[field]) item[field] = value;
      field = '';
    }
    if (item && depth === itemDepth) {
      const url = articleUrl(alternate || item.link, feedUrl);
      const title = feedText(item.title, 200);
      if (url && title && !entries.has(url)) {
        const rawDate = item.pubdate || item.published || item.date || item.updated;
        const timestamp = rawDate ? Date.parse(rawDate.trim()) : Number.NaN;
        entries.set(url, {
          url, title, excerpt: feedText(item.description || item.summary || item.content || item.encoded, 180),
          publishedOn: Number.isFinite(timestamp) ? publicationDate.format(timestamp) : null,
        });
      }
      item = undefined;
    }
    depth--;
  });
  parser.write(xml).close();
  return [...entries.values()];
}

function articleUrl(value: string | undefined, baseUrl: URL): string | undefined {
  if (!value?.trim()) return;
  const url = URL.parse(value.trim(), baseUrl.href);
  if (!url || url.protocol !== 'https:' || url.username || url.password || url.port) return;
  url.hash = '';
  const tracking = [...url.searchParams.keys()].filter((key) => /^(utm_|fbclid$|gclid$)/i.test(key));
  for (const key of tracking) url.searchParams.delete(key);
  return url.href.length <= 2048 ? url.href : undefined;
}

function feedText(value: string | undefined, limit: number) {
  if (!value) return '';
  const normalized = decodeHTML(decodeHTML(value))
    .replace(/<(script|style)\b[^<>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<[^<>]*>/g, ' ')
    .replace(/\s+/g, ' ').trim();
  const characters = Array.from(normalized);
  return characters.length > limit ? `${characters.slice(0, limit - 1).join('').trimEnd()}…` : normalized;
}

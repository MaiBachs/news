import { libraryKinds, libraryThemes } from '../../../../../shared/library.js';
import type { LibraryCaseStudy, LibraryResource, LibraryTheme } from '../../../../../shared/library.js';
import { markets } from '../../../../../shared/sources.js';

export function parseLibraryUrl(input: unknown): string | null {
  if (typeof input !== 'string' || input.length > 2048) return null;
  const url = URL.parse(input.trim());
  if (!url || url.protocol !== 'https:' || url.username || url.password) return null;
  return url.href;
}

export function parseLibraryResources(input: unknown): LibraryResource[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error('Expected at least one library resource.');
  const resources = input.map(parseResource);
  if (new Set(resources.map(({ url }) => url)).size !== resources.length) {
    throw new Error('Duplicate library URL in import.');
  }
  return resources;
}

function parseResource(input: unknown): LibraryResource {
  const raw = object(input);
  const url = parseLibraryUrl(raw.url);
  const kind = libraryKinds.find((value) => value === raw.kind);
  const market = markets.find((value) => value === raw.market);
  if (!url || !kind || !market) throw new Error('Invalid library resource URL, kind or market.');
  if (kind === 'COMMUNITY' && market !== 'CHINA') throw new Error('Community resources must use the China market.');
  if (!Array.isArray(raw.topics) || raw.topics.length === 0) throw new Error('Expected library resource topics.');
  const theme = libraryThemes.find((value) => value === raw.theme);
  if (!theme && raw.theme !== undefined) throw new Error('Invalid library theme.');

  return {
    url, kind, market,
    title: text(raw.title, 'title', 200),
    publisher: text(raw.publisher, 'publisher', 120),
    summary: text(raw.summary, 'summary', 500),
    takeaway: text(raw.takeaway, 'takeaway', 500),
    topics: [...new Set(raw.topics.map((topic) => text(topic, 'topic', 60)))],
    ...(theme ? { theme } : {}),
    ...(raw.startHere !== undefined ? { startHere: parseStartingPoint(raw.startHere) } : {}),
    ...(kind === 'CASE_STUDY' ? { caseStudy: parseCaseStudy(raw.caseStudy) } : {}),
  };
}

function parseStartingPoint(input: unknown) {
  const raw = object(input);
  const url = parseLibraryUrl(raw.url);
  if (!url) throw new Error('Invalid starting-point URL.');
  return { url, label: text(raw.label, 'startHere.label', 140) };
}

const themeRules: Array<[LibraryTheme, RegExp]> = [
  ['IOT', /\b(?:aiot|iot|esp32|esp8266|esp-idf|esphome|home assistant|arduino|raspberry pi|microcontroller)\b|物联网|单片机|智能家居/],
  ['MAKING', /\b(?:freecad|prusaslicer|in 3d|3d print(?:ing|ed)?|cnc)\b|3d打印|数控加工/],
  ['FARMING', /\b(?:chan nuoi|khuyen nong|trun que|nha vuon|trong trot|nong nghiep)\b|农业|畜牧/],
  ['BUSINESS', /\b(?:micro-saas|saas|bootstrapp(?:ed|ing)|freemium|solopreneur|go-to-market|san pham doc lap)\b|独立开发|副业|电商/],
  ['AI', /\b(?:llms?|voice agent|voice ai|ai agents?|agentic|language models?|machine learning|computer vision|inference|nlp|chatgpt|trich xuat tai lieu|tu dong hoa doanh nghiep|token fraud|sua anh bang prompt)\b|人工智能|智能体|大模型|ai画像|画像生成ai|aiで/],
  ['TOOLS', /\b(?:alfred|andarium|android|synology|postgresql|aws|medusa v\d+|kubernetes|frontend|backend|devops|open source|nginx|javascript|typescript|python)\b|前端|后端|数据库|开发工具/],
];

const publisherThemes = new Map<string, LibraryTheme>([
  ['SaaStr', 'BUSINESS'], ['n8n Blog', 'AI'], ['Hugging Face Blog', 'AI'],
  ['Prusa Blog', 'MAKING'], ['Make Magazine', 'MAKING'], ['Raspberry Pi Tutorials', 'IOT'], ['Random Nerd Tutorials', 'IOT'],
  ['Shopify Engineering', 'TOOLS'], ['Engineering at Meta', 'TOOLS'], ['GitHub Engineering', 'TOOLS'],
  ['NVIDIA Technical Blog', 'TOOLS'], ['Martin Fowler', 'TOOLS'], ['Viblo Biên tập viên chọn', 'TOOLS'],
  ['Zhang Xinxu Web Frontend', 'TOOLS'], ['Zapier Blog', 'TOOLS'],
]);

export function resolveLibraryTheme(resource: LibraryResource): LibraryTheme | undefined {
  if (resource.theme) return resource.theme;
  if (resource.fromFeed && resource.publisher === 'Tally Blog') return 'BUSINESS';
  const heading = [resource.title, ...resource.topics].join(' ');
  const signals = heading.toLowerCase()
    .normalize('NFD').replace(/\p{M}/gu, '').replaceAll('đ', 'd');
  return themeRules.find(([, pattern]) => pattern.test(signals))?.[0]
    ?? (/\bAI\b/.test(resource.title) ? 'AI' : publisherThemes.get(resource.publisher));
}

function parseCaseStudy(input: unknown): LibraryCaseStudy {
  const raw = object(input);
  return {
    product: text(raw.product, 'caseStudy.product', 350),
    customer: text(raw.customer, 'caseStudy.customer', 350),
    pricing: text(raw.pricing, 'caseStudy.pricing', 350),
    acquisition: optionalText(raw.acquisition, 'caseStudy.acquisition', 350),
    reportedRevenue: optionalText(raw.reportedRevenue, 'caseStudy.reportedRevenue', 180),
  };
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Expected a library data object.');
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, max: number): string {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized.length > max) throw new Error(`Invalid library field: ${field}.`);
  return normalized;
}

function optionalText(value: unknown, field: string, max: number) {
  return value === undefined ? undefined : text(value, field, max);
}

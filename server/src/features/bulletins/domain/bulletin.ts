import type { Bulletin, BulletinStory, StoryDigest, StoryDigestSection } from '../../../../../shared/bulletins.js';
import { newsTopics } from '../../../../../shared/bulletins.js';
import { markets } from '../../../../../shared/sources.js';

export function parseBulletin(input: unknown): Bulletin {
  const data = record(input);
  const opportunity = record(data.opportunity);
  if (!Array.isArray(data.stories) || data.stories.length === 0) {
    throw new Error('A bulletin must include at least one story.');
  }

  const stories = data.stories.map(parseStory);
  if (new Set(stories.map(({ url }) => url)).size !== stories.length) {
    throw new Error('Story URLs must be unique within the bulletin.');
  }

  return {
    date: date(data.date),
    headline: text(data.headline, 'headline', 200),
    summary: text(data.summary, 'summary', 1200),
    opportunity: {
      title: text(opportunity.title, 'opportunity.title', 200),
      evidence: text(opportunity.evidence, 'opportunity.evidence', 1200),
      experiment: text(opportunity.experiment, 'opportunity.experiment', 1200),
    },
    stories,
  };
}

function parseStory(input: unknown): BulletinStory {
  const story = record(input);
  const market = markets.find((value) => value === story.market);
  if (!market) throw new Error('Unknown story market.');
  const topic = newsTopics.find((value) => value === story.topic);
  if (!topic && story.topic !== undefined) throw new Error('Unknown story topic.');
  return {
    title: text(story.title, 'story.title', 250),
    summary: text(story.summary, 'story.summary', 500),
    market,
    source: text(story.source, 'story.source', 150),
    url: storyUrl(story.url),
    publishedOn: story.publishedOn == null ? null : date(story.publishedOn),
    ...(topic ? { topic } : {}),
  };
}

export type StoryDigestRecord = Omit<StoryDigest, 'hasDetails'> & { url: string; sections?: StoryDigestSection[] };

export function parseStoryDigests(input: unknown): StoryDigestRecord[] {
  if (!Array.isArray(input) || !input.length) throw new Error('Expected at least one story digest.');
  const digests = input.map<StoryDigestRecord>((entry) => {
    const { url, basis, keyPoints, sections } = record(entry);
    if (basis !== 'ARTICLE' && basis !== 'SOURCE_PREVIEW') throw new Error('Invalid story digest basis.');
    if (!Array.isArray(keyPoints) || !keyPoints.length || keyPoints.length > 4) {
      throw new Error('A story digest must have one to four key points.');
    }
    const points = keyPoints.map((point) => text(point, 'key point', 300));
    if (new Set(points).size !== points.length) throw new Error('Duplicate story digest key point.');
    return { url: storyUrl(url), basis, keyPoints: points, sections: parseDigestSections(sections, basis) };
  });
  if (new Set(digests.map(({ url }) => url)).size !== digests.length) throw new Error('Duplicate story digest URL.');
  return digests;
}

function parseDigestSections(input: unknown, basis: StoryDigest['basis']): StoryDigestSection[] | undefined {
  if (input === undefined) return undefined;
  if (basis !== 'ARTICLE' || !Array.isArray(input) || input.length < 2 || input.length > 10) {
    throw new Error('A detailed digest must have two to ten sections based on the original article.');
  }
  const sections = input.map((section) => {
    const { heading, paragraphs } = record(section);
    if (!Array.isArray(paragraphs) || !paragraphs.length || paragraphs.length > 6) {
      throw new Error('A digest section must have one to six paragraphs.');
    }
    const content = paragraphs.map((paragraph) => text(paragraph, 'paragraph', 2400));
    if (new Set(content).size !== content.length) throw new Error('Duplicate digest paragraph.');
    return { heading: text(heading, 'section heading', 140), paragraphs: content };
  });
  if (new Set(sections.map(({ heading }) => heading)).size !== sections.length) throw new Error('Duplicate digest section heading.');
  return sections;
}

export function storyUrl(value: unknown) {
  const url = URL.parse(text(value, 'story.url', 2048));
  if (!url || url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('A story must link to a public HTTPS source.');
  }
  return url.href;
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected a bulletin data object.');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown, field: string, maxLength: number) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized || normalized.length > maxLength) throw new Error(`Invalid bulletin field: ${field}.`);
  return normalized;
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function date(value: unknown) {
  if (!isCalendarDate(value)) {
    throw new Error('Invalid bulletin calendar date.');
  }
  return value;
}

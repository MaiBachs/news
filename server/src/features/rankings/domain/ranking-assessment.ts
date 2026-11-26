import { competitorOverlaps, competitorTypes, rankingCriteria, rankingDecisions } from '../../../../../shared/rankings.js';
import type { Ranked, RankingAssessment, RankingCompetitor, RankingEntry, RankingMarketAnalysis, RankingMethod, RankingSignal, ScreeningRatings } from '../../../../../shared/rankings.js';

export function rankEntries<T extends RankingEntry>(entries: T[], method: RankingMethod): Ranked<T>[] {
  const scored = entries.map((entry) => ({
    ...entry,
    score: rankingCriteria[method].reduce((total, { key, weight }) => total + (entry.ratings[key] ?? 0) * (weight / 5), 0),
  })).sort((left, right) => Number(left.market?.decision === 'EXCLUDE') - Number(right.market?.decision === 'EXCLUDE')
    || right.score - left.score || left.title.localeCompare(right.title, 'vi'));

  let rank = 0;
  return scored.map((entry, index) => {
    if (entry.market?.decision === 'EXCLUDE') return { ...entry, rank: null };
    if (entry.score !== scored[index - 1]?.score) rank = index + 1;
    return { ...entry, rank };
  });
}

export function parseRankingAssessment(input: unknown): RankingAssessment {
  const raw = object(input);
  const method = raw.method === undefined ? 'SCREENING' : raw.method;
  if (method !== 'SCREENING' && method !== 'MARKET') throw new Error('Unknown ranking method.');
  const date = text(raw.date, 'date');
  const parsedDate = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) {
    throw new Error('Expected a valid assessment date in YYYY-MM-DD format.');
  }

  const sources = nonEmptyList(raw.sources, 'sources').map((value) => {
    const source = object(value);
    const url = URL.parse(text(source.url, 'source.url'));
    if (!url || url.protocol !== 'https:' || url.username || url.password) throw new Error('Invalid assessment source URL.');
    return { id: text(source.id, 'source.id'), label: text(source.label, 'source.label'), url: url.href };
  });
  const sourceIds = uniqueIds(sources, 'source');
  const industries = nonEmptyList(raw.industries, 'industries').map((value) => {
    const industry = object(value);
    return {
      ...entry(industry, sourceIds, method),
      nearTerm: text(industry.nearTerm, 'nearTerm'),
      mediumTerm: text(industry.mediumTerm, 'mediumTerm'),
      watch: text(industry.watch, 'watch'),
    };
  });
  const industryIds = uniqueIds(industries, 'industry');
  const niches = nonEmptyList(raw.niches, 'niches').map((value) => {
    const niche = object(value);
    const industryId = text(niche.industryId, 'industryId');
    if (!industryIds.has(industryId)) throw new Error('Niche refers to an unknown industry.');
    const assessed = entry(niche, sourceIds, method);
    const crossFieldLearning = niche.crossFieldLearning === undefined ? undefined : text(niche.crossFieldLearning, 'crossFieldLearning');
    if (crossFieldLearning && !assessed.market?.operation) throw new Error('Cross-field niches need a market assessment and operating conditions.');
    return {
      ...assessed, industryId,
      revenueModel: text(niche.revenueModel, 'revenueModel'),
      test: text(niche.test, 'test'),
      ...(crossFieldLearning ? { crossFieldLearning } : {}),
    };
  });
  uniqueIds(niches, 'niche');

  return { date, method, overview: text(raw.overview, 'overview'), limits: text(raw.limits, 'limits'), sources, industries, niches };
}

function entry(raw: Record<string, unknown>, knownSources: Set<string>, method: RankingMethod): RankingEntry {
  const sourceIds = readSourceIds(raw.sourceIds, knownSources);
  const rawRatings = object(raw.ratings);
  const ratings = Object.fromEntries(rankingCriteria[method].map(({ key }) => {
    const value = rawRatings[key];
    if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 5) {
      throw new Error(`Assessment rating ${key} must be an integer from 0 to 5.`);
    }
    return [key, value];
  })) as ScreeningRatings;
  return {
    id: text(raw.id, 'id'), title: text(raw.title, 'title'), rationale: text(raw.rationale, 'rationale'),
    competition: text(raw.competition, 'competition'), ratings, sourceIds,
    ...(method === 'MARKET' ? { market: marketAnalysis(raw.market, knownSources) } : {}),
  };
}

function marketAnalysis(value: unknown, knownSources: Set<string>): RankingMarketAnalysis {
  const market = object(value);
  const decision = rankingDecisions.find((choice) => choice === market.decision);
  if (!decision) throw new Error('Unknown market decision.');
  const competitors = nonEmptyList(market.competitors, 'competitors').map((candidate) => marketCompetitor(candidate, knownSources));
  if (new Set(competitors.map(({ name }) => name)).size !== competitors.length) throw new Error('Duplicate competitor name.');
  const hasDirectMajor = competitors.some(({ type, overlap }) => type === 'MAJOR' && overlap === 'DIRECT');
  if (hasDirectMajor !== (decision === 'EXCLUDE')) throw new Error('Exclude entries only when a major competitor serves the same market and workflow.');
  return {
    decision, competitors, demand: signal(market.demand, knownSources), aiPotential: signal(market.aiPotential, knownSources),
    vietnam: signal(market.vietnam, knownSources), opening: text(market.opening, 'market.opening'),
    ...(market.operation === undefined ? {} : { operation: operation(market.operation) }),
    validation: text(market.validation, 'market.validation'),
  };
}

function operation(value: unknown): NonNullable<RankingMarketAnalysis['operation']> {
  const data = object(value);
  if (data.level !== 'INDEPENDENT' && data.level !== 'CONDITIONAL') throw new Error('Unknown operation level.');
  return { level: data.level, details: text(data.details, 'operation.details') };
}

function marketCompetitor(value: unknown, knownSources: Set<string>): RankingCompetitor {
  const competitor = object(value);
  const type = competitorTypes.find((choice) => choice === competitor.type);
  const overlap = competitorOverlaps.find((choice) => choice === competitor.overlap);
  const sourceId = text(competitor.sourceId, 'competitor sourceId');
  if (!type || !overlap || !knownSources.has(sourceId)) throw new Error('Invalid competitor or source.');
  return { name: text(competitor.name, 'competitor name'), type, overlap, sourceId, coverage: text(competitor.coverage, 'competitor coverage') };
}

function signal(value: unknown, knownSources: Set<string>): RankingSignal {
  const data = object(value);
  return { assessment: text(data.assessment, 'market signal'), sourceIds: readSourceIds(data.sourceIds, knownSources) };
}

function readSourceIds(value: unknown, knownSources: Set<string>): string[] {
  const sourceIds = nonEmptyList(value, 'sourceIds').map((id) => text(id, 'sourceId'));
  if (sourceIds.some((id) => !knownSources.has(id)) || new Set(sourceIds).size !== sourceIds.length) {
    throw new Error('Each ranking entry needs unique, known sources.');
  }
  return sourceIds;
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Expected an assessment object.');
  return value as Record<string, unknown>;
}

function nonEmptyList(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error(`Expected at least one item in ${field}.`);
  return value;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Expected assessment text for ${field}.`);
  return value.trim();
}

function uniqueIds(entries: { id: string }[], kind: string) {
  const ids = new Set(entries.map(({ id }) => id));
  if (ids.size !== entries.length) throw new Error(`Duplicate ${kind} identifier.`);
  return ids;
}

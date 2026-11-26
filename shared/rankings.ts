export const screeningCriteria = [
  { key: 'demand', label: 'Nhu cầu', weight: 25 },
  { key: 'monetization', label: 'Khả năng kiếm tiền', weight: 20 },
  { key: 'soloFit', label: 'Khả năng làm tay trái', weight: 20 },
  { key: 'momentum', label: 'Đà tăng trưởng', weight: 10 },
] as const;

export const screeningMaximum = screeningCriteria.reduce((total, criterion) => total + criterion.weight, 0);

export const marketCriteria = [
  screeningCriteria[0], screeningCriteria[1], screeningCriteria[2],
  { ...screeningCriteria[3], label: 'Triển vọng thời AI' },
  { key: 'competitionRoom', label: 'Dư địa cạnh tranh', weight: 15 },
  { key: 'vietnamFit', label: 'Phù hợp ở Việt Nam', weight: 10 },
] as const;

export const rankingCriteria = { SCREENING: screeningCriteria, MARKET: marketCriteria } as const;
export type RankingMethod = keyof typeof rankingCriteria;
type MarketRating = (typeof marketCriteria)[number]['key'];
export type ScreeningRatings = Record<(typeof screeningCriteria)[number]['key'], number> & Partial<Record<MarketRating, number>>;

export const rankingDecisions = ['PILOT', 'VALIDATE', 'EXCLUDE'] as const;
export type RankingDecision = (typeof rankingDecisions)[number];
export const competitorOverlaps = ['DIRECT', 'ADJACENT', 'PLATFORM'] as const;
export type CompetitorOverlap = (typeof competitorOverlaps)[number];
export const competitorTypes = ['MAJOR', 'SPECIALIST', 'ALTERNATIVE'] as const;
export type CompetitorType = (typeof competitorTypes)[number];

export interface RankingSource {
  id: string;
  label: string;
  url: string;
}

export interface RankingSignal {
  assessment: string;
  sourceIds: string[];
}

export interface RankingCompetitor {
  name: string;
  type: CompetitorType;
  overlap: CompetitorOverlap;
  coverage: string;
  sourceId: string;
}

export interface RankingMarketAnalysis {
  decision: RankingDecision;
  demand: RankingSignal;
  competitors: RankingCompetitor[];
  opening: string;
  aiPotential: RankingSignal;
  vietnam: RankingSignal;
  operation?: { level: 'INDEPENDENT' | 'CONDITIONAL'; details: string };
  validation: string;
}

export interface RankingEntry {
  id: string;
  title: string;
  rationale: string;
  competition: string;
  ratings: ScreeningRatings;
  sourceIds: string[];
  market?: RankingMarketAnalysis;
}

export interface IndustryAssessment extends RankingEntry {
  nearTerm: string;
  mediumTerm: string;
  watch: string;
}

export interface NicheAssessment extends RankingEntry {
  industryId: string;
  revenueModel: string;
  test: string;
  crossFieldLearning?: string;
}

export interface RankingAssessment {
  date: string;
  method?: RankingMethod;
  overview: string;
  limits: string;
  sources: RankingSource[];
  industries: IndustryAssessment[];
  niches: NicheAssessment[];
}

export type Ranked<T> = T & { score: number; rank: number | null };

export type RankingReport = Omit<RankingAssessment, 'industries' | 'niches'> & {
  industries: Ranked<IndustryAssessment>[];
  niches: Ranked<NicheAssessment>[];
};

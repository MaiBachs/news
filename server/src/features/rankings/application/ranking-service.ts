import type { RankingAssessment, RankingReport } from '../../../../../shared/rankings.js';
import { parseRankingAssessment, rankEntries } from '../domain/ranking-assessment.js';

export interface RankingRepository {
  latest(): RankingAssessment | null;
  save(assessment: RankingAssessment): void;
}

export function createRankingService(repository: RankingRepository) {
  return {
    latest(): RankingReport | null {
      const assessment = repository.latest();
      if (!assessment) return null;
      const method = assessment.method ?? 'SCREENING';
      return { ...assessment, method, industries: rankEntries(assessment.industries, method), niches: rankEntries(assessment.niches, method) };
    },
    import(input: unknown) {
      const assessment = parseRankingAssessment(input);
      repository.save(assessment);
      return { date: assessment.date, industries: assessment.industries.length, niches: assessment.niches.length };
    },
  };
}

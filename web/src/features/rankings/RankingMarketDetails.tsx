import type { CompetitorOverlap, CompetitorType, RankingDecision, RankingMarketAnalysis, RankingSource } from '../../../../shared/rankings';

export const decisionLabels: Record<RankingDecision, string> = {
  PILOT: 'Ưu tiên thử', VALIDATE: 'Cần xác minh nhu cầu', EXCLUDE: 'Đã loại khỏi ưu tiên',
};

const overlapLabels: Record<CompetitorOverlap, string> = {
  DIRECT: 'Trực tiếp', ADJACENT: 'Cùng một phần quy trình', PLATFORM: 'Công nghệ nền',
};

const competitorLabels: Record<CompetitorType, string> = {
  MAJOR: 'Nhà cung cấp lớn', SPECIALIST: 'Nhà cung cấp chuyên ngành', ALTERNATIVE: 'Cách làm thay thế',
};

type SourceMap = ReadonlyMap<string, RankingSource>;

export function RankingMarketDetails({ market, sources }: { market: RankingMarketAnalysis; sources: SourceMap }) {
  return (
    <div className="ranking-market">
      {market.operation && (
        <section>
          <h3>Khả năng tự vận hành</h3>
          <p><strong>{market.operation.level === 'INDEPENDENT' ? 'Có thể vận hành độc lập.' : 'Độc lập có điều kiện.'}</strong> {market.operation.details}</p>
        </section>
      )}
      <section>
        <h3>Nhu cầu thị trường</h3>
        <p>{market.demand.assessment}</p>
        <SignalSources ids={market.demand.sourceIds} sources={sources} />
      </section>
      <section>
        <h3>Đối thủ cạnh tranh</h3>
        <ul className="ranking-competitors">
          {market.competitors.map((competitor) => {
            const source = sources.get(competitor.sourceId);
            return (
              <li key={competitor.name}>
                <strong>{competitor.name}</strong>
                <p className="story-meta">{competitorLabels[competitor.type]} · {overlapLabels[competitor.overlap]}</p>
                <p>{competitor.coverage}</p>
                {source && <a className="ranking-source-link" href={source.url}>{source.label}</a>}
              </li>
            );
          })}
        </ul>
      </section>
      <section>
        <h3>{market.decision === 'EXCLUDE' ? 'Lý do loại' : 'Dư địa còn lại'}</h3>
        <p>{market.opening}</p>
      </section>
      <section>
        <h3>Tiềm năng trong thời AI</h3>
        <p>{market.aiPotential.assessment}</p>
        <SignalSources ids={market.aiPotential.sourceIds} sources={sources} />
      </section>
      <section>
        <h3>Phù hợp với thị trường Việt Nam</h3>
        <p>{market.vietnam.assessment}</p>
        <SignalSources ids={market.vietnam.sourceIds} sources={sources} />
      </section>
      <section>
        <h3>{market.decision === 'EXCLUDE' ? 'Điều kiện xem xét lại' : 'Điều kiện để làm tiếp'}</h3>
        <p>{market.validation}</p>
      </section>
    </div>
  );
}

function SignalSources({ ids, sources }: { ids: string[]; sources: SourceMap }) {
  return (
    <ul className="ranking-signal-sources" aria-label="Nguồn kiểm chứng">
      {ids.map((id) => {
        const source = sources.get(id);
        return source && <li key={id}><a className="ranking-source-link" href={source.url}>{source.label}</a></li>;
      })}
    </ul>
  );
}

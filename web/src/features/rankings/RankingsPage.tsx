import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { rankingCriteria } from '../../../../shared/rankings';
import type { Ranked, RankingEntry, RankingMethod, RankingReport, RankingSource } from '../../../../shared/rankings';
import { CountChart } from '../../shared/CountChart';
import { errorMessage } from '../../shared/http';
import { getLatestRanking } from './ranking-api';
import { decisionLabels, RankingMarketDetails } from './RankingMarketDetails';

const formatDate = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'long', timeZone: 'UTC' });

export function RankingsPage({ crossFieldOnly = false }: { crossFieldOnly?: boolean }) {
  const [report, setReport] = useState<RankingReport | null>();
  const [view, setView] = useState<'industries' | 'niches'>('niches');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    getLatestRanking(controller.signal).then(setReport).catch((failure) => {
      if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được bảng xếp hạng.'));
    });
    return () => controller.abort();
  }, [attempt]);

  if (error) {
    return (
      <div className="panel empty-state">
        <p role="alert">{error}</p>
        <button type="button" className="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>
      </div>
    );
  }
  if (report === undefined) return <p className="page-description" role="status">Đang tải bảng xếp hạng…</p>;
  if (!report) return <p className="panel empty-state">Chưa có đợt nhận định đã nhập.</p>;

  const niches = crossFieldOnly ? report.niches.filter(({ crossFieldLearning }) => crossFieldLearning) : report.niches;
  if (crossFieldOnly && !niches.length) return <p className="panel empty-state">Chưa có ngách trái ngành đã đánh giá thị trường.</p>;

  const sources = new Map(report.sources.map((source) => [source.id, source]));
  const industries = new Map(report.industries.map(({ id, title }) => [id, title]));
  const method = report.method ?? 'SCREENING';
  const maximum = rankingCriteria[method].reduce((sum, criterion) => sum + criterion.weight, 0);
  const showIndustries = !crossFieldOnly && view === 'industries';
  const scoreTitle = showIndustries ? 'Điểm ưu tiên theo ngành' : 'Điểm ưu tiên theo ngách';
  const cards = showIndustries ? report.industries.map((entry) => ({ entry, content: (
    <dl className="ranking-facts">
      <div><dt>Dự báo 1–3 tháng</dt><dd>{entry.nearTerm}</dd></div>
      <div><dt>Dự báo 6–12 tháng</dt><dd>{entry.mediumTerm}</dd></div>
      <div><dt>Tín hiệu theo dõi</dt><dd>{entry.watch}</dd></div>
    </dl>
  ) })) : niches.map((entry) => ({ entry, content: (
    <dl className="ranking-facts">
      <div><dt>Ngành</dt><dd>{industries.get(entry.industryId)}</dd></div>
      {entry.crossFieldLearning && <div><dt>Kỹ năng cần học</dt><dd>{entry.crossFieldLearning}</dd></div>}
      <div><dt>Cách thu tiền cần thử</dt><dd>{entry.revenueModel}</dd></div>
      <div><dt>Cách kiểm chứng</dt><dd>{entry.test}</dd></div>
    </dl>
  ) }));
  const prioritized = cards.filter(({ entry }) => entry.rank !== null);
  const excluded = cards.filter(({ entry }) => entry.rank === null);
  const renderCard = ({ entry, content }: (typeof cards)[number]) => (
    <RankingCard key={entry.id} entry={entry} sources={sources} method={method} maximum={maximum}
      showPosition={!crossFieldOnly}>{content}</RankingCard>
  );
  const scoreChart = (
    <CountChart
      title={scoreTitle}
      data={prioritized.map(({ entry: { title, score } }) => ({ label: title, count: score }))}
      maximum={maximum}
      unit={`/ ${maximum}`}
      description={method === 'MARKET'
        ? 'Điểm đánh giá từ nguồn công khai. Dư địa cạnh tranh cao hơn khi còn một việc cụ thể khách chưa được phục vụ tốt.'
        : 'Điểm sàng lọc sơ bộ. Cạnh tranh và độ phù hợp ở Việt Nam cần đánh giá thêm.'}
      emptyMessage="Chưa có hướng đủ điều kiện vào bảng ưu tiên."
    />
  );

  return (
    <>
      <p className="page-description">
        Đánh giá thủ công · <time dateTime={report.date}>{formatDate.format(new Date(`${report.date}T00:00:00Z`))}</time>
      </p>
      <section className="panel bulletin-panel" aria-labelledby="ranking-overview">
        <h2 id="ranking-overview">Nhận định tổng hợp</h2>
        <p>{report.overview}</p>
        <p className="secondary">{report.limits}</p>
      </section>

      {!crossFieldOnly && <>
        <div className="ranking-controls" role="group" aria-label="Chọn bảng xếp hạng">
          <button type="button" className="button" aria-pressed={view === 'niches'} onClick={() => setView('niches')}>Ngách</button>
          <button type="button" className="button" aria-pressed={view === 'industries'} onClick={() => setView('industries')}>Ngành</button>
        </div>
        {scoreChart}
      </>}
      {excluded.length > 0 && (
        <p className="secondary"><a href="#ranking-excluded-title">Xem {excluded.length} hướng đã loại khỏi bảng ưu tiên</a></p>
      )}

      <div className="ranking-list">
        {prioritized.map(renderCard)}
      </div>
      {crossFieldOnly && scoreChart}
      {excluded.length > 0 && (
        <section className="ranking-excluded" aria-labelledby="ranking-excluded-title">
          <h2 id="ranking-excluded-title">Đã loại khỏi bảng ưu tiên</h2>
          <p className="secondary">Nhà cung cấp lớn đã bán giải pháp cho cùng tệp khách và cùng quy trình.</p>
          <div className="ranking-list">{excluded.map(renderCard)}</div>
        </section>
      )}
    </>
  );
}

function RankingCard({ entry, sources, method, maximum, showPosition, children }: {
  entry: Ranked<RankingEntry>;
  sources: ReadonlyMap<string, RankingSource>;
  method: RankingMethod;
  maximum: number;
  showPosition: boolean;
  children: ReactNode;
}) {
  const evidence = entry.sourceIds.map((id) => sources.get(id)).filter((source) => source !== undefined);
  return (
    <details className="panel ranking-card" open={showPosition && entry.rank === 1}>
      <summary>
        <span>{showPosition && entry.rank !== null && <span className="ranking-position">#{entry.rank} </span>}{entry.title}</span>
        {entry.rank !== null && <strong className="ranking-score">{entry.score} / {maximum}</strong>}
        {entry.market && <span className="ranking-decision" data-decision={entry.market.decision}>{decisionLabels[entry.market.decision]}</span>}
      </summary>
      <div className="ranking-card-content">
        <p>{entry.rationale}</p>
        <dl className="ranking-ratings">
          {rankingCriteria[method].map(({ key, label, weight }) => (
            <div key={key}>
              <dt>{label}</dt>
              <dd>{(entry.ratings[key] ?? 0) * (weight / 5)} / {weight}</dd>
            </div>
          ))}
        </dl>
        {entry.market ? <RankingMarketDetails market={entry.market} sources={sources} /> : (
          <dl className="ranking-facts"><div><dt>Cạnh tranh</dt><dd>{entry.competition}</dd></div></dl>
        )}
        {children}
        {!entry.market && <div className="ranking-evidence">
          <strong>Nguồn đối chiếu</strong>
          <ul>{evidence.map((source) => <li key={source.id}><a href={source.url}>{source.label}</a></li>)}</ul>
        </div>}
      </div>
    </details>
  );
}

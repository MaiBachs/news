import type { ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router';
import { CountChart } from '../../shared/CountChart';
import { RankingsPage } from './RankingsPage';
import { crossFieldNiches } from './cross-field-niches';

export function SideJobsPage({ futureActivity }: { futureActivity: ReactNode }) {
  const [search] = useSearchParams();
  const showFuture = search.get('muc') === 'tuong-lai';

  return (
    <>
      <nav className="side-job-nav" aria-label="Nhóm công việc phụ">
        <Link className="button" to="." aria-current={showFuture ? undefined : 'page'}>Ngách trái ngành</Link>
        <Link className="button" to="?muc=tuong-lai" aria-current={showFuture ? 'page' : undefined}>Tiềm năng tương lai</Link>
      </nav>
      {showFuture ? (
        <section aria-labelledby="future-work-title">
          <h2 id="future-work-title">Công việc tiềm năng tương lai</h2>
          <p className="page-description">Đánh giá nhu cầu, đối thủ, triển vọng AI và khả năng tự vận hành tại Việt Nam.</p>
          <RankingsPage />
          {futureActivity}
        </section>
      ) : (
        <section aria-labelledby="cross-field-work-title">
          <h2 id="cross-field-work-title">Ngách trái ngành có thể học</h2>
          <RankingsPage crossFieldOnly />
          <details className="panel side-job-card">
            <summary>Mô hình thực hành đã lưu</summary>
            <CrossFieldNiches />
          </details>
        </section>
      )}
    </>
  );
}

function CrossFieldNiches() {
  return (
    <>
      <p className="page-description">Dành cho cá nhân hoặc nhóm nhỏ tự tìm khách và tự vận hành. Mỗi ngách có kỹ năng cần học, một mô hình để thử và điều kiện để làm độc lập.</p>
      <div className="side-job-grid">
        {crossFieldNiches.map((niche) => (
          <article key={niche.id} className="panel side-job-card">
            <h3>{niche.title}</h3>
            <p className="secondary">{niche.customer}</p>
            <p className="story-meta">{niche.setup}</p>
            <details className="side-job-details">
              <summary>Cần học gì và thử ra sao</summary>
              <dl className="ranking-facts">
                <div><dt>Kỹ năng cần học</dt><dd>{niche.learning}</dd></div>
                <div><dt>Mô hình thử đầu tiên</dt><dd>{niche.firstPilot}</dd></div>
                <div><dt>Điều kiện để làm tiếp</dt><dd>{niche.validation}</dd></div>
                <div><dt>Khả năng tự vận hành</dt><dd>{niche.independence}</dd></div>
              </dl>
              <ul className="ranking-signal-sources" aria-label="Tài liệu để học">
                {niche.guides.map(({ label, url }) => <li key={url}><a className="ranking-source-link" href={url}>{label}</a></li>)}
              </ul>
            </details>
          </article>
        ))}
      </div>
      <CountChart
        title="Thời gian học và chuẩn bị mô hình thử"
        data={crossFieldNiches.map(({ title, learningHours }) => ({ label: title, count: learningHours }))}
        unit="giờ"
        description="Mốc dự trù cho phần học và chuẩn bị. Thời gian chạy thử, nuôi và theo dõi phụ thuộc từng mô hình."
      />
    </>
  );
}

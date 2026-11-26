import { Link } from 'react-router';
import type { RankingSignal, RankingSource } from '../../../../shared/rankings';
import { serviceLineLabels } from '../../../../shared/services';
import type { ServiceProfile } from '../../../../shared/services';
import { marketLabels } from '../../shared/market-labels';
import { formatBulletinDate } from '../bulletins/bulletin-date';
import { decisionLabels, priceRange, riskLabels } from './service-display';

const competitorTypes = { MAJOR: 'Nhà cung cấp lớn', SPECIALIST: 'Nhà cung cấp chuyên biệt', ALTERNATIVE: 'Phương án thay thế' } as const;
const overlaps = { DIRECT: 'Trùng trực tiếp', ADJACENT: 'Trùng một phần', PLATFORM: 'Nền tảng' } as const;

export function ServiceProfileDetail({ profile }: { profile: ServiceProfile }) {
  const sources = new Map(profile.sources.map((source) => [source.id, source]));
  return <article className="service-detail" aria-labelledby="service-detail-title">
    <header className="panel bulletin-panel">
      <h2 id="service-detail-title">{serviceLineLabels[profile.id]}</h2>
      <p className="story-meta">{decisionLabels[profile.decision]} · Hồ sơ ngày <time dateTime={profile.date}>{formatBulletinDate(profile.date)}</time></p>
      {profile.id === 'CUSTOMER_CARE' && <Link to="/aiot-chatbot?muc=giai-phap">Xem giải pháp AIoT & Chatbot</Link>}
    </header>
    <section className="panel bulletin-panel">
      <h3>Nhu cầu</h3>
      <Signal signal={profile.demand} sources={sources} />
    </section>
    <section className="panel bulletin-panel">
      <h3>Bảng giá thị trường</h3>
      {profile.prices.length ? <div className="profile-table" role="region" aria-label="Bảng giá thị trường" tabIndex={0}>
        <table>
          <thead><tr><th scope="col">Hạng mục</th><th scope="col">Khoảng giá</th><th scope="col">Thị trường</th><th scope="col">Ghi nhận</th><th scope="col">Nguồn</th></tr></thead>
          <tbody>{profile.prices.map((price, index) => <tr key={`${price.sourceId}-${price.observedOn}-${index}`}>
            <th scope="row">{price.item}</th><td>{priceRange(price)}</td><td>{marketLabels[price.market]}</td>
            <td><time dateTime={price.observedOn}>{formatBulletinDate(price.observedOn)}</time></td>
            <td><SourceLink source={sources.get(price.sourceId)} /></td>
          </tr>)}</tbody>
        </table>
      </div> : <p className="secondary">Chưa ghi nhận giá thị trường.</p>}
    </section>
    <section className="panel bulletin-panel">
      <h3>AI làm được và chưa làm được</h3>
      <dl className="profile-facts">
        <div><dt>Có thể tự động hóa</dt><dd>{profile.aiShift.automated}</dd></div>
        <div><dt>Vẫn cần người làm</dt><dd>{profile.aiShift.stillHuman}</dd></div>
        <div><dt>Mức thay thế bởi AI</dt><dd>{riskLabels[profile.aiShift.replacementRisk]}</dd></div>
      </dl>
    </section>
    <section className="panel bulletin-panel">
      <h3>Công cụ</h3>
      {profile.tools.length ? <ul className="profile-links">{profile.tools.map((tool) => (
        <li key={`${tool.sourceId}-${tool.name}`}><strong>{tool.name}</strong> · {tool.use} · {tool.cost} · <SourceLink source={sources.get(tool.sourceId)} /></li>
      ))}</ul> : <p className="secondary">Chưa ghi nhận công cụ.</p>}
    </section>
    <section className="panel bulletin-panel">
      <h3>Lộ trình học trái ngành</h3>
      <dl className="profile-facts">
        <div><dt>Thời lượng</dt><dd>{profile.learning.weeks} tuần</dd></div>
        <div><dt>Kiến thức cần có</dt><dd>{profile.learning.prerequisites}</dd></div>
        <div><dt>Lộ trình</dt><dd>{profile.learning.path}</dd></div>
      </dl>
    </section>
    <section className="panel bulletin-panel">
      <h3>Gói dịch vụ mẫu</h3>
      <p><strong>{profile.offer.name}</strong></p>
      <dl className="profile-facts">
        <div><dt>Bàn giao</dt><dd>{profile.offer.deliverable}</dd></div>
        <div><dt>Giá đề xuất</dt><dd>{profile.offer.price}</dd></div>
        <div><dt>Thời gian</dt><dd>{profile.offer.turnaround}</dd></div>
      </dl>
    </section>
    <section className="panel bulletin-panel">
      <h3>Đối thủ và rủi ro</h3>
      {profile.competitors.length ? <ul className="profile-links">{profile.competitors.map((competitor) => (
        <li key={`${competitor.sourceId}-${competitor.name}`}><strong>{competitor.name}</strong> · {competitorTypes[competitor.type]} · {overlaps[competitor.overlap]}<br />
          {competitor.coverage} · <SourceLink source={sources.get(competitor.sourceId)} />
        </li>
      ))}</ul> : <p className="secondary">Chưa ghi nhận đối thủ.</p>}
      {profile.legal && <><h3>Pháp lý</h3><Signal signal={profile.legal} sources={sources} /></>}
    </section>
    <section className="panel bulletin-panel">
      <h3>Phép thử</h3><p>{profile.test}</p>
    </section>
  </article>;
}

function Signal({ signal, sources }: { signal: RankingSignal; sources: ReadonlyMap<string, RankingSource> }) {
  return <>
    <p>{signal.assessment}</p>
    <ul className="profile-links" aria-label="Nguồn tham khảo">{signal.sourceIds.map((id) => (
      <li key={id}><SourceLink source={sources.get(id)} /></li>
    ))}</ul>
  </>;
}

function SourceLink({ source }: { source: RankingSource | undefined }) {
  return source ? <a href={source.url}>{source.label}</a> : <span className="secondary">Chưa rõ nguồn</span>;
}

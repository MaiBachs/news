import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { AiotCatalog, AiotPart, AiotSolution } from '../../../../shared/aiot';
import type { FarmModel } from '../../../../shared/farming';
import { errorMessage } from '../../shared/http';
import { marketLabels } from '../../shared/market-labels';
import { formatBulletinDate } from '../bulletins/bulletin-date';
import { getFarmCatalog } from '../farming/farming-api';
import { AiotSignals } from './AiotSignals';
import { getAiotCatalog } from './aiot-api';

const tabs = [
  { id: 'giai-phap', title: 'Giải pháp đóng gói' },
  { id: 'linh-kien', title: 'Linh kiện & nền tảng' },
  { id: 'tin-hieu', title: 'Tín hiệu' },
] as const;
const channels = { ON_DEVICE_VOICE: 'Giọng nói trên thiết bị', ZALO_OA: 'Zalo OA', MESSENGER: 'Messenger', WEB: 'Web', TELEGRAM: 'Telegram' } as const;
const kinds = { BOARD: 'Bo mạch', SENSOR: 'Cảm biến', AUDIO: 'Âm thanh', MODEL: 'Model', CHATBOT_PLATFORM: 'Nền tảng chatbot', CLOUD: 'Đám mây' } as const;
const decisions = { PILOT: 'Nên thử', VALIDATE: 'Cần kiểm chứng', EXCLUDE: 'Loại khỏi ưu tiên' } as const;
const stalePriceAge = 90 * 86_400_000;
const vietnamDate = new Intl.DateTimeFormat('en-CA', { dateStyle: 'short', timeZone: 'Asia/Ho_Chi_Minh' });

export function AiotPage() {
  const [params] = useSearchParams();
  const tab = tabs.find(({ id }) => id === params.get('muc')) ?? tabs[0];
  return <>
    <nav className="profile-tabs" aria-label="Mục AIoT và Chatbot">
      {tabs.map(({ id, title }) => <Link key={id} className="button" to={`?muc=${id}`} aria-current={tab.id === id ? 'page' : undefined}>{title}</Link>)}
    </nav>
    {tab.id === 'tin-hieu' ? <AiotSignals /> : <CatalogTab tab={tab.id} />}
  </>;
}

function CatalogTab({ tab }: { tab: 'giai-phap' | 'linh-kien' }) {
  const [catalog, setCatalog] = useState<AiotCatalog | null>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getAiotCatalog(controller.signal).then(setCatalog).catch((failure) => {
      if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được danh mục AIoT.'));
    });
    return () => controller.abort();
  }, [attempt]);

  if (error) return <div className="panel empty-state">
    <p role="alert">{error}</p>
    <button type="button" className="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>
  </div>;
  if (catalog === undefined) return <p className="page-description" role="status">Đang tải danh mục AIoT…</p>;
  if (!catalog || (tab === 'giai-phap' ? !catalog.solutions.length : !catalog.parts.length)) {
    return <div className="panel empty-state">
      <h2>{tab === 'giai-phap' ? 'Chưa có giải pháp AIoT & Chatbot' : 'Chưa có dữ liệu linh kiện & nền tảng'}</h2>
      <p>Nhập danh mục bằng <code>npm run import:aiot -- &lt;tệp JSON&gt;</code>.</p>
    </div>;
  }
  return <>
    <p className="page-description">Danh mục ngày <time dateTime={catalog.date}>{formatBulletinDate(catalog.date)}</time>.</p>
    {tab === 'giai-phap' ? <SolutionList catalog={catalog} /> : <PartTable catalog={catalog} />}
  </>;
}

function SolutionList({ catalog }: { catalog: AiotCatalog }) {
  const [farmModels, setFarmModels] = useState<FarmModel[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    getFarmCatalog(controller.signal).then(({ models }) => setFarmModels(models)).catch(() => {});
    return () => controller.abort();
  }, []);

  const farms = new Map(farmModels.map((model) => [model.id, model]));
  return <div className="story-grid">
    {catalog.solutions.map((solution) => <SolutionCard key={solution.id} solution={solution} catalog={catalog} farm={farms.get(solution.id)} />)}
  </div>;
}

function SolutionCard({ solution, catalog, farm }: { solution: AiotSolution; catalog: AiotCatalog; farm: FarmModel | undefined }) {
  const sources = new Map([...catalog.sources, ...solution.sources].map((source) => [source.id, source]));
  const parts = catalog.parts.filter(({ id }) => solution.partIds.includes(id));
  const storeChat = solution.chatbot.channels.some((channel) => channel === 'ZALO_OA' || channel === 'MESSENGER');
  return <article className="panel bulletin-panel story-card">
    <p className="story-meta">{marketLabels[solution.market]} · {decisions[solution.decision]}</p>
    <h2>{solution.title}</h2>
    <dl className="profile-facts">
      <div><dt>Bài toán</dt><dd>{solution.problem}</dd></div>
      <div><dt>Khách hàng</dt><dd>{solution.customer}</dd></div>
      <div><dt>Linh kiện và chi phí</dt><dd>{parts.map(({ name }) => name).join(', ')}{parts.length > 0 && ' · '}{solution.bomCost}</dd></div>
      <div><dt>Kênh chatbot</dt><dd>{solution.chatbot.channels.map((channel) => channels[channel]).join(', ')}</dd></div>
      <div><dt>Vai trò và model</dt><dd>{solution.chatbot.role} · {solution.chatbot.model}</dd></div>
      <div><dt>Giá bán</dt><dd>Phí lắp {solution.pricing.setup} · {solution.pricing.monthly ? `Phí tháng ${solution.pricing.monthly}` : 'Chưa ghi nhận phí tháng'}</dd></div>
      <div><dt>Phép thử</dt><dd>{solution.pilot}</dd></div>
      <div><dt>Rủi ro vận hành</dt><dd>{solution.risks}</dd></div>
    </dl>
    <h3>Đối thủ</h3>
    {solution.competitors.length ? <ul className="profile-links">{solution.competitors.map((competitor) => (
      <li key={`${competitor.sourceId}-${competitor.name}`}><a href={sources.get(competitor.sourceId)?.url}>{competitor.name}</a> · {competitor.coverage}</li>
    ))}</ul> : <p className="secondary">Chưa có đối thủ được ghi nhận.</p>}
    <h3>Nguồn</h3>
    <ul className="profile-links">{solution.sources.map(({ id, url, label }) => <li key={id}><a href={url}>{label}</a></li>)}</ul>
    {farm && <p><Link to={`/nong-nghiep?khu=${farm.area}#farm-models-title`}>Xem mô hình nông nghiệp · {farm.title}</Link></p>}
    {storeChat && <p><Link to="/nghe-dich-vu?nghe=CUSTOMER_CARE">Xem nghề chăm sóc khách</Link></p>}
  </article>;
}

function PartTable({ catalog }: { catalog: AiotCatalog }) {
  const sources = new Map(catalog.sources.map((source) => [source.id, source]));
  const today = Date.parse(`${vietnamDate.format(new Date())}T00:00:00Z`);
  return <div className="panel profile-table" role="region" aria-label="Bảng linh kiện và nền tảng" tabIndex={0}>
    <table>
      <thead><tr><th scope="col">Linh kiện</th><th scope="col">Năng lực</th><th scope="col">Giá ghi nhận</th><th scope="col">Nguồn</th></tr></thead>
      <tbody>{catalog.parts.map((part) => <tr key={part.id}>
        <th scope="row">{part.name}<br /><span className="story-meta">{kinds[part.kind]}</span></th>
        <td>{part.capability}{part.signal === 'ENABLER' && <p className="story-meta">ENABLER · Giá hoặc năng lực thay đổi</p>}</td>
        <td>{part.price ? <PartPrice price={part.price} today={today} /> : 'Chưa ghi nhận giá'}</td>
        <td><a href={sources.get(part.sourceId)?.url}>{sources.get(part.sourceId)?.label}</a></td>
      </tr>)}</tbody>
    </table>
  </div>;
}

function PartPrice({ price, today }: { price: NonNullable<AiotPart['price']>; today: number }) {
  const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: price.currency }).format(price.value);
  const stale = today - Date.parse(`${price.observedOn}T00:00:00Z`) > stalePriceAge;
  return <>
    {amount}<br />
    <time dateTime={price.observedOn}>{formatBulletinDate(price.observedOn)}</time>
    {stale && <p className="profile-stale-price">Cần kiểm tra lại giá</p>}
  </>;
}

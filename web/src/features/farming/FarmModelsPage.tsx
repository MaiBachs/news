import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import type { FarmCatalog, FarmModel } from '../../../../shared/farming';
import { farmAreas } from '../../../../shared/farming';
import { errorMessage } from '../../shared/http';
import { getFarmCatalog } from './farming-api';
import { FarmEvidencePanel, FarmRoadmap, GardenTrialPlan } from './FarmStrategy';

export function FarmModelsPage() {
  const [params] = useSearchParams();
  const [catalog, setCatalog] = useState<FarmCatalog>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getFarmCatalog(controller.signal).then(setCatalog).catch((failure) => {
      if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được dữ liệu nông nghiệp.'));
    });
    return () => controller.abort();
  }, [attempt]);
  if (error) return <div className="panel empty-state">
    <p role="alert">{error}</p>
    <button type="button" className="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>
  </div>;
  if (!catalog) return <p className="page-description" role="status">Đang tải dữ liệu nông nghiệp…</p>;

  const active = farmAreas.find(({ id }) => id === params.get('khu'));
  const models = active ? catalog.models.filter(({ area }) => area === active.id) : catalog.models;
  const trialAreas = catalog.plan.gardenPlans.map(({ leafArea, herbArea }) => leafArea + herbArea);
  const smallest = Math.min(...trialAreas);
  const largest = Math.max(...trialAreas);
  const trialLabel = smallest === largest ? String(smallest) : `${smallest}–${largest}`;

  return (
    <>
      <p className="page-description">Vườn khoảng {catalog.plan.gardenArea} m², có ao và một thửa ruộng nhỏ đang để trống.</p>
      <section className="panel bulletin-panel" aria-labelledby="farm-start-title">
        <h2 id="farm-start-title">Vườn là chỗ bắt đầu thuận tiện</h2>
        <p>Nếu bố mẹ tiện tưới và chăm, thử {trialLabel} m² rau gần nhà để dùng trước. Khi có người lấy lại và công chăm vừa sức, tăng thêm một luống.</p>
        <p className="secondary">Tận dụng thời gian chờ lứa rau để xem nước ao, khả năng thoát nước của ruộng và hỏi lịch vụ tại xã.</p>
      </section>

      <nav className="farm-nav" aria-label="Khu vực sản xuất">
        <Link className="button" to={{ search: '' }} aria-current={active ? undefined : 'page'}>Tất cả</Link>
        {farmAreas.map(({ id, label }) => (
          <Link key={id} className="button" to={{ search: `?khu=${id}` }} aria-current={active?.id === id ? 'page' : undefined}>{label}</Link>
        ))}
      </nav>

      <FarmRoadmap area={active?.id} plan={catalog.plan} />

      <section className="farm-model-section" aria-labelledby="farm-models-title">
        <h2 id="farm-models-title">{active ? `Mô hình cho ${active.label.toLowerCase()}` : 'Mô hình cho vườn, ao và ruộng'}</h2>
        <div className="story-grid farm-models">
          {models.map((model) => <FarmModelCard key={model.id} model={model} />)}
        </div>
      </section>

      {(!active || active.id === 'vuon') && <GardenTrialPlan plan={catalog.plan} />}

      <FarmEvidencePanel key={active?.id ?? 'all'} area={active?.id} items={catalog.evidence} />

      <section className="panel bulletin-panel" aria-labelledby="farm-record-title">
        <h2 id="farm-record-title">Ghi lại sau mỗi lứa</h2>
        <p>Ghi tiền giống, vật tư, điện nước, công thuê, bao gói và giao hàng. Tách số giờ bố mẹ chăm, lượng dùng trong nhà, lượng bán và lượng hỏng.</p>
        <p><strong>Tiền mặt còn lại</strong> bằng tiền bán thực nhận trừ tổng chi tiền của lứa. Khi bán theo kg, lấy tổng chi tiền chia số kg thực bán để tính giá hòa vốn tiền mặt. Xem thêm công chăm và giá trị thực phẩm gia đình dùng khi quyết định làm tiếp.</p>
      </section>
    </>
  );
}

function FarmModelCard({ model }: { model: FarmModel }) {
  const area = farmAreas.find(({ id }) => id === model.area)?.label;

  return (
    <article className="panel bulletin-panel story-card farm-model">
      <p className="story-meta">{area}</p>
      <h3>{model.title}</h3>
      <p>{model.fit}</p>
      <details>
        <summary aria-label={`Xem cách làm ${model.title}`}>Xem cách làm</summary>
        <dl className="ranking-facts">
          <div><dt>Công chăm</dt><dd>{model.care}</dd></div>
          <div><dt>Lứa thử</dt><dd>{model.pilot}</dd></div>
          <div><dt>Chi phí cần tính</dt><dd>{model.costs}</dd></div>
          <div><dt>Dùng hoặc bán cho ai</dt><dd>{model.outlet}</dd></div>
          <div><dt>Điều kiện làm tiếp</dt><dd>{model.decision}</dd></div>
        </dl>
        <ul className="ranking-signal-sources" aria-label="Nguồn tham khảo">
          {model.sources.map(({ label, url }) => <li key={url}><a href={url}>{label}</a></li>)}
        </ul>
      </details>
    </article>
  );
}

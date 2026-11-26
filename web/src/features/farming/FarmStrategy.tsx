import { useState } from 'react';
import type { FarmAreaId, FarmEvidence, FarmPlan } from '../../../../shared/farming';
import { CountChart } from '../../shared/CountChart';

export function FarmRoadmap({ area, plan }: { area: FarmAreaId | undefined; plan: FarmPlan }) {
  const strategy = area ? plan.strategy[area] : undefined;
  return (
    <section className="panel bulletin-panel" aria-labelledby="farm-roadmap-title">
      <h2 id="farm-roadmap-title">{strategy?.title ?? 'Lộ trình 60–90 ngày'}</h2>
      {strategy ? (
        <>
          <p>{strategy.summary}</p>
          <p>{strategy.decision}</p>
        </>
      ) : (
        <ol className="farm-roadmap">
          {plan.rollout.map(({ period, action }) => <li key={period}><strong>{period}</strong><p>{action}</p></li>)}
        </ol>
      )}
    </section>
  );
}

export function GardenTrialPlan({ plan: { gardenArea, gardenPlans } }: { plan: FarmPlan }) {
  const [chosenId, setChosenId] = useState('');
  const scenario = gardenPlans.find(({ id }) => id === chosenId) ?? gardenPlans[0];
  if (!scenario) return null;
  const trialArea = scenario.leafArea + scenario.herbArea;
  return (
    <section className="farm-trial" aria-label="Chọn diện tích thử">
      <fieldset className="farm-trial-options">
        <legend>Công chăm vườn</legend>
        <div>
          {gardenPlans.map((option) => (
            <label key={option.id}>
              <input type="radio" name="garden-care" checked={option.id === scenario.id} onChange={() => setChosenId(option.id)} />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>
      <CountChart
        title={`Phân bổ thử cho vườn ${gardenArea} m²`}
        data={[
          { label: 'Rau ăn lá', count: scenario.leafArea },
          { label: 'Rau gia vị', count: scenario.herbArea },
          { label: 'Phần giữ hiện trạng và lối đi', count: gardenArea - trialArea },
        ]}
        unit="m²"
        maximum={gardenArea}
        description={`Thử ${trialArea} m² trong lứa đầu. Chọn vị trí theo cây đang có, góc nhiều nắng và chỗ dễ tưới.`}
      />
    </section>
  );
}

export function FarmEvidencePanel({ area, items }: { area: FarmAreaId | undefined; items: FarmEvidence[] }) {
  const evidence = area ? items.filter((item) => item.area === area) : items;
  return (
    <details className="panel bulletin-panel farm-evidence">
      <summary>Số liệu tham khảo ({evidence.length} nguồn)</summary>
      <p className="secondary">Số liệu gắn với địa phương, thời điểm hoặc quy mô được nêu. Lấy giá, công chăm và sản lượng của nhà mình từ khảo sát và lứa thử tại chỗ.</p>
      <ul>
        {evidence.map(({ id, title, observed, application, source }) => (
          <li key={id}>
            <h3>{title}</h3>
            <p>{observed}</p>
            <p>{application}</p>
            <a href={source.url}>{source.label}</a>
          </li>
        ))}
      </ul>
    </details>
  );
}

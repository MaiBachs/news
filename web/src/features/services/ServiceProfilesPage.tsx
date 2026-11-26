import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { serviceLineLabels, serviceLines } from '../../../../shared/services';
import type { ServiceLine, ServiceProfile } from '../../../../shared/services';
import { errorMessage } from '../../shared/http';
import { ServiceProfileDetail } from './ServiceProfileDetail';
import { decisionLabels, priceRange, riskLabels } from './service-display';
import { getServiceProfiles } from './services-api';

export function ServiceProfilesPage() {
  const [params] = useSearchParams();
  const selected = serviceLines.find((line) => line === params.get('nghe'));
  const detail = useRef<HTMLDivElement>(null);
  const [profiles, setProfiles] = useState<ServiceProfile[]>();
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    getServiceProfiles(controller.signal).then(setProfiles).catch((failure) => {
      if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được hồ sơ nghề dịch vụ.'));
    });
    return () => controller.abort();
  }, [attempt]);
  useEffect(() => {
    if (selected && profiles) detail.current?.focus();
  }, [selected, profiles]);

  if (error) return <div className="panel empty-state">
    <p role="alert">{error}</p>
    <button type="button" className="button" onClick={() => { setError(''); setAttempt(attempt + 1); }}>Thử lại</button>
  </div>;
  if (!profiles) return <p className="page-description" role="status">Đang tải hồ sơ nghề…</p>;

  const byLine = new Map(profiles.map((profile) => [profile.id, profile]));
  const active = selected ? byLine.get(selected) : undefined;
  return <>
    <nav className="service-grid" aria-label="8 nghề dịch vụ">
      {serviceLines.map((line) => <ServiceCard key={line} line={line} profile={byLine.get(line)} selected={line === selected} />)}
    </nav>
    {(selected || !profiles.length) && <div ref={detail} tabIndex={-1}>
      {active ? <ServiceProfileDetail profile={active} /> : <div className="panel empty-state">
        <h2>{selected ? serviceLineLabels[selected] : 'Chưa có hồ sơ nghề dịch vụ'}</h2>
        {selected && <p>Chưa có hồ sơ.</p>}
        <p>Nhập hồ sơ bằng <code>npm run import:services -- &lt;tệp JSON&gt;</code>.</p>
      </div>}
    </div>}
  </>;
}

function ServiceCard({ line, profile, selected }: { line: ServiceLine; profile: ServiceProfile | undefined; selected: boolean }) {
  const price = [...(profile?.prices ?? [])].sort((left, right) => (
    Number(right.market === 'VIETNAM') - Number(left.market === 'VIETNAM') || right.observedOn.localeCompare(left.observedOn)
  ))[0];
  return <Link className="panel service-card" to={`?nghe=${line}`} aria-label={serviceLineLabels[line]}
    aria-current={selected ? 'page' : undefined}>
    <h2>{serviceLineLabels[line]}</h2>
    {profile ? <>
      <p className="service-decision">{decisionLabels[profile.decision]}</p>
      <dl className="service-card-facts">
        <div><dt>Giá tham khảo</dt><dd>{price ? priceRange(price) : 'Chưa ghi nhận'}</dd></div>
        <div><dt>Mức AI thay thế</dt><dd>{riskLabels[profile.aiShift.replacementRisk]}</dd></div>
        <div><dt>Tín hiệu trong 30 ngày</dt><dd>{profile.signals30d ?? 'Chờ dữ liệu'}</dd></div>
      </dl>
    </> : <p className="secondary">Chưa có hồ sơ</p>}
  </Link>;
}

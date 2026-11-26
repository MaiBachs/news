import { markets, purposes } from '../../../../shared/sources';
import type { FeedSource } from '../../../../shared/sources';
import { marketLabels } from '../../shared/market-labels';
import { purposeLabels } from './source-labels';

export function SourceStatusChart({ sources, mode }: { sources: FeedSource[]; mode: 'admin' | 'library' }) {
  const groups = mode === 'library'
    ? markets.map((market) => ({
      label: marketLabels[market],
      sources: sources.filter((source) => source.purpose === 'LIBRARY' && source.market === market),
    }))
    : purposes.map((purpose) => ({
      label: purposeLabels[purpose],
      sources: sources.filter((source) => source.purpose === purpose),
    }));
  const rows = groups.map(({ label, sources: group }) => {
    const enabled = group.filter((source) => source.enabled).length;
    return { label, enabled, disabled: group.length - enabled };
  });
  const max = rows.reduce((highest, row) => Math.max(highest, row.enabled, row.disabled), 1);
  const title = mode === 'library' ? 'Nguồn Thư viện theo thị trường' : 'Trạng thái nguồn theo mục sử dụng';

  return (
    <figure className="panel chart-panel" aria-label={title}>
      <figcaption><h2>{title}</h2></figcaption>
      <ul className="chart-status-grid">
        {rows.map(({ label, enabled, disabled }) => (
          <li key={label}>
            <h3>{label}</h3>
            <div className="chart-status-row">
              <span>Đang bật</span>
              <meter className="chart-meter" min={0} max={max} value={enabled} aria-hidden="true" />
              <strong>{enabled}</strong>
            </div>
            <div className="chart-status-row">
              <span>Đã tắt</span>
              <meter className="chart-meter chart-meter-muted" min={0} max={max} value={disabled} aria-hidden="true" />
              <strong>{disabled}</strong>
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}

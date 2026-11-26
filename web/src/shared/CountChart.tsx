interface CountChartProps {
  title: string;
  data: ReadonlyArray<{ label: string; count: number }>;
  unit: string;
  maximum?: number;
  columns?: boolean;
  description?: string;
  emptyMessage?: string;
}

export function CountChart({ title, data, unit, maximum, columns, description, emptyMessage }: CountChartProps) {
  const max = data.reduce((highest, row) => Math.max(highest, row.count), maximum ?? 1);
  const layout = columns && data.length <= 7 ? 'chart-count chart-columns' : 'chart-count';

  return (
    <figure className="panel chart-panel" aria-label={title}>
      <figcaption>
        <h2>{title}</h2>
        {description && <p className="secondary">{description}</p>}
      </figcaption>
      {data.length === 0 ? <p className="secondary">{emptyMessage ?? 'Chưa có dữ liệu.'}</p> : (
        <ul className={layout}>
          {data.map(({ label, count }) => (
            <li key={label}>
              <div className="chart-count-label">
                <span className="chart-count-name">{label}</span>
                <strong className="chart-count-value">{count} <span>{unit}</span></strong>
              </div>
              <meter className="chart-meter" min={0} max={max} value={count} aria-hidden="true" />
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}

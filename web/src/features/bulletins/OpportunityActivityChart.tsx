import { useEffect, useState } from 'react';
import type { OpportunityMonth } from '../../../../shared/bulletins';
import { CountChart } from '../../shared/CountChart';
import { errorMessage } from '../../shared/http';
import { getOpportunityActivity } from './bulletin-api';

const monthFormatter = new Intl.DateTimeFormat('vi-VN', { month: '2-digit', year: 'numeric', timeZone: 'UTC' });

export function OpportunityActivityChart() {
  const [months, setMonths] = useState<OpportunityMonth[]>();
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    getOpportunityActivity(controller.signal).then(setMonths).catch((failure) => {
      if (!controller.signal.aborted) setError(errorMessage(failure, 'Chưa đọc được thống kê giả thuyết.'));
    });
    return () => controller.abort();
  }, []);

  if (error) return <p className="feedback error" role="alert">{error}</p>;
  if (!months) return <p className="page-description" role="status">Đang tải thống kê giả thuyết…</p>;

  const data = months.map(({ month, count }) => ({
    label: monthFormatter.format(new Date(`${month}-01T00:00:00Z`)),
    count,
  }));
  return (
    <CountChart
      title="Giả thuyết được ghi nhận theo tháng"
      unit="giả thuyết"
      columns
      data={data}
      description="Tối đa 12 tháng gần nhất có bản tin. Tiêu đề trùng chỉ tính một lần trong cùng tháng."
    />
  );
}

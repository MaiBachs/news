import type { ArchiveDateCounts, BulletinStory } from '../../../../shared/bulletins';
import { markets } from '../../../../shared/sources';
import { CountChart } from '../../shared/CountChart';
import { marketLabels } from '../../shared/market-labels';
import { formatBulletinDate } from './bulletin-date';

export function BulletinMarketChart({ stories }: { stories: BulletinStory[] }) {
  const data = markets.map((market) => ({
    label: marketLabels[market],
    count: stories.filter((story) => story.market === market).length,
  }));
  return <CountChart title="Tin theo thị trường" unit="tin" data={data} />;
}

const maxChartDates = 7;

export function PublicationDateChart({ dates, olderCount, undatedCount }: ArchiveDateCounts) {
  const data = dates.map(({ date, count }) => ({ label: formatBulletinDate(date, 'short'), count }));
  const notes = [];
  if (olderCount) notes.push(`Hiển thị ${maxChartDates} ngày đăng gần nhất có tin. ${olderCount} tin cũ hơn vẫn có trong danh sách.`);
  if (undatedCount) notes.push(`${undatedCount} mục chưa rõ ngày đăng.`);

  return (
    <CountChart
      title="Tin theo ngày đăng"
      unit="tin"
      columns
      data={data}
      description={notes.join(' ')}
      emptyMessage="Chưa có tin ghi rõ ngày đăng trong phạm vi này."
    />
  );
}

import type { RankingDecision } from '../../../../shared/rankings';
import type { ServicePrice, ServiceProfile } from '../../../../shared/services';

export const decisionLabels: Record<RankingDecision, string> = {
  PILOT: 'Nên thử', VALIDATE: 'Cần kiểm chứng', EXCLUDE: 'Loại khỏi ưu tiên',
};

export const riskLabels: Record<ServiceProfile['aiShift']['replacementRisk'], string> = {
  LOW: 'Thấp', MEDIUM: 'Trung bình', HIGH: 'Cao',
};

export function priceRange({ low, high, currency, unit }: ServicePrice) {
  const formatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency, maximumFractionDigits: 2 });
  const amount = low === high ? formatter.format(low) : `${formatter.format(low)} – ${formatter.format(high)}`;
  return `${amount} / ${unit}`;
}

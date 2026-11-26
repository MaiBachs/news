import { farmAreas } from '../../../../../shared/farming.js';
import type { FarmAreaId, FarmCatalog, FarmModel, FarmEvidence, FarmPlan } from '../../../../../shared/farming.js';

export function readFarmUpdate(input: unknown): Partial<FarmCatalog> {
  const data = object(input);
  const update: Partial<FarmCatalog> = {};
  if (data.models !== undefined) update.models = records(data.models, readModel);
  if (data.evidence !== undefined) update.evidence = records(data.evidence, readEvidence);
  if (data.plan !== undefined) update.plan = readPlan(data.plan);
  if (!update.models?.length && !update.evidence?.length && !update.plan) throw new Error('Cần ít nhất một mục nông nghiệp để cập nhật.');
  return update;
}

function readModel(value: unknown): FarmModel {
  const item = object(value);
  if (!Array.isArray(item.sources) || !item.sources.length) throw new Error('Mô hình cần nguồn tham khảo.');
  return {
    id: text(item.id), area: readArea(item.area), title: text(item.title), fit: text(item.fit), care: text(item.care),
    pilot: text(item.pilot), costs: text(item.costs), outlet: text(item.outlet), decision: text(item.decision),
    sources: item.sources.map(readSource),
  };
}

function readEvidence(value: unknown): FarmEvidence {
  const item = object(value);
  return { id: text(item.id), area: readArea(item.area), title: text(item.title), observed: text(item.observed),
    application: text(item.application), source: readSource(item.source) };
}

function readPlan(value: unknown): FarmPlan {
  const item = object(value);
  const strategy = object(item.strategy);
  function explain(area: FarmAreaId) {
    const entry = object(strategy[area]);
    return { title: text(entry.title), summary: text(entry.summary), decision: text(entry.decision) };
  }
  const gardenArea = positiveInteger(item.gardenArea);
  const gardenPlans = records(item.gardenPlans, (value) => {
    const entry = object(value);
    const leafArea = positiveInteger(entry.leafArea);
    const herbArea = positiveInteger(entry.herbArea);
    if (leafArea + herbArea > gardenArea) throw new Error('Diện tích trồng vượt diện tích vườn.');
    return { id: text(entry.id), label: text(entry.label), leafArea, herbArea };
  });
  if (!gardenPlans.length || !Array.isArray(item.rollout) || !item.rollout.length) throw new Error('Kế hoạch cần lộ trình và phương án diện tích.');
  return {
    strategy: { vuon: explain('vuon'), ao: explain('ao'), ruong: explain('ruong') }, gardenArea, gardenPlans,
    rollout: item.rollout.map((value) => {
      const step = object(value);
      return { period: text(step.period), action: text(step.action) };
    }),
  };
}

function readSource(value: unknown) {
  const item = object(value);
  const url = URL.parse(text(item.url));
  if (!url || url.protocol !== 'https:' || url.username || url.password) throw new Error('Nguồn nông nghiệp cần URL HTTPS hợp lệ.');
  return { label: text(item.label), url: url.href };
}

function readArea(value: unknown) {
  const area = farmAreas.find(({ id }) => id === value);
  if (!area) throw new Error('Khu vực nông nghiệp không hợp lệ.');
  return area.id;
}

function records<T extends { id: string }>(value: unknown, parse: (item: unknown) => T) {
  if (!Array.isArray(value)) throw new Error('Danh sách dữ liệu nông nghiệp không hợp lệ.');
  const entries = value.map(parse);
  if (new Set(entries.map(({ id }) => id)).size !== entries.length) throw new Error('Mã mục nông nghiệp trùng trong tệp nhập.');
  return entries;
}

function positiveInteger(value: unknown) {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 1) throw new Error('Diện tích cần là số nguyên dương.');
  return value;
}

function text(value: unknown) {
  if (typeof value !== 'string' || !value.trim()) throw new Error('Thiếu nội dung mục nông nghiệp.');
  return value.trim();
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Mục nông nghiệp cần là đối tượng.');
  return value as Record<string, unknown>;
}

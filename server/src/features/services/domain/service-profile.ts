import { competitorOverlaps, competitorTypes, rankingDecisions } from '../../../../../shared/rankings.js';
import type { RankingCompetitor, RankingSignal, RankingSource } from '../../../../../shared/rankings.js';
import { serviceLines } from '../../../../../shared/services.js';
import type { ServicePrice, ServiceProfile } from '../../../../../shared/services.js';
import { markets } from '../../../../../shared/sources.js';

export function parseServiceProfiles(input: unknown): ServiceProfile[] {
  const profiles = list(input, 'Hồ sơ nghề').map(parseProfile);
  if (!profiles.length) throw new Error('Cần ít nhất một hồ sơ nghề.');
  if (new Set(profiles.map(({ id, date }) => `${id}/${date}`)).size !== profiles.length) {
    throw new Error('Có hồ sơ trùng mã nghề và ngày trong tệp.');
  }
  return profiles;
}

function parseProfile(input: unknown): ServiceProfile {
  const raw = object(input, 'Hồ sơ nghề');
  const id = choice(raw.id, serviceLines, 'Mã nghề');
  const sources = list(raw.sources, 'Nguồn').map(parseSource);
  const sourceIds = new Set(sources.map(({ id }) => id));
  if (sourceIds.size !== sources.length) throw new Error('Mã nguồn bị trùng trong hồ sơ.');
  if (id === 'BOOKKEEPING' && raw.legal === undefined) throw new Error('Hồ sơ kế toán cần thông tin pháp lý và ít nhất một nguồn.');
  const legal = raw.legal === undefined ? undefined : parseSignal(raw.legal, sourceIds, 'Thông tin pháp lý');
  const ai = object(raw.aiShift, 'Thay đổi do AI');
  const learning = object(raw.learning, 'Lộ trình học');
  const offer = object(raw.offer, 'Gói dịch vụ');
  const weeks = number(learning.weeks, 'Số tuần học');
  const signals30d = raw.signals30d === undefined ? undefined : number(raw.signals30d, 'Số tín hiệu trong 30 ngày');
  if (signals30d !== undefined && !Number.isSafeInteger(signals30d)) throw new Error('Số tín hiệu trong 30 ngày phải là số nguyên.');
  return {
    id, date: date(raw.date, 'Ngày hồ sơ'), decision: choice(raw.decision, rankingDecisions, 'Quyết định'),
    demand: parseSignal(raw.demand, sourceIds, 'Nhu cầu'),
    prices: list(raw.prices, 'Bảng giá').map((entry) => parsePrice(entry, sourceIds)),
    aiShift: {
      automated: text(ai.automated, 'Việc AI xử lý'), stillHuman: text(ai.stillHuman, 'Việc cần con người'),
      replacementRisk: choice(ai.replacementRisk, ['LOW', 'MEDIUM', 'HIGH'], 'Mức thay thế bởi AI'),
    },
    tools: list(raw.tools, 'Công cụ').map((entry) => {
      const tool = object(entry, 'Công cụ');
      return { name: text(tool.name, 'Tên công cụ'), use: text(tool.use, 'Cách dùng'), cost: text(tool.cost, 'Chi phí công cụ'), sourceId: reference(tool.sourceId, sourceIds) };
    }),
    learning: { weeks, prerequisites: text(learning.prerequisites, 'Kiến thức cần có'), path: text(learning.path, 'Lộ trình học') },
    offer: {
      name: text(offer.name, 'Tên gói dịch vụ'), deliverable: text(offer.deliverable, 'Kết quả bàn giao'),
      price: text(offer.price, 'Giá gói dịch vụ'), turnaround: text(offer.turnaround, 'Thời gian bàn giao'),
    },
    competitors: list(raw.competitors, 'Đối thủ').map((entry) => parseCompetitor(entry, sourceIds)),
    ...(legal ? { legal } : {}), test: text(raw.test, 'Phép thử'), sources,
    ...(signals30d === undefined ? {} : { signals30d }),
  };
}

function parsePrice(input: unknown, sourceIds: ReadonlySet<string>): ServicePrice {
  const raw = object(input, 'Giá dịch vụ');
  const low = number(raw.low, 'Giá thấp nhất');
  const high = number(raw.high, 'Giá cao nhất');
  if (low > high) throw new Error('Giá thấp nhất không được cao hơn giá cao nhất.');
  return {
    item: text(raw.item, 'Hạng mục giá'), low, high, currency: choice(raw.currency, ['VND', 'USD'], 'Tiền tệ'),
    unit: text(raw.unit, 'Đơn vị giá'), market: choice(raw.market, markets, 'Thị trường'),
    observedOn: date(raw.observedOn, 'Ngày ghi nhận giá'), sourceId: reference(raw.sourceId, sourceIds),
  };
}

function parseSource(input: unknown): RankingSource {
  const raw = object(input, 'Nguồn');
  const url = URL.parse(text(raw.url, 'Địa chỉ nguồn'));
  if (!url || url.protocol !== 'https:' || url.username || url.password) throw new Error('Địa chỉ nguồn phải là URL HTTPS hợp lệ.');
  return { id: text(raw.id, 'Mã nguồn'), label: text(raw.label, 'Tên nguồn'), url: url.href };
}

function parseSignal(input: unknown, sourceIds: ReadonlySet<string>, field: string): RankingSignal {
  const raw = object(input, field);
  const ids = list(raw.sourceIds, `Nguồn của ${field.toLowerCase()}`).map((id) => reference(id, sourceIds));
  if (!ids.length) throw new Error(`${field} cần ít nhất một nguồn.`);
  return { assessment: text(raw.assessment, field), sourceIds: [...new Set(ids)] };
}

function parseCompetitor(input: unknown, sourceIds: ReadonlySet<string>): RankingCompetitor {
  const raw = object(input, 'Đối thủ');
  return {
    name: text(raw.name, 'Tên đối thủ'), type: choice(raw.type, competitorTypes, 'Loại đối thủ'),
    overlap: choice(raw.overlap, competitorOverlaps, 'Mức trùng phạm vi'), coverage: text(raw.coverage, 'Phạm vi của đối thủ'),
    sourceId: reference(raw.sourceId, sourceIds),
  };
}

function object(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${field} phải là một đối tượng.`);
  return value as Record<string, unknown>;
}

function list(value: unknown, field: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${field} phải là một danh sách.`);
  return value;
}

function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${field} không được để trống.`);
  return value.trim();
}

function number(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) throw new Error(`${field} phải là số không âm.`);
  return value;
}

function date(value: unknown, field: string): string {
  const result = text(value, field);
  const day = new Date(`${result}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== result) {
    throw new Error(`${field} phải là ngày hợp lệ theo mẫu YYYY-MM-DD.`);
  }
  return result;
}

function choice<T extends string>(value: unknown, values: readonly T[], field: string): T {
  const match = values.find((candidate) => candidate === value);
  if (!match) throw new Error(`${field} không hợp lệ.`);
  return match;
}

function reference(value: unknown, sourceIds: ReadonlySet<string>): string {
  const id = text(value, 'Mã nguồn');
  if (!sourceIds.has(id)) throw new Error(`Mã nguồn ${id} không có trong danh sách.`);
  return id;
}

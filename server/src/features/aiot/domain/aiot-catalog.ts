import { aiotPartKinds, chatbotChannels } from '../../../../../shared/aiot.js';
import type { AiotCatalog, AiotPart, AiotSolution } from '../../../../../shared/aiot.js';
import { competitorOverlaps, competitorTypes, rankingDecisions } from '../../../../../shared/rankings.js';
import type { RankingCompetitor, RankingSource } from '../../../../../shared/rankings.js';
import { markets } from '../../../../../shared/sources.js';

export function parseAiotCatalog(input: unknown): AiotCatalog {
  const raw = object(input, 'Danh mục AIoT');
  const sources = list(raw.sources, 'Danh sách nguồn').map(parseSource);
  const sourceIds = unique(sources.map(({ id }) => id), 'Mã nguồn');
  const parts = list(raw.parts, 'Danh sách linh kiện').map((part) => parsePart(part, sourceIds));
  const partIds = unique(parts.map(({ id }) => id), 'Mã linh kiện');
  const solutions = list(raw.solutions, 'Danh sách giải pháp').map((solution) => parseSolution(solution, partIds, sources));
  unique(solutions.map(({ id }) => id), 'Mã giải pháp');
  return { date: date(raw.date, 'Ngày danh mục'), parts, solutions, sources };
}

function parseSource(input: unknown): RankingSource {
  const raw = object(input, 'Nguồn');
  const url = URL.parse(text(raw.url, 'Địa chỉ nguồn'));
  if (!url || url.protocol !== 'https:' || url.username || url.password) throw new Error('Địa chỉ nguồn phải là URL HTTPS hợp lệ.');
  return { id: text(raw.id, 'Mã nguồn'), label: text(raw.label, 'Tên nguồn'), url: url.href };
}

function parsePart(input: unknown, sources: ReadonlySet<string>): AiotPart {
  const raw = object(input, 'Linh kiện');
  let price: AiotPart['price'];
  if (raw.price !== undefined) {
    const data = object(raw.price, 'Giá linh kiện');
    if (typeof data.value !== 'number' || !Number.isFinite(data.value) || data.value < 0) {
      throw new Error('Giá linh kiện phải là số không âm.');
    }
    price = { value: data.value, currency: choice(data.currency, ['VND', 'USD'], 'Tiền tệ'), observedOn: date(data.observedOn, 'Ngày ghi nhận giá') };
  }
  return {
    id: text(raw.id, 'Mã linh kiện'), name: text(raw.name, 'Tên linh kiện'),
    kind: choice(raw.kind, aiotPartKinds, 'Loại linh kiện'), capability: text(raw.capability, 'Năng lực linh kiện'),
    ...(raw.signal === undefined ? {} : { signal: choice(raw.signal, ['ENABLER'] as const, 'Mã tín hiệu linh kiện') }),
    sourceId: reference(raw.sourceId, sources, 'Mã nguồn'), ...(price ? { price } : {}),
  };
}

function parseSolution(input: unknown, parts: ReadonlySet<string>, catalogSources: RankingSource[]): AiotSolution {
  const raw = object(input, 'Giải pháp');
  const sources = list(raw.sources, 'Nguồn giải pháp').map(parseSource);
  if (!sources.length) throw new Error('Mỗi giải pháp cần ít nhất một nguồn.');
  unique(sources.map(({ id }) => id), 'Mã nguồn giải pháp');
  const sourceIds = new Set(catalogSources.map(({ id }) => id));
  for (const source of sources) {
    const existing = catalogSources.find(({ id }) => id === source.id);
    if (existing && existing.url !== source.url) throw new Error(`Mã nguồn ${source.id} trỏ tới hai URL khác nhau.`);
    sourceIds.add(source.id);
  }
  const partIds = list(raw.partIds, 'Mã linh kiện của giải pháp').map((id) => reference(id, parts, 'Mã linh kiện'));
  unique(partIds, 'Mã linh kiện của giải pháp');
  const chatbot = object(raw.chatbot, 'Chatbot');
  const channels = list(chatbot.channels, 'Kênh chatbot').map((channel) => choice(channel, chatbotChannels, 'Kênh chatbot'));
  if (!channels.length) throw new Error('Mỗi giải pháp cần ít nhất một kênh chatbot.');
  unique(channels, 'Kênh chatbot');
  const price = object(raw.pricing, 'Giá bán');
  return {
    id: text(raw.id, 'Mã giải pháp'), title: text(raw.title, 'Tên giải pháp'),
    problem: text(raw.problem, 'Bài toán'), customer: text(raw.customer, 'Khách hàng'), market: choice(raw.market, markets, 'Thị trường'),
    partIds, bomCost: text(raw.bomCost, 'Chi phí linh kiện'),
    chatbot: { channels, role: text(chatbot.role, 'Vai trò chatbot'), model: text(chatbot.model, 'Model chatbot') },
    pricing: { setup: text(price.setup, 'Phí lắp đặt'), ...(price.monthly === undefined ? {} : { monthly: text(price.monthly, 'Phí tháng') }) },
    competitors: list(raw.competitors, 'Đối thủ').map((item) => parseCompetitor(item, sourceIds)),
    decision: choice(raw.decision, rankingDecisions, 'Quyết định'), pilot: text(raw.pilot, 'Phép thử'),
    risks: text(raw.risks, 'Rủi ro'), sources,
  };
}

function parseCompetitor(input: unknown, sources: ReadonlySet<string>): RankingCompetitor {
  const raw = object(input, 'Đối thủ');
  return {
    name: text(raw.name, 'Tên đối thủ'), type: choice(raw.type, competitorTypes, 'Loại đối thủ'),
    overlap: choice(raw.overlap, competitorOverlaps, 'Mức trùng phạm vi'), coverage: text(raw.coverage, 'Phạm vi của đối thủ'),
    sourceId: reference(raw.sourceId, sources, 'Mã nguồn đối thủ'),
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

function date(value: unknown, field: string): string {
  const result = text(value, field);
  const day = new Date(`${result}T00:00:00.000Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || !Number.isFinite(day.getTime()) || day.toISOString().slice(0, 10) !== result) {
    throw new Error(`${field} phải là ngày hợp lệ theo mẫu YYYY-MM-DD.`);
  }
  return result;
}

function choice<T extends string>(value: unknown, values: readonly T[], field: string): T {
  const result = values.find((candidate) => candidate === value);
  if (!result) throw new Error(`${field} không hợp lệ.`);
  return result;
}

function unique(ids: string[], field: string): ReadonlySet<string> {
  const result = new Set(ids);
  if (result.size !== ids.length) throw new Error(`${field} bị trùng.`);
  return result;
}

function reference(input: unknown, ids: ReadonlySet<string>, field: string): string {
  const id = text(input, field);
  if (!ids.has(id)) throw new Error(`${field} ${id} không có trong danh sách.`);
  return id;
}
